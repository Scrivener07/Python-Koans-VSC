import { vscode } from '../services/vscode';
import * as monaco from 'monaco-editor';
import { Challenge, WebCommands } from "../../../shared/messaging";
import { StatusIcon, TestCase, TestStatus, TestSuite } from "../../../shared/testing";

/** Define a custom HTML element for challenges. */
export class KoanChallengeElement extends HTMLElement {

    /** The challenge data to use. */
    private _challenge: Challenge;

    private outputPanel: HTMLElement | null = null;
    private resultPanel: HTMLElement | null = null;

    private editor: monaco.editor.IStandaloneCodeEditor | undefined;
    private disposables: monaco.IDisposable[] = [];


    constructor() {
        super();
        this._challenge = {
            name: 'UNDEFINED',
            instruction: 'UNDEFINED',
            code: 'UNDEFINED'
        };
    }


    get challenge(): Challenge { return this._challenge; }
    set challenge(value: Challenge) {
        this._challenge = value;
        // Update UI if already connected.
        if (this.isConnected) {
            this.innerHTML = this.createTemplate();
        }
    }


    public override connectedCallback(): void {
        this.setAttribute('data-challenge-id', this._challenge.name);
        this.className = 'challenge-container';
        this.innerHTML = this.createTemplate();

        // Initialize Monaco after DOM is ready.
        setTimeout(() => this.initMonaco(), 0);

        // Cache references to frequently accessed elements.
        this.outputPanel = this.querySelector(`#${this._challenge.name}_stdout`);
        this.resultPanel = this.querySelector(`#${this._challenge.name}_results`);

        // Set up event listeners for buttons and other elements.
        const runButton = this.querySelector('.btn-run-tests');
        if (runButton) {
            runButton.addEventListener('click', () => {
                vscode.postMessage({
                    command: WebCommands.Code_RunTests,
                    member_id: this._challenge.name
                });
            });
        }
    }


    // Monaco
    //--------------------------------------------------

    // Initialize Monaco editor
    private initMonaco(): void {
        const editorContainer = this.querySelector<HTMLElement>(`#${this._challenge.name}_editor`);
        if (!editorContainer) { return; }

        editorContainer.innerHTML = '';

        // Get VS Code's current theme information.
        const isDarkTheme = document.body.classList.contains('vscode-dark');

        // Create Monaco editor.
        this.editor = monaco.editor.create(editorContainer, {
            value: this._challenge.code || '',
            language: 'python',
            theme: isDarkTheme ? 'vs-dark' : 'vs',
            automaticLayout: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            scrollbar: {
                vertical: 'auto',
                horizontal: 'auto'
            },
            lineHeight: 18,
            padding: { top: 8, bottom: 8 },
            fontSize: 13,
            renderLineHighlight: 'all',
            tabSize: 4,
            insertSpaces: true,
            fontFamily: 'var(--vscode-editor-font-family)',
            contextmenu: false
        });

        // Listen for changes.
        this.disposables.push(
            this.editor.onDidChangeModelContent(() => {
                if (!this.editor) { return; }
                const code = this.editor.getValue();

                // Use existing debounce mechanism.
                vscode.postMessage({
                    command: WebCommands.Code_Update,
                    member_id: this._challenge.name,
                    code: code
                });
            })
        );

        // Add listener for theme changes.
        // window.addEventListener('message', this.handleThemeChange.bind(this));
    }

    // private disposeMonaco(): void {
    //     if (this.editor) {
    //         this.editor.dispose();
    //         this.editor = undefined;
    //     }

    //     this.disposables.forEach(item => item.dispose());
    //     this.disposables = [];
    // }

    // private handleThemeChange(event: MessageEvent): void {
    //     const message = event.data;
    //     if (message.type === 'vscode-theme-changed') {
    //         if (!this.editor) { return; }
    //         const isDarkTheme = message.theme.includes('dark') || message.theme.includes('black');
    //         monaco.editor.setTheme(isDarkTheme ? 'vs-dark' : 'vs');
    //     }
    // }

    // private updateCode(code: string): void {
    //     if (this.editor) {
    //         this.editor.setValue(code);
    //     }
    // }

    // private getCode(): string {
    //     return this.editor ? this.editor.getValue() : '';
    // }

    // This is an override!
    // private focus(): void {
    //     if (this.editor) {
    //         this.editor.focus();
    //     }
    // }


    // Data
    //--------------------------------------------------

