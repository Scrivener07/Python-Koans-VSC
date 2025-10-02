import { createChallengeElement } from './challenge';
import { WebCommands, WebMessage, InitializeCommand } from '../../shared/messaging';
import { StatusIcon, TestAssertion, TestCase, TestStatus, TestSuite } from '../../shared/testing';


// VS Code API
//--------------------------------------------------
// Provide TypeScript types for the VS Code webview API.
declare function acquireVsCodeApi(): {
    postMessage(message: any): void;
    getState(): any;
    setState(state: any): void;
};

// Get the VS Code API instance.
const vscode = acquireVsCodeApi();


// View
//--------------------------------------------------

function main() {
    console.log('WebView:constructor');

    // Load templates when the page loads.
    document.addEventListener('DOMContentLoaded', onDOMContentLoaded);

    // Message handling from extension.
    window.addEventListener('message', onMessage);
}


// Browser Document
//--------------------------------------------------

async function onDOMContentLoaded(event: Event) {
    console.log('DOMContentLoaded...');
}


// Browser Window
//--------------------------------------------------

function onMessage(event: MessageEvent<any>) {
    console.log('Message received from extension:', event.data);
    const message = event.data as WebMessage;
    switch (message.command) {
        case WebCommands.Data_Initialize:
            onMessage_Initialize(message);
            break;
        case WebCommands.Output_Update:
            onMessage_OutputUpdate(message.suite);
            break;
        default:
            console.log('Unknown message from extension:', message);
    }
}


// Document Details
//--------------------------------------------------

function document_preview_raw() {
    const textarea = document.querySelector('textarea');
    if (textarea) {
        textarea.addEventListener('input', () => {
            // The text of the actual `*.koan` file json data.
            vscode.postMessage({
                command: WebCommands.Document_Update,
                text: textarea.value
            });
        });
    }
}


function updateCellPreview(member_id: string, content: string): void {
    const preview = document.getElementById(`${member_id}_preview`);
    if (preview) {
        preview.innerHTML = `<pre><code>${content}</code></pre>`;
    }
}



// New function to populate the UI with data.
function onMessage_Initialize(data: InitializeCommand) {
    // Populate the document details.
    const detailsContainer = document.getElementById('document-details');
    if (detailsContainer) {
        detailsContainer.innerHTML = `
        <details>
            <summary>Document</summary>
            <ul>
                <li><b>File:</b> ${data.documentInfo.fileName}</li>
                <li><b>URI:</b> ${data.documentInfo.uri}</li>
                <li><b>Encoding:</b> ${data.documentInfo.encoding}</li>
                <li><b>Language:</b> ${data.documentInfo.language}</li>
                <li><b>Lines:</b> ${data.documentInfo.lineCount}</li>
                <li><b>Characters:</b> ${data.documentInfo.content.length}</li>
            </ul>
        </details>
        <details>
            <summary>Document: Exercise</summary>
            <ul>
                <li><b>File:</b> ${data.pythonDocumentInfo.fileName}</li>
                <li><b>URI:</b> ${data.pythonDocumentInfo.uri}</li>
                <li><b>Encoding:</b> ${data.pythonDocumentInfo.encoding}</li>
                <li><b>Language:</b> ${data.pythonDocumentInfo.language}</li>
                <li><b>Lines:</b> ${data.pythonDocumentInfo.lineCount}</li>
                <li><b>Characters:</b> ${data.pythonDocumentInfo.content.length}</li>
            </ul>
        </details>

        <details>
            <summary>Document Source</summary>
            <p>This is the full text of the document being edited.</p>
            <textarea class="output-content">${data.documentInfo.content}</textarea>
        </details>
        `;
    }

    // Populate challenges.
    const challengesContainer = document.getElementById('challenges-container');
    if (challengesContainer) {
        // Clear existing content.
        challengesContainer.innerHTML = '';

        // Add each challenge.
        data.challenges.forEach(challenge => {
            const challengeElement = createChallengeElement(challenge);
            challengesContainer.appendChild(challengeElement);
        });
    }

    // Set up event listener for the textarea.
    const textarea = document.querySelector('textarea');
    if (textarea) {
        textarea.addEventListener('input', () => {
            vscode.postMessage({
                command: WebCommands.Document_Update,
                text: textarea.value
            });
        });
    }

    applyInputHandlers();
}


// Input
//--------------------------------------------------

/** Apply input handlers to every code text area. */
function applyInputHandlers() {
    document.querySelectorAll('.code-input').forEach((editor) => {
        editor.addEventListener('input', (event) => {
            const target = event.target as HTMLTextAreaElement;
            const challengeDiv = target.closest('[data-challenge-id]');
            if (!challengeDiv) {
                return;
            }
            const challengeId = challengeDiv.getAttribute('data-challenge-id');
            if (challengeId) {
                // Use the debounced handler instead of direct message sending.
                handleCodeEditorChange(challengeId, target.value);
            }
        });
    });
}


// Debounce Input
//--------------------------------------------------

/** The input debounce timer to use. */
let updateTimeout: ReturnType<typeof setTimeout> | null = null;

