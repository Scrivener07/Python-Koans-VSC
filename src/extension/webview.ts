import * as vscode from 'vscode';

// https://code.visualstudio.com/api/extension-guides/webview

export class KoanWebView {

    static activate(context: vscode.ExtensionContext) {
        console.log(context.extensionUri, 'Activating Koan Webview');

        // Register the webview provider
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider(KoanWebViewProvider.VIEW_TYPE, new KoanWebViewProvider(context.extensionUri))
        );

        // Register virtual document provider
        context.subscriptions.push(
            vscode.workspace.registerTextDocumentContentProvider(KoanDocumentProvider.VIEW_TYPE, new KoanDocumentProvider())
        );
    }
}


// Register a content provider for virtual code cell documents
export class KoanDocumentProvider implements vscode.TextDocumentContentProvider {
    public static readonly VIEW_TYPE: string = 'koan-cell';

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
    public static readonly VIEW_TYPE: string = 'python-koans-webview';

    // Capture the extension URI
    constructor(private extensionUri: vscode.Uri) {}


    resolveWebviewView(webviewView: vscode.WebviewView) {
        console.log('Resolving Koan Webview');

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this.extensionUri, 'resources'),
                vscode.Uri.joinPath(this.extensionUri, 'out')
            ]
        };
        webviewView.webview.html = this.getWebviewContent(webviewView.webview);

        // Handle messages from webview
        webviewView.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'openCodeCell':
                    console.log('Open code editor for cell: ' + message.cellId);
                    this.openCodeCellEditor(message.cellId);
                    break;
                case 'runTests':
                    console.log('Run tests for cell: ' + message.cellId);
                    // TODO: Implement test running logic
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


    private getWebviewContent(webview: vscode.Webview): string {
        // Get URIs for CSS and JS files
        const css_Uri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, 'resources', 'webview', 'css', 'koan.css')
        );
        const script_Uri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, 'resources', 'webview', 'js', 'webview.js')
        );

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="${css_Uri}">
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

            <script src="${script_Uri}"></script>
        </body>
        </html>`;
    }


}
