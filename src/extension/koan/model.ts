import * as vscode from 'vscode';
import { KoanLog } from '../log';
import { Challenge } from './data';
import { EditorCommands } from '../../shared';
import { KoanDocumentProvider } from './documents';
import { Python } from './runner';

// https://code.visualstudio.com/api/extension-guides/webview

export class EditorModel implements vscode.Disposable {

    /** The text document being edited. */
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


    constructor(
        document: vscode.TextDocument,
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri
    ) {
        this.document = document;
        this.panel = panel;
        this.extensionUri = extensionUri;

        this.rootWeb = vscode.Uri.joinPath(this.extensionUri, 'out/webview');
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

    // Track the Python document
    // private pythonFileUri: vscode.Uri | undefined;
    // private pythonDocument: vscode.TextDocument | undefined;


    public async initialize(): Promise<void> {
        this.panel.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this.rootWeb,
                this.rootResource
            ]
        };

        //----------

        // Parse the koan JSON manifest.
        let koanData: any;
        try {
            koanData = this.get_json_data();
        } catch (error) {
            console.error('Failed to parse koan JSON manifest:', error);
            return;
        }

        //----------

        let pythonDocument: vscode.TextDocument;
        try {
            pythonDocument = await this.get_python_document(koanData);
        } catch (error) {
            console.error('Failed to get Python document:', error);
            return;
        }
        const pythonDocumentInfo = {
            fileName: pythonDocument.fileName,
            uri: pythonDocument.uri.path,
            language: pythonDocument.languageId,
            lineCount: pythonDocument.lineCount,
            encoding: pythonDocument.encoding,
            content: pythonDocument.getText()
        };

        //----------

        let parsedPythonData: Challenge[];
        try {
            parsedPythonData = await this.pythonParseFile(pythonDocument.uri);
        } catch (error) {
            console.error('Failed to parse Python file:', error);
            return;
        }
        //----------

        // Set the webview's initial HTML content.
        await this.render();

        //----------

        // After setting HTML, send initial data.
        // const data = new KoanData();

        //----------

        // Build the message data.
        const challenges: Challenge[] = Array.from(parsedPythonData.values());
        const challenges_map = challenges.map(challenge => ({
            name: challenge.name,
            instruction: challenge.instruction,
            code: challenge.code
        }));

        const documentInfo = {
            fileName: this.document.fileName,
            uri: this.document.uri.path,
            language: this.document.languageId,
            lineCount: this.document.lineCount,
            encoding: this.document.encoding,
            content: this.document.getText()
        };

        const message = {
            command: EditorCommands.Data_Initialize,
            documentInfo: documentInfo,
            pythonDocumentInfo: pythonDocumentInfo,
            challenges: challenges_map
        };

