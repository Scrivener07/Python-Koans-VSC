import * as vscode from 'vscode';
import { KoanLog } from '../log';
import { DocumentInfo, WebCommands, InitializeCommand, OutputUpdateCommand } from '../../shared';
import { TestSuite as TestSuite } from '../../shared/testing';
import { TestFramework } from '../python/testing';
import { Code } from '../python/code';
import { Updater } from '../python/updater';
import { Manifest, ChallengeData } from './data';
import { KoanDocumentProvider } from './documents';

// TODO: Ensure any created disposables are registered for disposal.

export class EditorModel implements vscode.Disposable {

    /** The text document being edited. This is the `*.koan` manifest file. */
    private readonly document: vscode.TextDocument;

    /** The webview panel to use. */
    private readonly panel: vscode.WebviewPanel;

    /** The uri of the directory containing the extension. */
    private readonly extensionUri: vscode.Uri;

    /** The compiled `out\` directory for this webview. */
    private readonly rootWeb: vscode.Uri;

    /** The resource file directory to use. */
    private readonly rootResource: vscode.Uri;

    /** Supports the `vscode.Disposable` interface implementation. */
    private disposables: vscode.Disposable[] = [];

    /** The manifest document data. */
    private manifest: Manifest = new Manifest();


    constructor(
        document: vscode.TextDocument,
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri
    ) {
        this.document = document;
        this.panel = panel;
        this.extensionUri = extensionUri;

        this.rootWeb = vscode.Uri.joinPath(this.extensionUri, 'out/client/editor');
        this.rootResource = vscode.Uri.joinPath(this.extensionUri, 'resources');

        // Setup disposable event handlers.
        this.disposables.push(
            panel.webview.onDidReceiveMessage(message => this.onMessage(message))
        );
    }


    public dispose(): void {
        // Dispose of all registered disposables.
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables = [];
        console.log('All resources have been disposed.');
    }


    // Initialization
    //--------------------------------------------------