/** The input debouce handler to use. */
function handleCodeEditorChange(challengeId: string, newCode: string) {
    // Clear previous timeout.
    if (updateTimeout) {
        clearTimeout(updateTimeout);
    }
    // Set new timeout (ms delay).
    const delay: number = 1000;
    updateTimeout = setTimeout(() => {
        vscode.postMessage({
            command: WebCommands.Code_Update,
            member_id: challengeId,
            code: newCode
        });
    }, delay);
}



// Button Handlers
//--------------------------------------------------

// Challenge Functions
function Code_RunTest(member_id: string): void {
    vscode.postMessage({
        command: WebCommands.Code_RunTests,
        member_id: member_id
    });
}

function Code_OpenVirtual(member_id: string): void {
    vscode.postMessage({
        command: WebCommands.Code_OpenVirtual,
        member_id: member_id
    });
}

function onClick_InstructionToggle(challenge_id: string): void {
    const instructionsElem = document.getElementById(`${challenge_id}_instructions`);
    if (instructionsElem) {
        instructionsElem.classList.toggle('expanded');
    }
}

function Code_Reset(member_id: string): void {
    vscode.postMessage({
        command: WebCommands.Code_Reset,
        member_id: member_id
    });
}

function Code_Format(member_id: string): void {
    vscode.postMessage({
        command: WebCommands.Code_Format,
        member_id: member_id
    });
}

// OBSOLETE
function Output_Clear(member_id: string): void {
    const outputElement = document.getElementById(`${member_id}_output`);
    if (outputElement) {
        outputElement.innerHTML = '<div class="output-placeholder">Run tests to see results here...</div>';
    }

    vscode.postMessage({
        command: WebCommands.Output_Clear,
        member_id: member_id
    });
}

// Clears both results and standard output.
function Results_Clear(member_id: string): void {
    const resultsElement = document.getElementById(`${member_id}_results`);
    if (resultsElement) {
        resultsElement.innerHTML = '<div class="results-placeholder">Run tests to see results here...</div>';
    }

    const stdoutElement = document.getElementById(`${member_id}_stdout`);
    if (stdoutElement) {
        stdoutElement.innerHTML = '<div class="output-placeholder">No output from your code yet...</div>';
    }

    vscode.postMessage({
        command: WebCommands.Output_Clear,
        member_id: member_id
    });
}



// Command Response Handlers
//--------------------------------------------------

function onMessage_OutputUpdate(suite: TestSuite): void {
    if (!suite.cases || suite.cases.length !== 1) {
        console.error(`Invalid test suite data: ${suite.cases?.length || 0} cases`);
        return;
    }

    const testCase: TestCase = suite.cases[0];
    const member_id: string = testCase.member_id;

    // Get the result panel and standard output panel.
    const resultsDiv = document.getElementById(`${member_id}_results`);
    const stdoutDiv = document.getElementById(`${member_id}_stdout`);

    if (!resultsDiv || !stdoutDiv) {
        console.error('Could not find output elements in DOM');
        return;
    }

    // Build test results content.
    let resultsContent: string = '';

    // Add test status and message.
    resultsContent += `<div class="test-item">${testCase.message}</div>`;

    // Add assertions if available.
    if (testCase.assertions && testCase.assertions.length > 0) {
        resultsContent += '<h4>Assertions:</h4>';
        for (const assertion of testCase.assertions) {
            const assertClass = assertion.passed ? 'pass' : 'fail';
            resultsContent += `<div class="assertion ${assertClass}">${assertion.message}</div>`;
        }
    }

    // Create results container.
    const resultClass = suite.status === TestStatus.Passed ? 'pass' : 'fail';
    const icon = suite.status === TestStatus.Passed ? StatusIcon.Passed : StatusIcon.Failed;
    resultsDiv.innerHTML = `<div class="test-result ${resultClass}">${icon} ${resultsContent}</div>`;

    // Build standard output content.
    if (suite.output && suite.output.length > 0) {
        let stdoutContent: string = '';
        for (const output of suite.output) {
            stdoutContent += `<div class="output-line">${String(output)}</div>`;
        }
        stdoutDiv.innerHTML = stdoutContent;

        // Automatically expand output details if there's output.
        const outputDetails = stdoutDiv.closest('details');
        if (outputDetails) {
            outputDetails.open = true;
        }
    } else {
        stdoutDiv.innerHTML = '<div class="output-placeholder">No output from your code</div>';
    }

    // Update status indicator in the challenge list.
    const statusIndicator = document.querySelector(`[data-challenge-id="${member_id}"] .challenge-status`);
    if (statusIndicator) {
        statusIndicator.textContent = icon;
        statusIndicator.setAttribute('data-status', resultClass.toLowerCase());
    }
}


// Globals
//--------------------------------------------------
// Expose functions to global scope.
// This is crucial for the onclick attributes in HTML.
(window as any).runChallenge = Code_RunTest;
(window as any).openCodeCell = Code_OpenVirtual;
(window as any).toggleChallenge = onClick_InstructionToggle;
(window as any).resetChallenge = Code_Reset;
(window as any).formatCode = Code_Format;
(window as any).clearOutput = Output_Clear;
(window as any).clearResults = Results_Clear;


// Main
//--------------------------------------------------
main();
