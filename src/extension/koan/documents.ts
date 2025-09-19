import * as vscode from 'vscode';
import { KoanLog } from '../log';


export class KoanDocument {

    public static activate(context: vscode.ExtensionContext) {
        KoanLog.info([this, this.activate], 'Activating');

        // Register virtual document provider
        context.subscriptions.push(KoanDocumentProvider.register(context));
    }
}


// Register a content provider for virtual code cell documents.
export class KoanDocumentProvider implements vscode.TextDocumentContentProvider {

    public static readonly VIEW_TYPE: string = 'koan-cell';

    // TODO: Load content from given `member_id`.
    private static readonly CONTENT_DEFAULT: string = '# This is a virtual document for a Python block body.\n\nprint("Hello from the virtual document!")\n';

    private cells = new Map<string, string>();


    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        KoanLog.info([this, this.register]);
        const provider = new KoanDocumentProvider();
        return vscode.workspace.registerTextDocumentContentProvider(KoanDocumentProvider.VIEW_TYPE, provider);
    }


    //@vscode.TextDocumentContentProvider
    public provideTextDocumentContent(uri: vscode.Uri): string {
        KoanLog.info([this, this.provideTextDocumentContent], uri.toString());
        const member_id = uri.path.replace('.py', '');
        return this.cells.get(member_id) || KoanDocumentProvider.CONTENT_DEFAULT;
    }


    private updateCell(member_id: string, content: string) {
        KoanLog.info([this, this.updateCell], member_id);
        this.cells.set(member_id, content);
    }

}