    public update(suite: TestSuite): void {
        if (!suite.cases || suite.cases.length !== 1) {
            console.error(`Invalid test suite data: ${suite.cases?.length || 0} cases`);
            return;
        }

        // Display only the first test case for now.
        const testCase: TestCase = suite.cases[0];

        if (this.resultPanel) {
            // Build test results content
            let resultsContent: string = '';

            // Add test status and message
            resultsContent += `<div class="test-item">${testCase.message}</div>`;

            // Add assertions if available
            if (testCase.assertions && testCase.assertions.length > 0) {
                resultsContent += '<h4>Assertions:</h4>';
                for (const assertion of testCase.assertions) {
                    const assertClass = assertion.passed ? 'pass' : 'fail';
                    resultsContent += `<div class="assertion ${assertClass}">${assertion.message}</div>`;
                }
            }

            // Create results container
            const resultClass = suite.status === TestStatus.Passed ? 'pass' : 'fail';
            const icon = suite.status === TestStatus.Passed ? StatusIcon.Passed : StatusIcon.Failed;
            this.resultPanel.innerHTML = `<div class="test-result ${resultClass}">${icon} ${resultsContent}</div>`;
        }

        // Update standard output
        if (this.outputPanel) {
            if (suite.output && suite.output.length > 0) {
                let stdoutContent = '';
                for (const output of suite.output) {
                    stdoutContent += `<div class="output-line">${String(output)}</div>`;
                }
                this.outputPanel.innerHTML = stdoutContent;
            } else {
                this.outputPanel.innerHTML = '<div class="output-placeholder">No output from your code</div>';
            }
        }

        // Update status indicator
        const statusIndicator = this.querySelector('.challenge-status');
        if (statusIndicator) {
            const resultClass = suite.status === TestStatus.Passed ? 'pass' : 'fail';
            const icon = suite.status === TestStatus.Passed ? StatusIcon.Passed : StatusIcon.Failed;
            statusIndicator.textContent = icon;
            statusIndicator.setAttribute('data-status', resultClass.toLowerCase());
        }
    }


    // Render
    //--------------------------------------------------

    private createTemplate(): string {
        return `
        <details>
            ${this.header()}
            ${this.instructions()}
            ${this.code()}
            ${this.output()}
            ${this.results()}
        </details>
        `;
    }


    private header(): string {
        return `
        <summary>
            <div class="challenge-header">
                <div class="challenge-title">
                    <h2>${this.challenge.name}</h2>
                    <span class="challenge-status" data-status="pending">○</span>
                </div>

                <div class="challenge-controls">
                    <button class="btn-secondary" onclick="toggleChallenge('${this.challenge.name}')">
                        <span class="icon">📖</span> View Instructions
                    </button>
                    <button class="btn-secondary" onclick="openCodeCell('${this.challenge.name}')">
                        <span class="icon">📝</span> Open Code Cell
                    </button>
                    <button class="btn-primary" onclick="runChallenge('${this.challenge.name}')">
                        <span class="icon">▶</span> Run Tests
                    </button>
                </div>
            </div>
        </summary>
        `;
    }


    private instructions(): string {
        return `
        <div class="challenge-instructions" id="${this.challenge.name}_instructions">
            <div class="instructions-content">
                ${this.challenge.instruction}
            </div>
        </div>
        `;
    }


    private code(): string {
        return `
        <div class="challenge-code-section">
            <div class="code-header">
                <span class="code-label">Your Solution</span>
                <div class="code-actions">
                    <button class="btn-icon" onclick="resetChallenge('${this.challenge.name}')" title="Reset to original">
                        <span class="icon">↺</span>
                    </button>
                    <button class="btn-icon" onclick="formatCode('${this.challenge.name}')" title="Format code">
                        <span class="icon">✨</span>
                    </button>
                </div>
            </div>
            <div class="code-editor" id="${this.challenge.name}_editor">
                <pre id="${this.challenge.name}_code">${this.challenge.code}</pre>
            </div>
        </div>
        `;
    }


    private output(): string {
        return `
        <div class="challenge-output-section">

            <div class="output-header">
                <span class="output-label">Standard Output</span>
            </div>

            <div class="output-content" id="${this.challenge.name}_stdout">
                <div class="output-placeholder">
                    No output from your code yet...
                </div>
            </div>

        </div>
        `;
    }


    private results(): string {
        return `
        <div class="challenge-results-section">

            <div class="results-header">
                <span class="results-label">Test Results</span>
                <div class="results-actions">
                    <button class="btn-icon" onclick="clearResults('${this.challenge.name}')" title="Clear results">
                        <span class="icon">🗑</span>
                    </button>
                </div>
            </div>

            <div class="results-content" id="${this.challenge.name}_results">
                <div class="results-placeholder">
                    Run tests to see results here...
                </div>
            </div>

        </div>
        `;
    }


    // Methods
    //--------------------------------------------------

    public clearResults(): void {
        if (this.outputPanel) {
            this.outputPanel.innerHTML = '<div class="output-placeholder">No output from your code yet...</div>';
        }

        if (this.resultPanel) {
            this.resultPanel.innerHTML = '<div class="results-placeholder">Run tests to see results here...</div>';
        }
    }


}
