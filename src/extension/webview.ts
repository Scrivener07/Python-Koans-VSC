import * as vscode from 'vscode';
import { KoanLog } from './KoanLog';

// https://code.visualstudio.com/api/extension-guides/webview

export class KoanWebView {

    static activate(context: vscode.ExtensionContext) {
        KoanLog.info([this, this.activate], context.extensionUri, 'Activating');

        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider(KoanWebViewProvider.VIEW_TYPE, new KoanWebViewProvider(context.extensionUri))
        );
    }

}


export class KoanWebViewProvider implements vscode.WebviewViewProvider {

    public static readonly VIEW_TYPE: string = 'python-koans-webview';

    private extensionUri: vscode.Uri;


    // Capture the extension URI
    constructor(extensionUri: vscode.Uri)
    {
        this.extensionUri = extensionUri;
        KoanLog.info([this.constructor], 'Constructor');
    }


    resolveWebviewView(webviewView: vscode.WebviewView) {
        KoanLog.info([this, this.resolveWebviewView], 'Resolving Koan Webview');

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
        KoanLog.info([this, this.onMessage], 'Received message from webview:', message);
        // TODO: Handle messages as needed.
    }



    private getHtml(webview: vscode.Webview): string {
        // Get URIs for CSS and JS files.
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
        </html>
        `;
    }


}
