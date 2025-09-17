import * as vscode from 'vscode';
import { KoanLog } from './KoanLog';

// Register notebook-related functionality for the koans workflow.
export class KoanNotebook {

    /** The notebook type for Python Koans.
     * Defined in `package.json` for this extension.
     * */
    private static readonly NOTEBOOK_TYPE: string = 'python-koans';


    static activate(context: vscode.ExtensionContext) {
        KoanLog.info([this, this.activate], context.extensionUri, "Registering notebook");

        // Add listener for notebook document changes to enforce read-only behavior.
        context.subscriptions.push(
            vscode.workspace.onDidChangeNotebookDocument(KoanNotebook.enforceReadOnly)
        );
    }


    // NOTE: Enforce read-only cells.
    //   This is additional enforcement to prevent edits to read-only cells.
    //   VS Code allegedly respects the editable flag, so this is mostly a fallback
    // NOTE: This attempt did not work as intended.
    static enforceReadOnly(event: vscode.NotebookDocumentChangeEvent) {
        KoanLog.info([this, this.enforceReadOnly], event.notebook.uri.toString());

        if (event.notebook.notebookType !== KoanNotebook.NOTEBOOK_TYPE) {
            // Only handle the koan notebook type
            return;
        }

        // Process each cell change
        for (const cellChange of event.cellChanges) {
            const cell = cellChange.cell;

            // TODO: If a non-editable cell was modified:
            // 1. Show a warning message
            // 2. Revert changes (complex, requires tracking original content)
            if (cellChange.document && cell.metadata?.editable === false) {
                vscode.window.showWarningMessage('This cell is read-only and cannot be edited.');
            }
        }
    }


}
