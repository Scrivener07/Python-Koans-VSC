import { vscode } from "../services/vscode";
import { InitializeCommand, WebCommands } from "../../../shared/messaging";


export function file_details_render(data:InitializeCommand): string {
    return `
    <details>
        <summary>Document</summary>
        <ul>
            <li><b>File:</b> ${data.documentInfo.fileName}</li>
            <li><b>URI:</b> ${data.documentInfo.uri}</li>
            <li><b>Encoding:</b> ${data.documentInfo.encoding}</li>
            <li><b>Language:</b> ${data.documentInfo.language}</li>
            <li><b>Lines:</b> ${data.documentInfo.lineCount}</li>
            <li><b>Characters:</b> ${data.documentInfo.content.length}</li>
        </ul>
    </details>
    <details>
        <summary>Document: Exercise</summary>
        <ul>
            <li><b>File:</b> ${data.pythonDocumentInfo.fileName}</li>
            <li><b>URI:</b> ${data.pythonDocumentInfo.uri}</li>
            <li><b>Encoding:</b> ${data.pythonDocumentInfo.encoding}</li>
            <li><b>Language:</b> ${data.pythonDocumentInfo.language}</li>
            <li><b>Lines:</b> ${data.pythonDocumentInfo.lineCount}</li>
            <li><b>Characters:</b> ${data.pythonDocumentInfo.content.length}</li>
        </ul>
    </details>

    <details>
        <summary>Document Source</summary>
        <p>This is the full text of the document being edited.</p>
        <textarea class="output-content">${data.documentInfo.content}</textarea>
    </details>
    `;
}


function document_preview_raw() {
    const textarea = document.querySelector('textarea');
    if (textarea) {
        textarea.addEventListener('input', () => {
            // The text of the actual `*.koan` file json data.
            vscode.postMessage({
                command: WebCommands.Document_Update,
                text: textarea.value
            });
        });
    }
}
