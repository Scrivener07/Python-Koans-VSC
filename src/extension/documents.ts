import * as vscode from 'vscode';
import { KoanLog } from './log';


export class KoanDocument {

    static activate(context: vscode.ExtensionContext) {
        KoanLog.info([this, this.activate], 'Activating');

        // Register virtual document provider
        context.subscriptions.push(
            vscode.workspace.registerTextDocumentContentProvider(KoanDocumentProvider.VIEW_TYPE, new KoanDocumentProvider())
        );
    }
}


// Register a content provider for virtual code cell documents.
export class KoanDocumentProvider implements vscode.TextDocumentContentProvider {

    public static readonly VIEW_TYPE: string = 'koan-cell';

    private static readonly CONTENT_DEFAULT: string = 'def challenge_01():\n    # Your code here\n    pass';

    private cells = new Map<string, string>();



    provideTextDocumentContent(uri: vscode.Uri): string {
        KoanLog.info([this, this.provideTextDocumentContent], uri.toString());
        const cellId = uri.path.replace('.py', '');
        return this.cells.get(cellId) || KoanDocumentProvider.CONTENT_DEFAULT;
    }


    updateCell(cellId: string, content: string) {
        KoanLog.info([this, this.updateCell], cellId);
        this.cells.set(cellId, content);
    }

}
