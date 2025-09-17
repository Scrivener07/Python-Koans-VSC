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


// Register a content provider for virtual code cell documents.
// This is a readonly view.
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
    constructor(private extensionUri: vscode.Uri) { }


    resolveWebviewView(webviewView: vscode.WebviewView) {
        console.log('Resolving Koan Webview');

        // Set up the webview's HTML content.
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this.extensionUri, 'resources'),
                vscode.Uri.joinPath(this.extensionUri, 'out')
            ]
        };

        // Set the webview's initial HTML content.
        webviewView.webview.html = this.getHtml(webviewView.webview);

        // Handle messages from webview.
        webviewView.webview.onDidReceiveMessage(message => this.onMessage(message));
    }


    private onMessage(message: any) {
        console.log('Received message from webview:', message);
        // Handle messages as needed
    }



    private getHtml(webview: vscode.Webview): string {
        // Get URIs for CSS and JS files
        const css_Uri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, 'resources', 'views', 'koan.css')
        );
        const script_Uri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, 'resources', 'views', 'viewer', 'webview.js')
        );

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="${css_Uri}">
            <title>Python Koan Viewer</title>
        </head>
        <body>
            <h2>Viewer</h2>
            <p>This is the koan viewer.</p>
            <script src="${script_Uri}"></script>
        </body>
        </html>`;
    }


}
