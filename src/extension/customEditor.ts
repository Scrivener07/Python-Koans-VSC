import * as vscode from 'vscode';

// https://code.visualstudio.com/api/extension-guides/custom-editors
// https://code.visualstudio.com/api/references/icons-in-labels

export class KoanCustomEditor {

    // Register a custom editor for koan files.
    static activate(context: vscode.ExtensionContext) {
        console.log(context.extensionUri, "Registering custom editor");

        // Register the custom editor provider
        context.subscriptions.push(
            vscode.window.registerCustomEditorProvider(KoanCustomEditorProvider.VIEW_TYPE, new KoanCustomEditorProvider(context.extensionUri))
        );
    }

}


class KoanCustomEditorProvider implements vscode.CustomTextEditorProvider {
    public static readonly VIEW_TYPE: string = 'python-koans.koanEditor';

    constructor(private extensionUri: vscode.Uri) { }


    resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        token: vscode.CancellationToken
    ): void {
        console.log('Resolving custom editor for', document.uri.toString());

        // Set up the webview's HTML content
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this.extensionUri, 'resources')
            ]
        };


        const cssUri = webviewPanel.webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, 'resources', 'webview', 'css', 'koan.css')
        );

        webviewPanel.webview.html = this.getHtmlForWebview(document, cssUri);

        // Listen for changes to the document and update the webview
        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.toString() === document.uri.toString()) {
                webviewPanel.webview.html = this.getHtmlForWebview(document, cssUri);
            }
        });

        // Clean up when the panel is disposed
        webviewPanel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
        });

        // Handle messages from the webview
        webviewPanel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'update':
                    this.updateTextDocument(document, message.text);
                    return;
            }
        });
    }


    private getHtmlForWebview(document: vscode.TextDocument, cssUri: vscode.Uri): string {
        const content: string = document.getText();
        const escapedContent: string = this.escapeHtml(content);
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Python Koan Editor</title>
            </head>
            <body>
                <textarea style="width:100%;height:90vh;">${escapedContent}</textarea>
                <script>
                    const vscode = acquireVsCodeApi();
                    const textarea = document.querySelector('textarea');
                    textarea.addEventListener('input', () => {
                        vscode.postMessage({
                            command: 'update',
                            text: textarea.value
                        });
                    });
                </script>
            </body>
            </html>
        `;
    }


    private escapeHtml(text: string): string {
        return text.replace(/[&<>"']/g, (m) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[m] as string));
    }


    private updateTextDocument(document: vscode.TextDocument, value: string) {
        console.log('Updating document', document.uri.toString());
        const edit = new vscode.WorkspaceEdit();
        const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(document.getText().length)
        );
        edit.replace(document.uri, fullRange, value);
        return vscode.workspace.applyEdit(edit);
    }


}
