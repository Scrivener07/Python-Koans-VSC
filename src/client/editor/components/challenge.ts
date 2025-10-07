import { vscode } from '../services/vscode';
import { Challenge, WebCommands } from "../../../shared/messaging";
import { StatusIcon, TestCase, TestStatus, TestSuite } from "../../../shared/testing";
import { CodeEditorEvents, HTMLCodeEditor } from './code-editor';

/** Define a custom HTML element for challenges. */
export class KoanChallengeElement extends HTMLElement {

    public static readonly HTML_TAG: string = 'koan-challenge';


    /** The challenge data to use. */
    private _challenge: Challenge;
    get challenge(): Challenge { return this._challenge; }
    set challenge(value: Challenge) {
        this._challenge = value;
        if (this.isConnected) {
            // this.innerHTML = this.createTemplate();
        }
    }

    /** The panel for standard output. */
    private outputPanel: HTMLElement | null = null;

    /** The panel for test result data. */
    private resultPanel: HTMLElement | null = null;


    constructor() {
        super();
        this._challenge = {
            name: 'UNDEFINED',
            instruction: 'UNDEFINED',
            code: 'UNDEFINED'
        };
    }


    public static define(): void {
        customElements.define(KoanChallengeElement.HTML_TAG, KoanChallengeElement);
    }


    public static create(): KoanChallengeElement {
        return document.createElement(KoanChallengeElement.HTML_TAG) as KoanChallengeElement;
    }


    // DOM
    //--------------------------------------------------

    public override connectedCallback(): void {
        this.setAttribute('data-challenge-id', this.challenge.name);
        this.className = 'challenge-container';

        // Build DOM elements for this view.
        const template = this.createTemplate();
        this.appendChild(template);

        // // Initialize Monaco after DOM is ready.
        // setTimeout(() => this.initMonaco(), 0);

        // Cache references to frequently accessed elements.
        this.outputPanel = this.get_OutputPanel();
        this.resultPanel = this.get_ResultPanel();
    }


    private get_InstructionPanel(): HTMLElement | null {
        return this.querySelector(`#${this.challenge.name}_instructions`);
    }

    private get_OutputPanel(): HTMLElement | null {
        return this.querySelector(`#${this.challenge.name}_stdout`);
    }

    private get_ResultPanel(): HTMLElement | null {
        return this.querySelector(`#${this.challenge.name}_results`);
    }

    private get_StatusIndicator(): HTMLElement | null {
        return this.querySelector('.challenge-status');
    }

    private get_CodePanel(): HTMLElement | null {
        return this.querySelector<HTMLElement>(`#${this._challenge.name}_editor`);
    }


    // Render
    //--------------------------------------------------

