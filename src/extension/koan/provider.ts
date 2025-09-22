import * as vscode from 'vscode';
import { KoanLog } from '../log';
import { EditorModel } from './model';

// https://code.visualstudio.com/api/extension-guides/custom-editors
// https://code.visualstudio.com/api/references/icons-in-labels

export class KoanEditorProvider implements vscode.CustomTextEditorProvider {

    /** The view type for the custom editor.
     * This should match the `viewType` specified in `package.json`.
    */
    public static readonly VIEW_TYPE: string = 'python-koans.editor';

    /** Store models by document URI to handle multiple open documents. */
    private readonly documents = new Map<string, EditorModel>();

    /** The uri of the directory containing the extension. */
    private readonly extensionUri: vscode.Uri;


    constructor(extensionUri: vscode.Uri) {
        KoanLog.info([this.constructor], 'Constructor');
        this.extensionUri = extensionUri;
    }


    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        KoanLog.info([this, this.register], 'Registering');
        const provider = new KoanEditorProvider(context.extensionUri);
        return vscode.window.registerCustomEditorProvider(KoanEditorProvider.VIEW_TYPE, provider);
    }


    //@vscode.CustomTextEditorProvider
    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        token: vscode.CancellationToken
    ): Promise<void> {
        KoanLog.info([KoanEditorProvider, this.resolveCustomTextEditor], document.uri.toString());

        // Create model for this document/webview pair, keyed by document URI.
        // TODO: The model itself is disposable now. Refactor for this.
        const model = new EditorModel(document, webviewPanel, this.extensionUri);
        this.documents.set(document.uri.toString(), model);

        // Listen for changes to the document and update the webview.
        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
            this.onWorkspace_DidChangedTextDocument(document, webviewPanel, e);
        });

        // Clean up resources when this panel is closed and disposed.
        webviewPanel.onDidDispose(() => {
            KoanLog.info([KoanEditorProvider, this.resolveCustomTextEditor], "Disposing");
            this.documents.delete(document.uri.toString());
            model.dispose(),
            changeDocumentSubscription.dispose();
        });

        // Initialize the model (delegate UI setup to the model)
        await model.initialize();
    }


    private onWorkspace_DidChangedTextDocument(document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel, e: vscode.TextDocumentChangeEvent): void {
        // Check if the changed *workspace* document is the one we are editing.
        // This must be filtered because all document changes in the workspace are emitted.
        const found = this.documents.get(e.document.uri.toString());
        if (found) {
            found.onTextDocumentChanged(e);
        }
    }


}
