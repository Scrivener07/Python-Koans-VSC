import * as vscode from 'vscode';

export async function debugNotebook() {
    console.log("Handling debugNotebook")

    const editor = vscode.window.activeNotebookEditor;
    if (!editor) {
        vscode.window.showInformationMessage('No notebook is open');
        return;
    }

    const cells = editor.notebook.getCells();
    console.log(`Notebook has ${cells.length} cells`);

    for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        console.log(`Cell ${i}: ${cell.kind === vscode.NotebookCellKind.Code ? 'Code' : 'Markdown'}`);
        console.log(`  Editable: ${cell.metadata?.editable}`);
        console.log(`  Content length: ${cell.document.getText().length} chars`);
    }

    vscode.window.showInformationMessage(`Notebook has ${cells.length} cells. See console for details.`);
}


// Command handler for verifying the current challenge
export async function verifyCurrentChallenge() {
    // TODO: Implement verification logic
    console.log("Handling verifyCurrentChallenge")
}
