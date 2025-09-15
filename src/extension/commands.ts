import * as vscode from 'vscode';

// Register commands for the koans workflow.
export class KoanCommands {

    static activate(context: vscode.ExtensionContext) {
        console.log(context.extensionUri, "Registering commands");

        // Register commands for the koans workflow.
        context.subscriptions.push(
            vscode.commands.registerCommand('python-koans.debugNotebook', this.debugNotebook),
            vscode.commands.registerCommand('python-koans.verifyChallenge', this.verifyCurrentChallenge),
            vscode.commands.registerCommand('python-koans.showView', this.showView)
        );
    }


    static async debugNotebook() {
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


    static async verifyCurrentChallenge() {
        console.log("Handling verifyCurrentChallenge")
    }


    static async showView() {
        console.log("Handling showView")
    }


}
