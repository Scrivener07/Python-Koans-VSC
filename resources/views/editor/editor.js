const vscode = acquireVsCodeApi();

COMMAND_UPDATE_OUTPUT = 'updateChallengeOutput';


window.addEventListener('message', event => {
    const message = event.data;
    switch (message.command) {
        case COMMAND_UPDATE_OUTPUT:
            updateChallengeOutput(message.member_id, message.result);
            break;

        default:
            console.log('Unknown message from extension:', message);
    }
});


// Challenge Header
//--------------------------------------------------

function toggleChallenge(member_id) {
    const instructions = document.getElementById(`${member_id}_instructions`);
    instructions.classList.toggle('expanded');
}


function runChallenge(member_id) {
    const code = document.getElementById(`${member_id}_code`).value;
    const outputDiv = document.getElementById(`${member_id}_output`);

    // Show loading state
    outputDiv.innerHTML = '<div class="output-placeholder">Running tests...</div>';

    // Send message to extension
    vscode.postMessage({
        command: 'runTests',
        member_id: member_id,
        code: code
    });
}


function runTests(member_id) {
    vscode.postMessage({
        command: 'runTests',
        member_id: member_id
    });
}


function openCodeCell(member_id) {
    // Opens the text in a VSC vitual document.
    vscode.postMessage({
        command: 'openCodeCell',
        member_id: member_id
    });
}


// Instructions Panel (Collapsible)
//--------------------------------------------------

// Code Editor Section
//--------------------------------------------------

function resetChallenge(member_id) {
    // Reset to original function body
    vscode.postMessage({
        command: 'resetChallenge',
        member_id: member_id
    });
}


function formatCode(member_id) {
    vscode.postMessage({
        command: 'formatCode',
        member_id: member_id
    });
}


// Output Section
//--------------------------------------------------

function updateChallengeOutput(member_id, result) {
    const outputDiv = document.getElementById(`${member_id}_output`);
    const statusIndicator = document.querySelector(`[data-challenge-id="${member_id}"] .challenge-status`);

    if (result.success) {
        outputDiv.innerHTML = `<div class="test-result pass">✅ All tests passed!</div>`;
        statusIndicator.textContent = '✅';
        statusIndicator.setAttribute('data-status', 'pass');
    } else {
        outputDiv.innerHTML = `<div class="test-result fail">❌ ${result.message}</div>`;
        statusIndicator.textContent = '❌';
        statusIndicator.setAttribute('data-status', 'fail');
    }
}

function clearOutput(member_id) {
    vscode.postMessage({
        command: 'clearOutput',
        member_id: member_id
    });
}


// Document Details
//--------------------------------------------------

function updateCellPreview(member_id, content) {
    const preview = document.getElementById(`${member_id}_preview`);
    if (preview) {
        preview.innerHTML = `<pre><code>${escapeHtml(content)}</code></pre>`;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

//--------------------------------------------------

const textarea = document.querySelector('textarea');

textarea.addEventListener('input', () => {
    // The text of the actual `*.koan` file json data.
    vscode.postMessage({
        command: 'update',
        text: textarea.value
    });
});
