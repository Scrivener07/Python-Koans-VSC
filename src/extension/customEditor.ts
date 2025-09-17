import * as vscode from 'vscode';

// https://code.visualstudio.com/api/extension-guides/custom-editors
// https://code.visualstudio.com/api/references/icons-in-labels

export class KoanEditor {

    // Register a custom editor for koan files.
    static activate(context: vscode.ExtensionContext) {
        console.log(context.extensionUri, "Registering custom editor");

        // Register the custom editor provider
        context.subscriptions.push(
            vscode.window.registerCustomEditorProvider(KoanEditorProvider.VIEW_TYPE, new KoanEditorProvider(context.extensionUri))
        );
    }

}


class KoanEditorProvider implements vscode.CustomTextEditorProvider {
    public static readonly VIEW_TYPE: string = 'python-koans.koanEditor';

    constructor(private extensionUri: vscode.Uri) { }


    resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        token: vscode.CancellationToken
    ): void {
        console.log('Resolving koan editor for', document.uri.toString());

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
            console.log('Disposing custom editor for', document.uri.toString());
            changeDocumentSubscription.dispose();
        });
    }

    private onDocumentChanged(webviewPanel: vscode.WebviewPanel, document: vscode.TextDocument, e: vscode.TextDocumentChangeEvent): void {
        console.log('Custom editor document changed:', e.document.uri.toString());
        if (e.document.uri.toString() === document.uri.toString()) {
            webviewPanel.webview.html = this.getHtml(document, webviewPanel.webview);
        }
    }


    private onMessage(document: vscode.TextDocument, message: any): void {
        console.log('Received message from webview:', message);

        switch (message.command) {
            case 'update':
                this.handle_UpdateTextDocument(document, message.text);
                break;

            case 'openCodeCell':
                this.handle_OpenCodeCell(message.cellId);
                break;

            case 'runTests':
                this.handle_RunTests(document, message.cellId);
                break;

            default:
                console.warn('Unknown command received from webview:', message.command);
        }
    }


    private handle_UpdateTextDocument(document: vscode.TextDocument, value: string) {
        console.log('Updating document', document.uri.toString());
        const edit = new vscode.WorkspaceEdit();
        const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(document.getText().length)
        );
        edit.replace(document.uri, fullRange, value);
        return vscode.workspace.applyEdit(edit);
    }


    private async handle_OpenCodeCell(cellId: string): Promise<void> {
        console.log('Opening code cell for in virtual document:', cellId);
        // Create a virtual document for this code cell.
        const uri = vscode.Uri.parse(`koan-cell:${cellId}.py`);
        const doc = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
    }


    private handle_RunTests(document: vscode.TextDocument, cellId: string): void {
        console.log('Running tests for challenge:', cellId);
        // Implementation for running tests
    }


    private getHtml(document: vscode.TextDocument, webview: vscode.Webview): string {
        console.log(document.uri.toString(), 'Generating HTML for koan editor webview');
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
                ${KoanEditorProvider.html_Challenge('challenge_01', description, code)}
                ${KoanEditorProvider.html_DocumentSource(escapedContent)}
                <script src="${script_Uri}"></script>
            </body>
            </html>
        `;
    }


    private static html_Challenge(challenge_name: string, description: string, code: string): string {
        return `
        <div class="challenge-cell">
            ${KoanEditorProvider.html_InstructionCell(challenge_name, description)}
            ${KoanEditorProvider.html_CodeCell_Preview(challenge_name, code)}
        </div>
        `;
    }

    private static html_InstructionCell(challenge_name: string, description: string): string {
        return `
            <div class="instruction-cell">
                <h2>${challenge_name}</h2>
                <p>${description}</p>
            </div>
        `;
    }

    private static html_CodeCell_Preview(challenge_name: string, code: string): string {
        return `
        <div class="code-cell">
            <div id="${challenge_name}_preview">
                <pre><code>${code}</code></pre>
            </div>
        </div>
        <div class="code-header">
            <button onclick="openCodeCell('${challenge_name}')">Open Code</button>
            <button onclick="runTests('${challenge_name}')">Run Tests</button>
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
