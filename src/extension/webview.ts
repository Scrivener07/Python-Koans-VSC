import * as vscode from 'vscode';

// https://code.visualstudio.com/api/extension-guides/webview

export class KoanWebView {

    static activate(context: vscode.ExtensionContext) {
        console.log('Activating Koan Webview extension' + context.extensionUri);

        // Register the webview provider
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider('pythonKoansView', new KoanWebViewProvider())
        );

       // Register the webview provider
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider('pythonKoansView2', new KoanWebViewProvider())
        );

       // Register the webview provider
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider('pythonKoansView3', new KoanWebViewProvider())
        );

        // Register virtual document provider
        context.subscriptions.push(
            vscode.workspace.registerTextDocumentContentProvider('koan-cell', new KoanDocumentProvider())
        );
    }
}


// Register a content provider for virtual code cell documents
export class KoanDocumentProvider implements vscode.TextDocumentContentProvider {
    private cells = new Map<string, string>();

    provideTextDocumentContent(uri: vscode.Uri): string {
        console.log('Providing content for URI: ' + uri.toString());
        const cellId = uri.path.replace('.py', '');
        return this.cells.get(cellId) || 'def challenge_01():\n    # Your code here\n    pass';
    }

    updateCell(cellId: string, content: string) {
        console.log('Updating content for cell: ' + cellId);
        this.cells.set(cellId, content);
    }
}


// Create a custom webview provider
export class KoanWebViewProvider implements vscode.WebviewViewProvider {

    resolveWebviewView(webviewView: vscode.WebviewView) {
        console.log('Resolving Koan Webview');

        webviewView.webview.options = {
            enableScripts: true,
            // localResourceRoots: [this.extensionUri]
        };

        webviewView.webview.html = this.getWebviewContent();

        // Handle messages from webview
        webviewView.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'openCodeCell':
                    console.log('Open code editor for cell: ' + message.cellId);
                    this.openCodeCellEditor(message.cellId);
                    break;
                case 'runTests':
                    console.log('Run tests for cell: ' + message.cellId);
                    // this.runPythonTests(message.cellId);
                    break;
            }
        });
    }


    private async openCodeCellEditor(cellId: string) {
        // Create a virtual document for this code cell
        const uri = vscode.Uri.parse(`koan-cell:${cellId}.py`);
        const doc = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
    }


    private getWebviewContent(): string {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                .instruction-cell {
                    background: #f8f9fa;
                    padding: 1rem;
                    margin: 1rem 0;
                    border-radius: 4px;
                }
                .code-cell {
                    border: 1px solid #ddd;
                    margin: 1rem 0;
                    border-radius: 4px;
                }
                .code-header {
                    background: #f1f3f4;
                    padding: 0.5rem;
                    border-bottom: 1px solid #ddd;
                }
                button {
                    background: #007acc;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 3px;
                    cursor: pointer;
                }
            </style>
        </head>
        <body>
            <div class="instruction-cell">
                <h2>Challenge 1</h2>
                <p>Write a function that returns True.</p>
            </div>

            <div class="code-cell">
                <div class="code-header">
                    <button onclick="openCodeCell('challenge_01')">Edit Code</button>
                    <button onclick="runTests('challenge_01')">Run Tests</button>
                </div>
                <div id="challenge_01_preview">
                    <pre><code>def challenge_01():
    # Your code here
    pass</code></pre>
                </div>
            </div>

            <script>
                const vscode = acquireVsCodeApi();

                function openCodeCell(cellId) {
                    vscode.postMessage({
                        command: 'openCodeCell',
                        cellId: cellId
                    });
                }

                function runTests(cellId) {
                    vscode.postMessage({
                        command: 'runTests',
                        cellId: cellId
                    });
                }
            </script>
        </body>
        </html>`;
    }


}
