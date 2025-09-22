import * as vscode from 'vscode';
import { KoanLog } from './log';
import { KoanCommands } from './commands';
import { KoanEditorProvider } from './koan/provider';
import { KoanDocumentProvider } from './koan/documents';
import { KoanPanel } from './koan-overview/provider';
import { KoanNotebook } from './notebook/notebook';
import { KoanNotebookSerializer } from './notebook/serializer';
import { KoanNotebookKernel } from './notebook/kernel';


export function activate(context: vscode.ExtensionContext) {
    KoanLog.create();
    KoanLog.info([activate], context.extensionUri);
    KoanCommands.activate(context);
    context.subscriptions.push(KoanEditorProvider.register(context));
    context.subscriptions.push(KoanDocumentProvider.register(context));
    KoanPanel.activate(context);
    KoanNotebook.activate(context);
    KoanNotebookSerializer.activate(context);
    KoanNotebookKernel.activate(context);
    KoanLog.info([activate], 'Extension has activated.');
    KoanLog.info([], '--------------------------------------------------');
}


export function deactivate() {
    KoanLog.info([deactivate], 'Extension has deactivated.');
}
