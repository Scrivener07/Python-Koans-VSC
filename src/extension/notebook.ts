import * as vscode from 'vscode';


export class KoanNotebook {

    // NOTE: This is additional enforcement to prevent edits to read-only cells.
    //   VS Code allegedly respects the editable flag, so this is mostly a fallback
    static enforceReadOnly(event: vscode.NotebookDocumentChangeEvent) {
        console.log('Enforcing read-only cells for notebook:' + event.notebook.uri.toString());

        if (event.notebook.notebookType !== 'python-koans') {
            // Only handle the koan notebook type
            return;
        }

        // Process each cell change
        for (const cellChange of event.cellChanges) {
            const cell = cellChange.cell;

            // If a non-editable cell was modified:
            // 1. Show a warning message
            // 2. Revert changes (complex, requires tracking original content)
            if (cellChange.document && cell.metadata?.editable === false) {
                vscode.window.showWarningMessage('This cell is read-only and cannot be edited.');
            }
        }
    }

}
