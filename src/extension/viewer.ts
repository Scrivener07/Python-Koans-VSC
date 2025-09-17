import * as vscode from 'vscode';
import { KoanLog } from './log';

// https://code.visualstudio.com/api/extension-guides/webview

export class KoanPanel {

    static activate(context: vscode.ExtensionContext) {
        KoanLog.info([this, this.activate], 'Activating');

        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider(KoanWebViewProvider.VIEW_TYPE, new KoanWebViewProvider(context.extensionUri))
        );
    }

}

enum WebViewCommands {
    MyButton1 = 'MyButton1',
    MyButton2 = 'MyButton2',
    MyButton3 = 'MyButton3'
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
        KoanLog.info([KoanWebViewProvider, this.resolveWebviewView], 'Resolving...');

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
        if (message.command === WebViewCommands.MyButton1) {
            KoanLog.info([KoanWebViewProvider, this.onMessage], 'MyButton1 clicked with arg:', message.myArg);
        } else if (message.command === WebViewCommands.MyButton2) {
            KoanLog.info([KoanWebViewProvider, this.onMessage], 'MyButton2 clicked with arg:', message.myArg);
        } else if (message.command === WebViewCommands.MyButton3) {
            KoanLog.info([KoanWebViewProvider, this.onMessage], 'MyButton3 clicked with arg:', message.myArg);
        }
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
            <div class="button-container-vertical">
                <button onclick="onClick_MyButton1('My Arg Value 1')">My Button 1</button>
                <button onclick="onClick_MyButton2('My Arg Value 2')">My Button 2</button>
                <button onclick="onClick_MyButton3('My Arg Value 3')">My Button 3</button>
            </div>
            <script src="${script_Uri}"></script>
        </body>
        </html>
        `;
    }


}
