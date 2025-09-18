import * as vscode from 'vscode';
import { KoanLog } from './log';
import { KoanCommands } from './commands'
import { KoanEditor } from './editor';
import { KoanDocument } from './documents';
import { KoanPanel } from './viewer';
import { KoanNotebook } from './notebook/notebook';
import { KoanNotebookSerializer } from './notebook/serializer';
import { KoanNotebookKernel } from './notebook/kernel';


export function activate(context: vscode.ExtensionContext) {
    KoanLog.create();
    KoanLog.info([activate], context.extensionUri);
    KoanCommands.activate(context);
    KoanEditor.activate(context);
    KoanDocument.activate(context);
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
