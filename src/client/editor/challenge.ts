import { vscode } from './vscode';
import { Challenge, WebCommands } from "../../shared/messaging";
import { StatusIcon, TestCase, TestStatus, TestSuite } from "../../shared/testing";

// import * as monaco from 'monaco-editor';
declare const monaco: any;


/** Define a custom HTML element for challenges. */
export class KoanChallengeElement extends HTMLElement {

    /** The challenge data to use. */
    private _challenge: Challenge;

    private outputPanel: HTMLElement | null = null;
    private resultPanel: HTMLElement | null = null;

    private _editorInstance: any = null; // Add this line


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

        // Initialize Monaco if it's already ready
        if (window.monacoIsReady) {
            this.initializeMonacoEditor();
        } else {
            // Otherwise wait for the event
            window.addEventListener('monaco-ready', () => {
                this.initializeMonacoEditor();
            }, { once: true });
        }
    }


    private initializeMonacoEditor(): void {
        console.log(`Initializing Monaco for ${this._challenge.name}`);

        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
            const editorContainer = this.querySelector(`#${this._challenge.name}_editor`);
            const codeElement = this.querySelector(`#${this._challenge.name}_code`);

            if (!editorContainer || !codeElement || !window.monaco) {
                console.error('Cannot initialize Monaco - missing required elements or Monaco');
                return;
            }

            try {
                console.log('Creating Monaco editor instance');
                const initialValue = codeElement.textContent || '';

                // Remove the placeholder element
                codeElement.remove();

                // Create editor with explicit container
                const editor = window.monaco.editor.create(editorContainer, {
                    value: initialValue,
                    language: 'python',
                    theme: 'vs-dark',
                    automaticLayout: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    lineNumbers: 'on',
                    tabSize: 4,
                    insertSpaces: true
                });

                // Store the editor instance
                this._editorInstance = editor;

                // Add change handler
                editor.onDidChangeModelContent(() => {
                    const code = editor.getValue();
                    const event = new CustomEvent('editor-change', {
                        detail: {
                            challengeId: this._challenge.name,
                            code: code
                        }
                    });
                    document.dispatchEvent(event);
                });

                console.log('Monaco editor initialized successfully');
            } catch (e) {
                console.error('Error initializing Monaco:', e);
            }
        }, 100); // Short delay to ensure DOM is ready
    }


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