    private createTemplate(): HTMLElement {
        const root: HTMLDetailsElement = document.createElement('details');
        const root_summary: HTMLElement = document.createElement('summary');
        root.appendChild(root_summary);

        // Header section
        if (true) {
            const challenge_header: HTMLDivElement = document.createElement('div');
            challenge_header.className = 'challenge-header';
            root_summary.appendChild(challenge_header);

            // Title section
            if (true) {
                const challenge_title: HTMLDivElement = document.createElement('div');
                challenge_title.className = 'challenge-title';
                challenge_header.appendChild(challenge_title);

                const challenge_title_heading: HTMLHeadingElement = document.createElement('h2');
                challenge_title_heading.textContent = this.challenge.name;
                challenge_title.appendChild(challenge_title_heading);

                const challenge_title_status: HTMLSpanElement = document.createElement('span');
                challenge_title_status.className = 'challenge-status';
                challenge_title_status.textContent = '○';
                challenge_title_status.setAttribute('data-status', 'pending');
                challenge_title.appendChild(challenge_title_status);
            }

            // Controls section
            if (true) {
                const challenge_controls: HTMLDivElement = document.createElement('div');
                challenge_controls.className = 'challenge-controls';
                challenge_header.appendChild(challenge_controls);

                // Instructions button
                const instructionsBtn: HTMLButtonElement = document.createElement('button');
                instructionsBtn.className = 'btn-secondary';
                instructionsBtn.addEventListener('click', () => this.toggleInstructions());
                challenge_controls.appendChild(instructionsBtn);

                const instructionsIcon: HTMLSpanElement = document.createElement('span');
                instructionsIcon.className = 'icon';
                instructionsIcon.textContent = '📖';
                instructionsBtn.appendChild(instructionsIcon);

                instructionsBtn.appendChild(document.createTextNode(' View Instructions'));

                // Code cell button
                const codeCellBtn: HTMLButtonElement = document.createElement('button');
                codeCellBtn.className = 'btn-secondary';
                codeCellBtn.addEventListener('click', () => this.openCodeCell());
                challenge_controls.appendChild(codeCellBtn);

                const codeCellIcon: HTMLSpanElement = document.createElement('span');
                codeCellIcon.className = 'icon';
                codeCellIcon.textContent = '📝';
                codeCellBtn.appendChild(codeCellIcon);

                codeCellBtn.appendChild(document.createTextNode(' Open Code Cell'));

                // Run tests button
                const runTestsBtn: HTMLButtonElement = document.createElement('button');
                runTestsBtn.className = 'btn-primary btn-run-tests';
                runTestsBtn.addEventListener('click', () => this.runChallenge());
                challenge_controls.appendChild(runTestsBtn);

                const runIcon: HTMLSpanElement = document.createElement('span');
                runIcon.className = 'icon';
                runIcon.textContent = '▶';
                runTestsBtn.appendChild(runIcon);

                runTestsBtn.appendChild(document.createTextNode(' Run Tests'));
            }
        }

        // Instructions section
        if (true) {
            const instructions: HTMLDivElement = document.createElement('div');
            instructions.className = 'challenge-instructions';
            instructions.id = `${this.challenge.name}_instructions`;
            root.appendChild(instructions);

            const instructionsContent: HTMLDivElement = document.createElement('div');
            instructionsContent.className = 'instructions-content';
            instructionsContent.innerHTML = this.challenge.instruction;
            instructions.appendChild(instructionsContent);
        }

        // Code section
        if (true) {
            const codeSection: HTMLDivElement = document.createElement('div');
            codeSection.className = 'challenge-code-section';
            root.appendChild(codeSection);

            // Code header
            const codeHeader: HTMLDivElement = document.createElement('div');
            codeHeader.className = 'code-header';
            codeSection.appendChild(codeHeader);

            const codeLabel: HTMLSpanElement = document.createElement('span');
            codeLabel.className = 'code-label';
            codeLabel.textContent = 'Your Solution';
            codeHeader.appendChild(codeLabel);

            // Code actions
            const codeActions: HTMLDivElement = document.createElement('div');
            codeActions.className = 'code-actions';
            codeHeader.appendChild(codeActions);

            // Reset button
            const resetBtn: HTMLButtonElement = document.createElement('button');
            resetBtn.className = 'btn-icon';
            resetBtn.title = 'Reset to original';
            resetBtn.addEventListener('click', () => this.resetCode());
            codeActions.appendChild(resetBtn);

            const resetIcon: HTMLSpanElement = document.createElement('span');
            resetIcon.className = 'icon';
            resetIcon.textContent = '↺';
            resetBtn.appendChild(resetIcon);

            // Format button
            const formatBtn: HTMLButtonElement = document.createElement('button');
            formatBtn.className = 'btn-icon';
            formatBtn.title = 'Format code';
            formatBtn.addEventListener('click', () => this.formatCode());
            codeActions.appendChild(formatBtn);

            const formatIcon: HTMLSpanElement = document.createElement('span');
            formatIcon.className = 'icon';
            formatIcon.textContent = '✨';
            formatBtn.appendChild(formatIcon);

            // Editor container
            const codeEditor: HTMLCodeEditor = HTMLCodeEditor.create(this.challenge.code);
            codeEditor.id = `${this.challenge.name}_editor`;
            let debounceTimer: ReturnType<typeof setTimeout> | null = null;
            codeEditor.addEventListener(CodeEditorEvents.CONTENT_CHANGED, (event: Event) => {
                const customEvent = event as CustomEvent;

                if (debounceTimer) {
                    clearTimeout(debounceTimer);
                }

                debounceTimer = setTimeout(() => {
                    vscode.postMessage({
                        command: WebCommands.Code_Update,
                        member_id: this.challenge.name,
                        code: customEvent.detail.value
                    });
                }, 2000);
            });
            codeSection.appendChild(codeEditor);
        }

        // Output section
        if (true) {
            const outputSection: HTMLDivElement = document.createElement('div');
            outputSection.className = 'challenge-output-section';
            root.appendChild(outputSection);

            const outputHeader: HTMLDivElement = document.createElement('div');
            outputHeader.className = 'output-header';
            outputSection.appendChild(outputHeader);

            const outputLabel: HTMLSpanElement = document.createElement('span');
            outputLabel.className = 'output-label';
            outputLabel.textContent = 'Standard Output';
            outputHeader.appendChild(outputLabel);

            const outputContent: HTMLDivElement = document.createElement('div');
            outputContent.className = 'output-content';
            outputContent.id = `${this.challenge.name}_stdout`;
            outputSection.appendChild(outputContent);

            const placeholder: HTMLDivElement = document.createElement('div');
            placeholder.className = 'output-placeholder';
            placeholder.textContent = 'No output from your code yet...';
            outputContent.appendChild(placeholder);
        }

        // Results section
        if (true) {
            const resultsSection: HTMLDivElement = document.createElement('div');
            resultsSection.className = 'challenge-results-section';
            root.appendChild(resultsSection);

            const resultsHeader: HTMLDivElement = document.createElement('div');
            resultsHeader.className = 'results-header';
            resultsSection.appendChild(resultsHeader);

            const resultsLabel: HTMLSpanElement = document.createElement('span');
            resultsLabel.className = 'results-label';
            resultsLabel.textContent = 'Test Results';
            resultsHeader.appendChild(resultsLabel);

            const resultsActions: HTMLDivElement = document.createElement('div');
            resultsActions.className = 'results-actions';
            resultsHeader.appendChild(resultsActions);

            const clearBtn: HTMLButtonElement = document.createElement('button');
            clearBtn.className = 'btn-icon';
            clearBtn.title = 'Clear results';
            clearBtn.addEventListener('click', () => this.clearResults());
            resultsActions.appendChild(clearBtn);

            const clearIcon: HTMLSpanElement = document.createElement('span');
            clearIcon.className = 'icon';
            clearIcon.textContent = '🗑';
            clearBtn.appendChild(clearIcon);

            const resultsContent: HTMLDivElement = document.createElement('div');
            resultsContent.className = 'results-content';
            resultsContent.id = `${this.challenge.name}_results`;
            resultsSection.appendChild(resultsContent);

            const resultsPlaceholder: HTMLDivElement = document.createElement('div');
            resultsPlaceholder.className = 'results-placeholder';
            resultsPlaceholder.textContent = 'Run tests to see results here...';
            resultsContent.appendChild(resultsPlaceholder);
        }

        return root;
    }


