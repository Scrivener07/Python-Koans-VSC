import * as vscode from 'vscode';
import { KoanLog } from './KoanLog';
import { KoanCommands } from './commands'
import { KoanWebView } from './webview';
import { KoanNotebook } from './notebook';
import { KoanNotebookSerializer } from './notebookSerializer';
import { KoanNotebookKernel } from './notebookKernel';
import { KoanEditor } from './customEditor';
import { KoanDocument } from './documents';


export function activate(context: vscode.ExtensionContext) {
    KoanLog.create(context.extensionUri);
    KoanLog.info([activate], 'Extension is activating:', context.extensionUri);
    KoanCommands.activate(context);
    KoanDocument.activate(context);
    KoanEditor.activate(context);
    KoanWebView.activate(context);
    KoanNotebook.activate(context);
    KoanNotebookSerializer.activate(context);
    KoanNotebookKernel.activate(context);
    KoanLog.info([activate], 'Extension has activated.');
}


export function deactivate() {
    KoanLog.info([deactivate], 'Extension has deactivated.');
}
