import { HtmlUtility } from "./utility";
import { DocumentInfo, TestResult, WebviewMessage } from "./messaging";
import { createChallengeHtml } from './challenge';

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


// Browser Window
//--------------------------------------------------

// Message handling from extension.
window.addEventListener('message', onMessage);
function onMessage(this: Window, event: MessageEvent<any>) {
    const message = event.data;
    switch (message.command) {
        case 'initialize':
            onMessage_Initialize(message.documentInfo, message.challenges);
            break;

        case 'updateChallengeOutput':
            onMessage_OutputUpdate(message.member_id!, message.result!);
            break;
        default:
            console.log('Unknown message from extension:', message);
    }
}


// New function to populate the UI with data.
function onMessage_Initialize(documentInfo: DocumentInfo, challenges: any[]) {
    // Populate the document details.
    const detailsContainer = document.getElementById('document-details');
    if (detailsContainer) {
        detailsContainer.innerHTML = `
            <details>
                <summary>Document Details</summary>
                <ul>
                    <li><b>File:</b> ${documentInfo.fileName}</li>
                    <li><b>URI:</b> ${documentInfo.uri}</li>
                    <li><b>Lines:</b> ${documentInfo.lineCount}</li>
                    <li><b>Characters:</b> ${documentInfo.content.length}</li>
                </ul>
            </details>
            <details>
                <summary>Document Source</summary>
                <p>This is the full text of the document being edited.</p>
                <textarea class="code-cell">${HtmlUtility.wrapDivision(documentInfo.content)}</textarea>
            </details>
        `;
    }

    // Populate challenges
    const challengesContainer = document.getElementById('challenges-container');
    if (challengesContainer) {
        let challengesHtml = '';
        challenges.forEach(challenge => {
            challengesHtml += createChallengeHtml(challenge);
        });
        challengesContainer.innerHTML = challengesHtml;
    }

    // Set up event listener for the textarea
    const textarea = document.querySelector('textarea');
    if (textarea) {
        textarea.addEventListener('input', () => {
            vscode.postMessage({
                command: 'update',
                text: textarea.value
            });
        });
    }
}


// Button Handlers
//--------------------------------------------------

// Challenge Functions
function runChallenge(member_id: string): void {
    vscode.postMessage({
        command: 'runTests',
        member_id: member_id
    });
}

function openCodeCell(member_id: string): void {
    vscode.postMessage({
        command: 'openCodeCell',
        member_id: member_id
    });
}

function onClick_InstructionToggle(challenge_id: string): void {
    const instructionsElem = document.getElementById(`${challenge_id}_instructions`);
    if (instructionsElem) {
        instructionsElem.classList.toggle('expanded');
    }
}

function resetChallenge(member_id: string): void {
    vscode.postMessage({
        command: 'resetChallenge',
        member_id: member_id
    });
}

function formatCode(member_id: string): void {
    vscode.postMessage({
        command: 'formatCode',
        member_id: member_id
    });
}

function clearOutput(member_id: string): void {
    const outputElement = document.getElementById(`${member_id}_output`);
    if (outputElement) {
        outputElement.innerHTML = '<div class="output-placeholder">Run tests to see results here...</div>';
    }

    vscode.postMessage({
        command: 'clearOutput',
        member_id: member_id
    });
}


// Command Response Handlers
//--------------------------------------------------

function onMessage_OutputUpdate(member_id: string, result: TestResult): void {
    const outputDiv = document.getElementById(`${member_id}_output`);
    const statusIndicator = document.querySelector(`[data-challenge-id="${member_id}"] .challenge-status`);

    if (!outputDiv) { return; }

    if (result.success) {
        outputDiv.innerHTML = `<div class="test-result pass">✅ All tests passed!</div>`;
        if (statusIndicator) {
            statusIndicator.textContent = '✅';
            statusIndicator.setAttribute('data-status', 'pass');
        }
    } else {
        outputDiv.innerHTML = `<div class="test-result fail">❌ ${result.message}</div>`;
        if (statusIndicator) {
            statusIndicator.textContent = '❌';
            statusIndicator.setAttribute('data-status', 'fail');
        }
    }
}


// Document Details
//--------------------------------------------------

const textarea = document.querySelector('textarea');
if (textarea) {
    textarea.addEventListener('input', () => {
        // The text of the actual `*.koan` file json data.
        vscode.postMessage({
            command: 'update',
            text: textarea.value
        });
    });
}

function updateCellPreview(member_id: string, content: string): void {
    const preview = document.getElementById(`${member_id}_preview`);
    if (preview) {
        preview.innerHTML = `<pre><code>${HtmlUtility.wrapDivision(content)}</code></pre>`;
    }
}


// Globals
//--------------------------------------------------
// Expose functions to global scope.
// This is crucial for the onclick attributes in HTML.
(window as any).runChallenge = runChallenge;
(window as any).openCodeCell = openCodeCell;
(window as any).toggleChallenge = onClick_InstructionToggle;
(window as any).resetChallenge = resetChallenge;
(window as any).formatCode = formatCode;
(window as any).clearOutput = clearOutput;