    public async initialize(): Promise<void> {
        this.panel.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this.rootWeb,
                this.rootResource
            ]
        };

        // Set the webview's initial HTML content.
        await this.render();
    }


    // Rendering
    //--------------------------------------------------

    private async render(): Promise<void> {
        const html: string = this.render_index();
        this.panel.webview.html = html;
    }


    /**
     * Generate the HTML content for the webview.
     * @returns The generated HTML content.
     */
    private render_index(): string {
        KoanLog.info([EditorModel, this.render_index], this.document.uri.toString());
        const editor_css = this.panel.webview.asWebviewUri(vscode.Uri.joinPath(this.rootResource, 'views', 'editor', 'editor.css'));
        const common_css = this.panel.webview.asWebviewUri(vscode.Uri.joinPath(this.rootResource, 'views', 'koan.css'));
        const script_js = this.panel.webview.asWebviewUri(vscode.Uri.joinPath(this.rootWeb, 'index.js'));
        const workerBaseUrl = this.panel.webview.asWebviewUri(vscode.Uri.joinPath(this.rootWeb));
        return `
        <!DOCTYPE html>
        <html lang="en">

        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="${common_css}">
            <link rel="stylesheet" href="${editor_css}">
            <data id="monaco-worker-base-path" value="${workerBaseUrl}"></data>
            <title>Python Workbook</title>
        </head>

        <body>
            <script type="module" src="${script_js}"></script>
        </body>
        </html>`;
    }


    // Data
    //--------------------------------------------------

    private async handle_ready() {
        // Prepare the initialization data.
        const message: InitializeCommand = await this.getData();
        this.panel.webview.postMessage(message);
    }


    private async getData(): Promise<InitializeCommand> {
        // Parse the koan JSON manifest.
        this.read();
        const documentInfo: DocumentInfo = EditorModel.toDocumentInfo(this.document);

        // Get the backing Python file specified in the manifest.
        let exerciseDocument: vscode.TextDocument;
        exerciseDocument = await this.get_exercise_document(this.manifest);

        const exerciseDocumentInfo: DocumentInfo = EditorModel.toDocumentInfo(exerciseDocument);

        // Get the challenge data parsed from Python source code.
        let challenges: ChallengeData[];
        challenges = await this.getChallenges(exerciseDocument.uri);

        // Pack the values into a web message.
        const message: InitializeCommand = {
            command: WebCommands.Data_Initialize,
            documentInfo: documentInfo,
            pythonDocumentInfo: exerciseDocumentInfo,
            challenges: challenges
        };
        return message;
    }


    private static toDocumentInfo(document: vscode.TextDocument): DocumentInfo {
        return {
            fileName: document.fileName,
            uri: document.uri.path,
            language: document.languageId,
            lineCount: document.lineCount,
            encoding: document.encoding,
            content: document.getText()
        };
    }


    /** Parses challenge data from the subject exercise Python file. */
    private async getChallenges(pythonFileUri: vscode.Uri): Promise<ChallengeData[]> {
        KoanLog.info([EditorModel, this.getChallenges], pythonFileUri.toString());
        const scriptPath: vscode.Uri = vscode.Uri.joinPath(this.extensionUri, 'resources', 'python', Code.PYTHON_FILE);
        return await Code.getChallenges(scriptPath, pythonFileUri);
    }


    // Document
    //--------------------------------------------------

    /**
     * Handle koan manifest document changes by updating the web view.
     * @param e An event describing a transactional document change.
     *
     * Note: This is invoked by the *provider* for this custom-editor.
     */
    public onTextDocumentChanged(e: vscode.TextDocumentChangeEvent): void {
        this.read();
        this.render();
    }


    /** Parse the koan JSON manifest document. */
    private read(): void {
        const text: string = this.document.getText();
        try {
            this.manifest = Manifest.decode(text);
        }
        catch (error: unknown) {
            let errorMessage: string;
            if (error instanceof Error) {
                errorMessage = error.message;
            } else {
                errorMessage = String(error);
            }
            throw new Error(`Failed to decode manifest document: ${this.document.uri}\n  - ${errorMessage}`);
        }
    }


    private async get_exercise_document(manifest: Manifest): Promise<vscode.TextDocument> {
        // Resolve the Python exercise file path, relative to the koan file.
        const directory: vscode.Uri = vscode.Uri.joinPath(this.document.uri, '..');
        const exercise_uri: vscode.Uri = vscode.Uri.joinPath(directory, manifest.exercise);

        // Load the Python file as a VS Code document object.
        return await vscode.workspace.openTextDocument(exercise_uri);
    }


    private async get_test_document(manifest: Manifest): Promise<vscode.TextDocument> {
        // Resolve the Python exercise file path, relative to the koan file.
        const directory: vscode.Uri = vscode.Uri.joinPath(this.document.uri, '..');
        const test_uri: vscode.Uri = vscode.Uri.joinPath(directory, manifest.test);

        // Load the Python file as a VS Code document object.
        return await vscode.workspace.openTextDocument(test_uri);
    }


    private async get_solution_document(manifest: Manifest): Promise<vscode.TextDocument> {
        // Resolve the Python exercise file path, relative to the koan file.
        const directory: vscode.Uri = vscode.Uri.joinPath(this.document.uri, '..');
        const solution_uri: vscode.Uri = vscode.Uri.joinPath(directory, manifest.solution);

        // Load the Python file as a VS Code document object.
        return await vscode.workspace.openTextDocument(solution_uri);
    }


    // Messaging
    //--------------------------------------------------

    /**
     * Handle messages sent from webview.
     * @param message The received message data.
     */
    private onMessage(message: any): void {
        KoanLog.info([EditorModel, this.onMessage], 'Command:', message.command);
        switch (message.command) {
            case WebCommands.Data_Ready:
                this.handle_ready();
                break;

            case WebCommands.Document_Update:
                this.handle_UpdateTextDocument(this.document, message.text);
                break;

            case WebCommands.Code_Update:
                this.handle_CodeUpdate(message.member_id, message.code);
                break;

            case WebCommands.Code_RunTests:
                this.handle_RunTests(message.member_id);
                break;

            case WebCommands.Code_OpenVirtual:
                this.handle_CodeOpenVirtual(message.member_id);
                break;

            case WebCommands.Output_Clear:
                vscode.window.showErrorMessage('Clear output functionality is not yet implemented.');
                break;

            case WebCommands.Code_Reset:
                vscode.window.showErrorMessage('Code reset functionality is not yet implemented.');
                // TODO: Reset the code snippet to its original state.
                break;

            case WebCommands.Code_Format:
                vscode.window.showErrorMessage('Code format functionality is not yet implemented.');
                // TODO: Format the provided snippet and pass it back to the webview.
                break;

            default:
                KoanLog.warn([EditorModel, this.onMessage], 'Unhandled command:', message.command);
        }
    }


    // Document Editing
    //--------------------------------------------------

    private handle_UpdateTextDocument(document: vscode.TextDocument, value: string) {
        KoanLog.info([EditorModel, this.handle_UpdateTextDocument], 'Document:', document.uri.toString());
        const edit = new vscode.WorkspaceEdit();
        const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(document.getText().length)
        );
        edit.replace(document.uri, fullRange, value);
        vscode.workspace.applyEdit(edit);

        // TODO: The document will not actually save.
        // return document.save();
    }


    /**
     * Opens a virtual document for this code member.
     * @param member_id The member identifier to use.
     */
    private async handle_CodeOpenVirtual(member_id: string): Promise<void> {
        KoanLog.info([EditorModel, this.handle_CodeOpenVirtual], `ID: '${member_id}'`);
        const uri: vscode.Uri = vscode.Uri.parse(`${KoanDocumentProvider.VIEW_TYPE}:${member_id}.py`);
        const document: vscode.TextDocument = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(document, vscode.ViewColumn.Beside);
    }


    private async handle_CodeUpdate(member_id: string, code: string): Promise<void> {
        KoanLog.info([EditorModel, this.handle_CodeUpdate], `ID: '${member_id}'`, `Code:\n'${code}'`);
        try {
            // Get the backing Python document.
            const pythonDocument: vscode.TextDocument = await this.get_exercise_document(this.manifest);
            const pythonFileUri: vscode.Uri = pythonDocument.uri;

            // Create the Python script path.
            const scriptPath: vscode.Uri = vscode.Uri.joinPath(this.extensionUri, 'resources', 'python', Updater.PYTHON_FILE);

            // Run the Python updater script.
            const updatedContent: string = await Updater.run(scriptPath, pythonFileUri, member_id, code);

            // Create edit with the entire updated content.
            const edit: vscode.WorkspaceEdit = new vscode.WorkspaceEdit();
            const entireDocument: vscode.Range = new vscode.Range(
                new vscode.Position(0, 0),
                pythonDocument.lineAt(pythonDocument.lineCount - 1).range.end
            );
            edit.replace(pythonFileUri, entireDocument, updatedContent);

            // Apply the edit
            await vscode.workspace.applyEdit(edit);
            vscode.window.setStatusBarMessage(`Updated function ${member_id}`, 3000);
        } catch (error: unknown) {
            let errorMessage: string;
            if (error instanceof Error) {
                errorMessage = error.message;
            } else {
                errorMessage = String(error);
            }
            vscode.window.showErrorMessage(`Failed to update function: ${errorMessage}`);
        }
    }


    // Test Execution
    //--------------------------------------------------

    /** Handles starting the Python test framework runner for a given test identity. */
    private async handle_RunTests(member_id: string): Promise<void> {
        KoanLog.info([EditorModel, this.handle_RunTests], `ID: '${member_id}'`);
        const testDocument: vscode.TextDocument = await this.get_test_document(this.manifest);
        try {
            const suite: TestSuite = await TestFramework.execute(testDocument.uri, member_id);
            const outputUpdateCommand: OutputUpdateCommand = {
                command: WebCommands.Output_Update,
                member_id: member_id,
                suite: suite
            };

            // Send result back to webview.
            this.panel.webview.postMessage(outputUpdateCommand);
        }
        catch (error) {
            KoanLog.error([EditorModel, this.handle_RunTests], 'Test execution failed:', error);
        }
    }


}
