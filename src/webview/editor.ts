// Provide TypeScript types for the VS Code webview API.
//--------------------------------------------------
declare function acquireVsCodeApi(): {
    postMessage(message: any): void;
    getState(): any;
    setState(state: any): void;
};


// Message Types
//--------------------------------------------------

// Define message types.
interface TestResult {
    success: boolean;
    message: string;
}

interface WebviewMessage {
    command: string;
    member_id?: string;
    result?: TestResult;
    text?: string;
}


// Acquire VS Code API
//--------------------------------------------------

// Get the VS Code API instance.
const vscode = acquireVsCodeApi();


// Browser Window
//--------------------------------------------------

// Message handling from extension.
window.addEventListener('message', (event: MessageEvent<WebviewMessage>) => {
    const message = event.data;

    switch (message.command) {
        case 'updateChallengeOutput':
            updateChallengeOutput(message.member_id!, message.result!);
            break;
        default:
            console.log('Unknown message from extension:', message);
    }
});


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

function toggleChallenge(challenge_id: string): void {
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

function updateChallengeOutput(member_id: string, result: TestResult): void {
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


// Expose functions to global scope.
// This is crucial for the onclick attributes in HTML.
//--------------------------------------------------
(window as any).runChallenge = runChallenge;
(window as any).openCodeCell = openCodeCell;
(window as any).toggleChallenge = toggleChallenge;
(window as any).resetChallenge = resetChallenge;
(window as any).formatCode = formatCode;
(window as any).clearOutput = clearOutput;
