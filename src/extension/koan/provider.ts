import * as vscode from 'vscode';
import { KoanLog } from '../log';
import { KoanData } from './data';
import { EditorCommands } from './messaging';

// https://code.visualstudio.com/api/extension-guides/custom-editors
// https://code.visualstudio.com/api/references/icons-in-labels

export class KoanEditor {

    public static activate(context: vscode.ExtensionContext) {

        context.subscriptions.push(KoanEditorProvider.register(context));
    }

}


class KoanEditorProvider implements vscode.CustomTextEditorProvider {

    /** The view type for the custom editor.
     * This should match the `viewType` specified in `package.json`.
    */
    public static readonly VIEW_TYPE: string = 'python-koans.editor';

    private extensionUri: vscode.Uri;


    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        KoanLog.info([this, this.register], 'Registering');
        const provider = new KoanEditorProvider(context.extensionUri);
        return vscode.window.registerCustomEditorProvider(KoanEditorProvider.VIEW_TYPE, provider);
    }


    constructor(extensionUri: vscode.Uri) {
        KoanLog.info([this.constructor], 'Constructor');
        this.extensionUri = extensionUri;
    }


    //@vscode.CustomTextEditorProvider
    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        token: vscode.CancellationToken
    ): Promise<void> {
        KoanLog.info([KoanEditorProvider, this.resolveCustomTextEditor], document.uri.toString());

        // Set up the webview's HTML content.
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this.extensionUri, 'out/webview'),
                vscode.Uri.joinPath(this.extensionUri, 'resources')
            ]
        };

        // Set the webview's initial HTML content.
        webviewPanel.webview.html = await KoanEditorProvider.getHtml(this.extensionUri, document, webviewPanel.webview);

        // After setting HTML, send initial data.
        const data = new KoanData();
        const challenges = Array.from(data.challenges.values()).map(challenge => ({
            name: challenge.name,
            instruction: challenge.instruction,
            code: challenge.code
        }));

        webviewPanel.webview.postMessage({
            command: EditorCommands.Data_Initialize,
            documentInfo: {
                fileName: document.fileName,
                uri: document.uri.path,
                lineCount: document.lineCount,
                content: document.getText()
            },
            challenges: challenges
        });

        // Handle messages from the webview.
        const messageSubscription = webviewPanel.webview.onDidReceiveMessage(message =>
            this.onMessage(webviewPanel, document, message)
        );

        // Listen for changes to the document and update the webview.
        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
            this.onWorkspace_DidChangedTextDocument(document, webviewPanel, e);
        });

        // Clean up when the panel is disposed.
        webviewPanel.onDidDispose(() => {
            KoanLog.info([KoanEditorProvider, this.resolveCustomTextEditor], document.uri.toString());
            messageSubscription.dispose();
            changeDocumentSubscription.dispose();
        });
    }

    private onWorkspace_DidChangedTextDocument(document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel, e: vscode.TextDocumentChangeEvent): void {
        // Check if the changed *workspace* document is the one we are editing.
        // This must be filtered because all document changes are emitted.
        if (e.document.uri.toString() === document.uri.toString()) {
            this.onDocumentChanged(webviewPanel, document, e);
        }
    }

    private async onDocumentChanged(webviewPanel: vscode.WebviewPanel, document: vscode.TextDocument, e: vscode.TextDocumentChangeEvent): Promise<void> {
        KoanLog.info([KoanEditorProvider, this.onDocumentChanged], e.document.uri.toString());
        const html = await KoanEditorProvider.getHtml(this.extensionUri, document, webviewPanel.webview);
        webviewPanel.webview.html = html;
    }


    public static async getHtml(extensionUri: vscode.Uri, document: vscode.TextDocument, webview: vscode.Webview): Promise<string> {
        KoanLog.info([KoanEditorProvider, KoanEditorProvider.getHtml], document.uri.toString());

        const htmlPath = vscode.Uri.joinPath(extensionUri, 'resources', 'views', 'editor', 'index.html');
        const css_editor = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'resources', 'views', 'editor', 'editor.css'));
        const css_common = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'resources', 'views', 'koan.css'));
        const script_Uri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'out', 'webview', 'editor', 'index.js'));

        // Read the HTML template
        let html: string;
        try {
            const bytes = await vscode.workspace.fs.readFile(htmlPath);
            html = Buffer.from(bytes).toString('utf8');

        } catch (error) {
            KoanLog.error([KoanEditorProvider, KoanEditorProvider.getHtml], 'Failed to read HTML template:', error, htmlPath.toString());
            return `<p>Error loading editor HTML template.</p>
            <p>${htmlPath.toString()}</p>
            <pre>${error}</pre>`;
        }

        // Replace placeholders with actual URIs
        return html
            .replace('{{cssCommonUri}}', css_common.toString())
            .replace('{{cssEditorUri}}', css_editor.toString())
            .replace('{{scriptUri}}', script_Uri.toString());
    }


    private onMessage(webviewPanel: vscode.WebviewPanel, document: vscode.TextDocument, message: any): void {
        KoanLog.info([KoanEditorProvider, this.onMessage], 'Command:', message.command);
        switch (message.command) {
            case EditorCommands.Document_UpdateText:
                this.handle_UpdateTextDocument(document, message.text);
                break;

            case EditorCommands.Code_OpenVirtual:
                this.handle_CodeOpenVirtual(message.member_id);
                break;

            case EditorCommands.Code_RunTests:
                this.handle_RunTests(webviewPanel, document, message.member_id);
                break;

            default:
                KoanLog.warn([KoanEditorProvider, this.onMessage], 'Unhandled command:', message.command);
        }
    }


    private handle_UpdateTextDocument(document: vscode.TextDocument, value: string) {
        KoanLog.info([KoanEditorProvider, this.handle_UpdateTextDocument], 'Document:', document.uri.toString());
        const edit = new vscode.WorkspaceEdit();
        const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(document.getText().length)
        );
        edit.replace(document.uri, fullRange, value);
        return vscode.workspace.applyEdit(edit);
    }


    private async handle_CodeOpenVirtual(member_id: string): Promise<void> {
        KoanLog.info([KoanEditorProvider, this.handle_CodeOpenVirtual], 'ID:', member_id);
        // Create a virtual document for this code member.
        const uri = vscode.Uri.parse(`koan-cell:${member_id}.py`);
        const doc = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
    }


    // Test Execution
    //--------------------------------------------------

    private async handle_RunTests(webviewPanel: vscode.WebviewPanel, document: vscode.TextDocument, member_id: string): Promise<void> {
        KoanLog.info([KoanEditorProvider, this.handle_RunTests], 'ID:', member_id);
        try {
            // TODO: Simulate running tests for now...
            const testResult = await this.executeTests(member_id);

            // Send result back to webview
            webviewPanel.webview.postMessage({
                command: EditorCommands.Output_Update,
                member_id: member_id,
                result: testResult
            });

        } catch (error) {
            KoanLog.error([KoanEditorProvider, this.handle_RunTests], 'Test execution failed:', error);

            // Send error result to webview
            webviewPanel.webview.postMessage({
                command: EditorCommands.Output_Update,
                member_id: member_id,
                result: {
                    success: false,
                    message: `Test execution failed: ${error}`
                }
            });
        }
    }


    // TODO: This is a SIMULATED execution.
    private async executeTests(member_id: string): Promise<{ success: boolean, message: string }> {
        // Simulate test execution with a delay.
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Return a random mock result.
        return Math.random() > 0.5
            ? { success: true, message: `All tests passed for ${member_id}!` }
            : { success: false, message: `Test failed for ${member_id}: Expected True but got False` };
    }


}
