const vscode = acquireVsCodeApi();

const textarea = document.querySelector('textarea');
textarea.addEventListener('input', () => {
    vscode.postMessage({
        command: 'update',
        text: textarea.value
    });
});


function openCodeCell(cellId) {
    vscode.postMessage({
        command: 'openCodeCell',
        cellId: cellId
    });
}

function runTests(cellId) {
    vscode.postMessage({
        command: 'runTests',
        cellId: cellId
    });
}

function updateCellPreview(cellId, content) {
    const preview = document.getElementById(`${cellId}_preview`);
    if (preview) {
        preview.innerHTML = `<pre><code>${escapeHtml(content)}</code></pre>`;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
