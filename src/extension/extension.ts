import * as vscode from 'vscode';
import { KoanCommands } from './commands'
import { KoanWebView } from './webview';
import { KoanNotebook } from './notebook';
import { KoanNotebookSerializer } from './notebookSerializer';
import { KoanNotebookKernel } from './notebookKernel';
import { KoanCustomEditor } from './customEditor';


export function activate(context: vscode.ExtensionContext) {
    console.log(context.extensionUri, "Activating extension");
    KoanCommands.activate(context);
    KoanCustomEditor.activate(context);
    KoanWebView.activate(context);
    KoanNotebook.activate(context);
    KoanNotebookSerializer.activate(context);
    KoanNotebookKernel.activate(context);
}


export function deactivate() {
    console.log('python-koans has deactivated');
}
