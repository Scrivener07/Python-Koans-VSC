import * as vscode from 'vscode';
import { KoanLog } from './log';

// https://code.visualstudio.com/api/extension-guides/custom-editors
// https://code.visualstudio.com/api/references/icons-in-labels

export class KoanEditor {

    // Register a custom editor for koan files.
    static activate(context: vscode.ExtensionContext) {
        KoanLog.info([this, this.activate], 'Activating');

        // Register the custom editor provider
        context.subscriptions.push(
            vscode.window.registerCustomEditorProvider(KoanEditorProvider.VIEW_TYPE, new KoanEditorProvider(context.extensionUri))
        );
    }

}

enum EditorCommands {
    UpdateTextDocument = 'update',
    OpenCodeCell = 'openCodeCell',
    RunTests = 'runTests'
}


class KoanEditorProvider implements vscode.CustomTextEditorProvider {

    public static readonly VIEW_TYPE: string = 'python-koans.koanEditor';

    constructor(private extensionUri: vscode.Uri)
    {
        KoanLog.info([this.constructor], 'Constructor');
    }


    resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        token: vscode.CancellationToken
    ): void {
        KoanLog.info([KoanEditorProvider, this.resolveCustomTextEditor], document.uri.toString());

        // Set up the webview's HTML content.
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this.extensionUri, 'resources')
            ]
        };

        // Set the webview's initial HTML content.
        webviewPanel.webview.html = this.getHtml(document, webviewPanel.webview);

        // Handle messages from the webview.
        webviewPanel.webview.onDidReceiveMessage(message =>
            this.onMessage(document, message)
        );

        // Listen for changes to the document and update the webview.
        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
            this.onDocumentChanged(webviewPanel, document, e);
        });

        // Clean up when the panel is disposed.
        webviewPanel.onDidDispose(() => {
            KoanLog.info([KoanEditorProvider, this.resolveCustomTextEditor], document.uri.toString());
            changeDocumentSubscription.dispose();
        });
    }


    private onDocumentChanged(webviewPanel: vscode.WebviewPanel, document: vscode.TextDocument, e: vscode.TextDocumentChangeEvent): void {
        // Check if the changed document is the one we are editing.
        // This must be filtered because all document changes are emitted.
        if (e.document.uri.toString() === document.uri.toString()) {
            KoanLog.info([KoanEditorProvider, this.onDocumentChanged],  e.document.uri.toString());
            webviewPanel.webview.html = this.getHtml(document, webviewPanel.webview);
        }
    }


    private onMessage(document: vscode.TextDocument, message: any): void {
        KoanLog.info([KoanEditorProvider, this.onMessage], message);
        switch (message.command) {
            case EditorCommands.UpdateTextDocument:
                this.handle_UpdateTextDocument(document, message.text);
                break;

            case EditorCommands.OpenCodeCell:
                this.handle_OpenCodeCell(message.cellId);
                break;

            case EditorCommands.RunTests:
                this.handle_RunTests(document, message.cellId);
                break;

            default:
                KoanLog.warn([KoanEditorProvider, this.onMessage], 'Unhandled command:', message.command);
        }
    }


    private handle_UpdateTextDocument(document: vscode.TextDocument, value: string) {
        KoanLog.info([KoanEditorProvider, this.handle_UpdateTextDocument], 'Updating document', document.uri.toString());
        const edit = new vscode.WorkspaceEdit();
        const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(document.getText().length)
        );
        edit.replace(document.uri, fullRange, value);
        return vscode.workspace.applyEdit(edit);
    }


    private async handle_OpenCodeCell(cellId: string): Promise<void> {
        KoanLog.info([KoanEditorProvider, this.handle_OpenCodeCell], 'Opening code cell for in virtual document:', cellId);
        // Create a virtual document for this code cell.
        const uri = vscode.Uri.parse(`koan-cell:${cellId}.py`);
        const doc = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
    }


    private handle_RunTests(document: vscode.TextDocument, cellId: string): void {
        KoanLog.info([KoanEditorProvider, this.handle_RunTests], 'Running tests for challenge:', cellId);
        // Implementation for running tests
    }


    private getHtml(document: vscode.TextDocument, webview: vscode.Webview): string {
        KoanLog.info([KoanEditorProvider, this.getHtml], document.uri.toString());

        const css_Uri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, 'resources', 'views', 'koan.css')
        );

        const script_Uri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, 'resources', 'views', 'editor', 'editor.js')
        );

        const content: string = document.getText();
        const escapedContent: string = this.escapeHtml(content);
        const description: string = 'Write a function that returns True.';
        const code: string = 'def challenge_01():\\n    # Your code here\\n    pass';
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="stylesheet" href="${css_Uri}">
                <title>Python Koan Editor</title>
            </head>
            <body>
                <div>
                    <h1>Document</h1>
                    <ul>
                        <li><b>File:</b> ${document.uri.path.split('/').pop()}</li>
                        <li><b>Lines:</b> ${document.lineCount}</li>
                        <li><b>Characters:</b> ${content.length}</li>
                    </ul>
                </div>
                <div>
                    ${KoanEditorProvider.html_Challenge('challenge_01', description, code)}
                    ${KoanEditorProvider.html_Challenge('challenge_02', description, code)}
                    ${KoanEditorProvider.html_Challenge('challenge_03', description, code)}
                    ${KoanEditorProvider.html_Challenge('challenge_04', description, code)}
                    ${KoanEditorProvider.html_Challenge('challenge_05', description, code)}
                </div>
                <div>
                    <h2>Document Source</h2>
                    ${KoanEditorProvider.html_DocumentSource(escapedContent)}
                </div>
                <script src="${script_Uri}"></script>
            </body>
            </html>
        `;
    }


    private static html_Challenge(challenge_name: string, description: string, code: string): string {
        return `
        <div class="challenge-block">

            <h2>${challenge_name}</h2>
            <div class="instruction-cell">
                <p>${description}</p>
            </div>

            <div class="code-cell">
                <textarea id="${challenge_name}_python">${code}</textarea>
            </div>

            <div id="${challenge_name}_preview" class="code-cell">
                <pre><code id="${challenge_name}_output">The output will be displayed here.</code></pre>
            </div>

            <div class="code-header">
                <button onclick="${EditorCommands.OpenCodeCell}('${challenge_name}')">Open Code</button>
                <button onclick="${EditorCommands.RunTests}('${challenge_name}')">Run Tests</button>
            </div>

        </div>
        `;
    }


    private static html_DocumentSource(escapedContent: string): string {
        return `
        <details>
            <summary>Document Source</summary>
            <p>This is the full text of the document being edited.</p>
            <textarea style="width:30%;height:250px;">${escapedContent}</textarea>
        </details>
        `;
    }


    private escapeHtml(text: string): string {
        return text.replace(/[&<>"']/g, (markup) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[markup] as string));
    }


}