    // Action Methods
    //--------------------------------------------------

    private runChallenge(): void {
        vscode.postMessage({
            command: WebCommands.Code_RunTests,
            member_id: this.challenge.name
        });
    }


    private openCodeCell(): void {
        vscode.postMessage({
            command: WebCommands.Code_OpenVirtual,
            member_id: this.challenge.name
        });
    }


    private toggleInstructions(): void {
        const instructionPanel = this.get_InstructionPanel();
        if (instructionPanel) {
            instructionPanel.classList.toggle('expanded');
        }
    }


    private resetCode(): void {
        vscode.postMessage({
            command: WebCommands.Code_Reset,
            member_id: this.challenge.name
        });
    }


    private formatCode(): void {
        vscode.postMessage({
            command: WebCommands.Code_Format,
            member_id: this.challenge.name
        });
    }


    // Clears both results and standard output.
    public clearResults(): void {
        if (this.outputPanel) {
            this.outputPanel.innerHTML = '<div class="output-placeholder">No output from your code yet...</div>';
        }

        if (this.resultPanel) {
            this.resultPanel.innerHTML = '<div class="results-placeholder">Run tests to see results here...</div>';
        }
        vscode.postMessage({
            command: WebCommands.Output_Clear,
            member_id: this.challenge.name
        });
    }


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
        const statusIndicator = this.get_StatusIndicator();
        if (statusIndicator) {
            const resultClass = suite.status === TestStatus.Passed ? 'pass' : 'fail';
            const icon = suite.status === TestStatus.Passed ? StatusIcon.Passed : StatusIcon.Failed;
            statusIndicator.textContent = icon;
            statusIndicator.setAttribute('data-status', resultClass.toLowerCase());
        }
    }


    // Monaco
    //--------------------------------------------------










}
