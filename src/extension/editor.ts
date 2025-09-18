import * as vscode from 'vscode';
import { KoanLog } from './log';
import { KoanData, Challenge } from './koans/data';

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
    Document_UpdateText = 'update',
    Code_RunTests = 'runTests',
    Code_Reset = 'resetChallenge',
    Code_OpenCell = 'openCodeCell',
    Code_Format = 'formatCode',
    Output_Update = 'updateChallengeOutput',
    Output_Clear = 'clearOutput'
}


class KoanEditorProvider implements vscode.CustomTextEditorProvider {

    public static readonly VIEW_TYPE: string = 'python-koans.koanEditor';


    constructor(private extensionUri: vscode.Uri) {
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
            // enableCommandUris: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this.extensionUri, 'resources')
            ]
        };

        // Set the webview's initial HTML content.
        webviewPanel.webview.html = this.getHtml(document, webviewPanel.webview);

        // Handle messages from the webview.
        webviewPanel.webview.onDidReceiveMessage(message =>
            this.onMessage(webviewPanel, document, message)
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
            KoanLog.info([KoanEditorProvider, this.onDocumentChanged], e.document.uri.toString());
            webviewPanel.webview.html = this.getHtml(document, webviewPanel.webview);
        }
    }


    private onMessage(webviewPanel: vscode.WebviewPanel, document: vscode.TextDocument, message: any): void {
        KoanLog.info([KoanEditorProvider, this.onMessage], 'Command:', message.command);
        switch (message.command) {
            case EditorCommands.Document_UpdateText:
                this.handle_UpdateTextDocument(document, message.text);
                break;

            case EditorCommands.Code_OpenCell:
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
        // Create a virtual document for this code cell.
        const uri = vscode.Uri.parse(`koan-cell:${member_id}.py`);
        const doc = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
    }


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
    private async executeTests(member_id: string): Promise<{success: boolean, message: string}> {
        // Simulate test execution with a delay.
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Return a random mock result.
        return Math.random() > 0.5
            ? { success: true, message: `All tests passed for ${member_id}!` }
            : { success: false, message: `Test failed for ${member_id}: Expected True but got False` };
    }


    // HTML
    //--------------------------------------------------

    private getHtml(document: vscode.TextDocument, webview: vscode.Webview): string {
        KoanLog.info([KoanEditorProvider, this.getHtml], document.uri.toString());

        const css_common = webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, 'resources', 'views', 'koan.css')
        );

        const css_editor = webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, 'resources', 'views', 'editor', 'editor.css')
        );

        const script_Uri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, 'resources', 'views', 'editor', 'editor.js')
        );

        const data: KoanData = new KoanData();
        let challenges_html: string = '';
        for (const [name, challenge] of data.cells) {
            KoanLog.info([KoanEditorProvider, this.getHtml], `Challenge: ${name} - ${challenge.description()}.`);
            challenges_html += KoanEditorProvider.html_Challenge(challenge);
        }

        const content: string = document.getText();
        const escapedContent: string = this.escapeHtml(content);
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="stylesheet" href="${css_common}">
                <link rel="stylesheet" href="${css_editor}">
                <title>Python Koan Editor</title>
            </head>
            <body>
                <h1>Challenges</h1>
                <p>The python module docstring will be loaded in here.</p>
                <div>
                    ${challenges_html}
                </div>

                <h1>Document</h1>
                <ul>
                    <details>
                        <summary>Document Details</summary>
                        <ul>
                            <li><b>File:</b> ${document.fileName}</li>
                            <li><b>URI:</b> ${document.uri.path}</li>
                            <li><b>Lines:</b> ${document.lineCount}</li>
                            <li><b>Characters:</b> ${content.length}</li>
                        </ul>
                    </details>
                    <details>
                        <summary>Document Source</summary>
                        <p>This is the full text of the document being edited.</p>
                        <textarea class="code-cell">${escapedContent}</textarea>
                    </details>
                </ul>

                <script src="${script_Uri}"></script>
            </body>
            </html>
        `;
    }


    private static html_Challenge(challenge: Challenge): string {
        return `
    <div class="challenge-container" data-challenge-id="${challenge.name}">

        <!-- Challenge Header -->
        <div class="challenge-header">
            <div class="challenge-title">
                <h2>${challenge.name}</h2>
                <span class="challenge-status" data-status="pending">○</span>
            </div>

            <div class="challenge-controls">
                <button class="btn-secondary" onclick="toggleChallenge('${challenge.name}')">
                    <span class="icon">📖</span> View Instructions
                </button>
                <button class="btn-primary" onclick="runChallenge('${challenge.name}')">
                    <span class="icon">▶</span> Run Tests
                </button>
                <button class="btn-secondary" onclick="openCodeCell('${challenge.name}')">
                    <span class="icon">📝</span> Open Code Cell
                </button>
            </div>
        </div>

        <!-- Instructions Panel (Collapsible) -->
        <div class="challenge-instructions" id="${challenge.name}_instructions">
            <div class="instructions-content">
                ${challenge.instruction}
            </div>
        </div>

        <!-- Code Editor Section -->
        <div class="challenge-code-section">
            <div class="code-header">
                <span class="code-label">Your Solution</span>
                <div class="code-actions">
                    <button class="btn-icon" onclick="resetChallenge('${challenge.name}')" title="Reset to original">
                        <span class="icon">↺</span>
                    </button>
                    <button class="btn-icon" onclick="formatCode('${challenge.name}')" title="Format code">
                        <span class="icon">✨</span>
                    </button>
                </div>
            </div>
            <div class="code-editor" id="${challenge.name}_editor">
                <textarea
                    id="${challenge.name}_code"
                    class="code-input"
                    placeholder="# Write your solution here..."
                    spellcheck="false"
                >${challenge.code}</textarea>
            </div>
        </div>

        <!-- Output Section -->
        <div class="challenge-output-section">
            <div class="output-header">
                <span class="output-label">Test Results</span>
                <div class="output-actions">
                    <button class="btn-icon" onclick="clearOutput('${challenge.name}')" title="Clear output">
                        <span class="icon">🗑</span>
                    </button>
                </div>
            </div>
            <div class="output-content" id="${challenge.name}_output">
                <div class="output-placeholder">
                    Run tests to see results here...
                </div>
            </div>
        </div>
    </div>
    `;
    }


    private static html_Challenge_old(challenge: Challenge): string {
        return `
        <details class="challenge-block">
            <summary class="challenge-block-header">${challenge.name}</summary>

            <h2>${challenge.name}</h2>
            <div class="instruction-cell">
                <p>${challenge.instruction}</p>
            </div>

            <div class="code-cell">
                <textarea id="${challenge.name}_python">${challenge.code}</textarea>
            </div>

            <div id="${challenge.name}_preview" class="code-cell">
                <pre><code id="${challenge.name}_output">The output will be displayed here.</code></pre>
            </div>

            <div class="code-buttons">
                <button onclick="${EditorCommands.Code_OpenCell}('${challenge.name}')">Open Code</button>
                <button onclick="${EditorCommands.Code_RunTests}('${challenge.name}')">Run Tests</button>
            </div>

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
