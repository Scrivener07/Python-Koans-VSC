import * as vscode from 'vscode';
import { KoanNotebookSerializer } from './notebookSerializer';
import { KoanNotebookKernel } from './notebookKernel';
import { verifyCurrentChallenge } from './commands'


export function activate(context: vscode.ExtensionContext) {
    console.log('python-koans has activated');

    // Register a custom notebook serializer.
    context.subscriptions.push(
        vscode.workspace.registerNotebookSerializer('python-koans', new KoanNotebookSerializer())
    );

    // Register a custom notebook controller.
    const controller:vscode.NotebookController = KoanNotebookKernel.create()
    context.subscriptions.push(controller);

    // Register commands for the koans workflow.
    context.subscriptions.push(
        vscode.commands.registerCommand('python-koans.verifyChallenge', verifyCurrentChallenge)
    );
}


export function deactivate() {
    console.log('python-koans has deactivated');
}