        this.panel.webview.postMessage(message);
    }


    private get_json_data(): any {
        // Parse the koan JSON manifest.
        const content = this.document.getText();
        const data = JSON.parse(content);
        if (!data.python) {
            throw new Error("No Python file specified in koan manifest");
        }
        return data;
    }


    private async get_python_document(koanData: any): Promise<vscode.TextDocument> {
        // Resolve the Python file path relative to the koan file.
        const koanUri = this.document.uri;
        const koanDirUri = vscode.Uri.joinPath(koanUri, '..');
        const pythonFileUri = vscode.Uri.joinPath(koanDirUri, koanData.python);

        // Load t1he Python document
        return await vscode.workspace.openTextDocument(pythonFileUri);
    }



    // Document
    //--------------------------------------------------

    public onTextDocumentChanged(e: vscode.TextDocumentChangeEvent): void {
        // Handle document changes by updating the web view.
        this.render();
    }


    // Rendering
    //--------------------------------------------------

    private async render(): Promise<void> {
        const html = await this.render_index();
        this.panel.webview.html = html;
    }


    /**
     * Generate the HTML content for the webview.
     * @returns The generated HTML content.
     */
    private async render_index(): Promise<string> {
        KoanLog.info([EditorModel, this.render_index], this.document.uri.toString());
        const editor_css = this.panel.webview.asWebviewUri(vscode.Uri.joinPath(this.rootResource, 'views', 'editor', 'editor.css'));
        const common_css = this.panel.webview.asWebviewUri(vscode.Uri.joinPath(this.rootResource, 'views', 'koan.css'));
        const script_js = this.panel.webview.asWebviewUri(vscode.Uri.joinPath(this.rootWeb, 'editor', 'index.js'));
        return `
        <!DOCTYPE html>
        <html lang="en">

        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="${common_css.toString()}">
            <link rel="stylesheet" href="${editor_css.toString()}">
            <title>Python Koan Editor</title>
        </head>

        <body>
            <h1>Python Koan Editor</h1>

            <p id="module-docstring">The Python module <code>docstring</code> will be loaded in here.</p>

            <h1>Document</h1>
            <div id="document-details">
                <p>Loading document details...</p>
            </div>

            <h1>Challenges</h1>
            <div id="challenges-container">
                <p>Loading challenges from Python members...</p>
            </div>

            <script src="${script_js.toString()}"></script>
        </body>

        </html>`;
    }


    private render_error(html_uri: vscode.Uri, error: any): string {
        return `
        <!DOCTYPE html>
        <html lang="en">

        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Error</title>
        </head>

        <body>
            <p>Error loading HTML document.</p>
            <p>${html_uri.toString()}</p>
            <pre>${error}</pre>
        </body>

        </html>
        `;
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
            case EditorCommands.Document_UpdateText:
                this.handle_UpdateTextDocument(this.document, message.text);
                break;

            case EditorCommands.Code_OpenVirtual:
                this.handle_CodeOpenVirtual(message.member_id);
                break;

            case EditorCommands.Code_Reset:
                vscode.window.showErrorMessage('Code reset functionality is not yet implemented.');
                // TODO: Reset the code snippet to its original state.
                break;

            case EditorCommands.Code_Format:
                vscode.window.showErrorMessage('Code format functionality is not yet implemented.');
                // TODO: Format the provided snippet and pass it back to the webview.
                break;

            case EditorCommands.Code_RunTests:
                this.handle_RunTests(this.panel, this.document, message.member_id);
                break;

            case EditorCommands.Output_Clear:
                vscode.window.showErrorMessage('Clear output functionality is not yet implemented.');
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
        return vscode.workspace.applyEdit(edit);
    }


    private async handle_CodeOpenVirtual(member_id: string): Promise<void> {
        KoanLog.info([EditorModel, this.handle_CodeOpenVirtual], 'ID:', member_id);
        // Create a virtual document for this code member.
        const uri = vscode.Uri.parse(`${KoanDocumentProvider.VIEW_TYPE}:${member_id}.py`);
        const doc = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
    }


    // Test Execution
    //--------------------------------------------------

    private async handle_RunTests(webviewPanel: vscode.WebviewPanel, document: vscode.TextDocument, member_id: string): Promise<void> {
        KoanLog.info([EditorModel, this.handle_RunTests], 'ID:', member_id);
        try {
            // TODO: Simulate running tests for now...
            const testResult = await this.executeTests(member_id);

            // Send result back to webview
            webviewPanel.webview.postMessage({
                command: EditorCommands.Output_Update,
                member_id: member_id,
                result: testResult
            });

        }
        catch (error) {
            KoanLog.error([EditorModel, this.handle_RunTests], 'Test execution failed:', error);

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
    private async executeTests(member_id: string): Promise<{ success: boolean, message: string }> {
        // Simulate test execution with a delay.
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Return a random mock result.
        return Math.random() > 0.5
            ? { success: true, message: `All tests passed for ${member_id}!` }
            : { success: false, message: `Test failed for ${member_id}: Expected True but got False` };
    }


    // Python Execution
    //--------------------------------------------------

    private python_start() {
        KoanLog.info([EditorModel, this.python_start]);
        const scriptPath = vscode.Uri.joinPath(this.extensionUri, 'resources', 'python', 'program.py');
        try {
            Python.start(scriptPath);
        } catch (error) {
            console.log('Failed to start Python process:', error);
            return;
        }
    }


    private async pythonParseFile(pythonFileUri: vscode.Uri): Promise<Challenge[]> {
        if (!pythonFileUri) {
            console.error('No Python file URI provided for parsing.');
            return [];
        }

        // Execute the Python script to parse the file.
        const scriptPath = vscode.Uri.joinPath(this.extensionUri, 'resources', 'python', 'parse_ast.py');
        let result: string = '';
        try {
            result = await Python.start_arguments(scriptPath, [pythonFileUri.fsPath]);
            console.log('Python parse result:\n', result);
        }
        catch (error) {
            KoanLog.error([EditorModel, this.pythonParseFile], 'Failed to parse Python file:', error);
            return [];
        }

        let parsedData: any;
        try {
            parsedData = JSON.parse(result);
        } catch (error) {
            KoanLog.error([EditorModel, this.pythonParseFile], 'Failed to parse JSON from Python output:', error);
            return [];
        }

        if (!parsedData || !parsedData.challenges) {
            throw new Error('Invalid data format returned from Python parser.');
        }

        try {
            // Access the challenges array from the parsed data
            const challenges: Challenge[] = parsedData.challenges.map(
                (item: any) => new Challenge(item.name, item.instruction, item.code)
            );
            return challenges;
        } catch (error) {
            KoanLog.error([EditorModel, this.pythonParseFile], 'Failed to create Challenge instances:', error);
            return [];
        }
    }


}
