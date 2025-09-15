import * as vscode from 'vscode';
import { KoanNotebook } from './notebook';
import { KoanNotebookSerializer } from './notebookSerializer';
import { KoanNotebookKernel } from './notebookKernel';
import { debugNotebook, verifyCurrentChallenge } from './commands'


export function activate(context: vscode.ExtensionContext) {
    console.log('python-koans has activated');

    // Register a custom notebook serializer.
    context.subscriptions.push(
        vscode.workspace.registerNotebookSerializer('python-koans', new KoanNotebookSerializer())
    );

    // Register a custom notebook controller.
    context.subscriptions.push(KoanNotebookKernel.create());

    // Register commands for the koans workflow.
    context.subscriptions.push(
        vscode.commands.registerCommand('python-koans.debugNotebook', debugNotebook),
        vscode.commands.registerCommand('python-koans.verifyChallenge', verifyCurrentChallenge)
    );

    // Add listener for notebook document changes to enforce read-only behavior.
    context.subscriptions.push(
        vscode.workspace.onDidChangeNotebookDocument(KoanNotebook.enforceReadOnly)
    );
}


export function deactivate() {
    console.log('python-koans has deactivated');
}
