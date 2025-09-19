import * as vscode from 'vscode';
import { KoanData, Challenge } from './data';

class View {

    public static getFallbackHtml(css_common: vscode.Uri, css_editor: vscode.Uri, script_Uri: vscode.Uri, document: vscode.TextDocument): string {
        const data: KoanData = new KoanData();
        let challenges_html: string = '';
        for (const [name, challenge] of data.challenges) {
            challenges_html += View.html_Challenge(challenge);
        }

        // This is json data, so it needs to be escaped for HTML.
        // TODO: Deserialize the JSON and display it properly.
        const content: string = document.getText();
        const escapedContent: string = View.escapeHtml(content);
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


    private static escapeHtml(text: string): string {
        return text.replace(/[&<>"']/g, (markup) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[markup] as string));
    }


}
