import * as vscode from 'vscode';
import { KoanLog } from './KoanLog';

// Register commands for the koans workflow.
export class KoanCommands {

    constructor() {
        KoanLog.info([this.constructor], 'Constructor');
    }


    static activate(context: vscode.ExtensionContext) {
        KoanLog.info([KoanCommands, this.activate], 'Activating commands');

        // Register commands for the koans workflow.
        context.subscriptions.push(
            vscode.commands.registerCommand('python-koans.debugNotebook', this.debugNotebook),
            vscode.commands.registerCommand('python-koans.verifyChallenge', this.verifyCurrentChallenge),
            vscode.commands.registerCommand('python-koans.showView', this.showView)
        );
    }


    static async debugNotebook() {
        KoanLog.info([KoanCommands, this.debugNotebook], "Handling debugNotebook")

        const editor = vscode.window.activeNotebookEditor;
        if (!editor) {
            vscode.window.showInformationMessage('No notebook is open');
            return;
        }

        const cells = editor.notebook.getCells();
        KoanLog.info([KoanCommands, this.debugNotebook], `Notebook has ${cells.length} cells`);

        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            KoanLog.info([KoanCommands, this.debugNotebook], `Cell ${i}: ${cell.kind === vscode.NotebookCellKind.Code ? 'Code' : 'Markdown'}`);
            KoanLog.info([KoanCommands, this.debugNotebook], `  Editable: ${cell.metadata?.editable}`);
            KoanLog.info([KoanCommands, this.debugNotebook], `  Content length: ${cell.document.getText().length} chars`);
        }

        vscode.window.showInformationMessage(`Notebook has ${cells.length} cells. See console for details.`);
    }


    static async verifyCurrentChallenge() {
        KoanLog.info([KoanCommands, this.verifyCurrentChallenge], "Handling...")
    }


    static async showView() {
        KoanLog.info([KoanCommands, this.showView], "Handling...")
    }


}
