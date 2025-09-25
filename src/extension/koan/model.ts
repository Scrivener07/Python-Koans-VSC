import * as vscode from 'vscode';
import { KoanLog } from '../log';
import { Manifest, Challenge } from './data';
import { DocumentInfo, EditorCommands, TestResult } from '../../shared';
import { KoanDocumentProvider } from './documents';
import { Python } from '../python';
import { Runner } from '../python/runner';
import { Launcher } from '../python/launcher';
import { Code } from '../python/code';
import { Updater } from '../python/updater';

// TODO: Ensure are created disposables are registered for disposal.

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

        // Parse the koan JSON manifest.
        try {
            this.read();
        } catch (error) {
            console.error('Failed to read koan manifest:', error);
            return;
        }


        // Get the backing Python file specified in the manifest.
        let exerciseDocument: vscode.TextDocument;
        try {
            exerciseDocument = await this.get_exercise_document(this.manifest);
        } catch (error) {
            console.error('Failed to get Python document:', error);
            return;
        }
        const exerciseDocumentInfo: DocumentInfo = {
            fileName: exerciseDocument.fileName,
            uri: exerciseDocument.uri.path,
            language: exerciseDocument.languageId,
            lineCount: exerciseDocument.lineCount,
            encoding: exerciseDocument.encoding,
            content: exerciseDocument.getText()
        };

        // Get the challenge data parsed from Python source code.
        let parsedPythonData: Challenge[];
        try {
            parsedPythonData = await this.python_ParseFile(exerciseDocument.uri);
        } catch (error) {
            console.error('Failed to parse Python file:', error);
            return;
        }

        // Set the webview's initial HTML content.
        await this.render();

        // Build the message data.
        const challenges: Challenge[] = Array.from(parsedPythonData.values());
        const challenges_map = challenges.map(challenge => ({
            name: challenge.name,
            instruction: challenge.instruction,
            code: challenge.code
        }));

        const documentInfo: DocumentInfo = {
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
            pythonDocumentInfo: exerciseDocumentInfo,
            challenges: challenges_map
        };

        this.panel.webview.postMessage(message);
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


    // Data
    //--------------------------------------------------

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
        const script_js = this.panel.webview.asWebviewUri(vscode.Uri.joinPath(this.rootWeb, 'index.js'));
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

            case EditorCommands.Code_Update:
                this.handle_CodeUpdate(message.member_id, message.code);
                break;

            case EditorCommands.Code_RunTests:
                this.handle_RunTests(message.member_id);
                break;

            case EditorCommands.Code_OpenVirtual:
                this.handle_CodeOpenVirtual(message.member_id);
                break;

            case EditorCommands.Output_Clear:
                vscode.window.showErrorMessage('Clear output functionality is not yet implemented.');
                break;

            case EditorCommands.Code_Reset:
                vscode.window.showErrorMessage('Code reset functionality is not yet implemented.');
                // TODO: Reset the code snippet to its original state.
                break;

            case EditorCommands.Code_Format:
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
        return vscode.workspace.applyEdit(edit);
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

    /**
     * Handles starting the Python test framework runner for a given test identity.
     * @param webviewPanel
     * @param document
     * @param member_id
     */
    private async handle_RunTests(member_id: string): Promise<void> {
        KoanLog.info([EditorModel, this.handle_RunTests], `ID: '${member_id}'`);
        try {
            // TODO: WIP
            // const testResult = await this.executeTests_Original(member_id);
            // const testResult = await this.execute_Runner(member_id);
            const testResult: TestResult = await this.execute_TestLauncher(member_id);

            // Send result back to webview.
            this.panel.webview.postMessage({
                command: EditorCommands.Output_Update,
                member_id: member_id,
                result: testResult
            });
        }
        catch (error) {
            KoanLog.error([EditorModel, this.handle_RunTests], 'Test execution failed:', error);

            // Send error result to webview.
            this.panel.webview.postMessage({
                command: EditorCommands.Output_Update,
                member_id: member_id,
                result: {
                    success: false,
                    message: `Test execution failed: ${error}`
                }
            });
        }
    }


    // TODO: WIP (Test Launcher)
    // TODO: The result is undefined.
    private async execute_TestLauncher(member_id: string): Promise<TestResult> {
        KoanLog.info([EditorModel, this.execute_TestLauncher], `ID: '${member_id}'`);
        const pythonDocument: vscode.TextDocument = await this.get_exercise_document(this.manifest);
        const pythonFileUri: vscode.Uri = pythonDocument.uri;
        const toolFileUri = vscode.Uri.joinPath(this.extensionUri, 'resources', 'python', Launcher.PYTHON_FILE);
        return await Launcher.launch(toolFileUri, pythonFileUri, member_id);
    }


    // TODO: WIP (Python Runner)
    private async execute_Runner(member_id: string): Promise<{ success: boolean, message: string }> {
        KoanLog.info([EditorModel, this.execute_Runner], `ID: '${member_id}'`);
        const pythonDocument: vscode.TextDocument = await this.get_exercise_document(this.manifest);
        const pythonFilePath: string = pythonDocument.uri.fsPath;
        const testScriptUri: vscode.Uri = vscode.Uri.joinPath(this.extensionUri, 'resources', 'python', Runner.PYTHON_FILE);
        return await Runner.run(testScriptUri, pythonFilePath, member_id);
    }


    // TODO: WIP (Original)
    private async execute_TestOriginal(member_id: string): Promise<{ success: boolean, message: string }> {
        KoanLog.info([EditorModel, this.execute_TestOriginal], `ID: '${member_id}'`);
        const pythonDocument: vscode.TextDocument = await this.get_exercise_document(this.manifest);
        const pythonFileUri: vscode.Uri = pythonDocument.uri;
        const scriptFileUri = vscode.Uri.joinPath(this.extensionUri, 'resources', 'python', Launcher.PYTHON_FILE);
        return await Launcher.run_Original(scriptFileUri, pythonFileUri, member_id);
    }


    // NOTE: This is a SIMULATED mock execution. (Original)
    private async execute_Tests_Dummy(member_id: string): Promise<{ success: boolean, message: string }> {
        KoanLog.info([EditorModel, this.execute_Tests_Dummy], `ID: '${member_id}'`);

        // Simulate test execution with a delay.
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Return a random mock result.
        return Math.random() > 0.5
            ? { success: true, message: `All tests passed for ${member_id}!` }
            : { success: false, message: `Test failed for ${member_id}: Expected True but got False` };
    }


    // Python Execution
    //--------------------------------------------------

    private async python_ParseFile(pythonFileUri: vscode.Uri): Promise<Challenge[]> {
        KoanLog.info([EditorModel, this.python_ParseFile], pythonFileUri.toString());

        // Execute the Python script to parse the file.
        const scriptPath: vscode.Uri = vscode.Uri.joinPath(this.extensionUri, 'resources', 'python', Code.PYTHON_FILE);
        let result: string = '';
        try {
            result = await Python.start_arguments(scriptPath, [pythonFileUri.fsPath]);
        }
        catch (error) {
            KoanLog.error([EditorModel, this.python_ParseFile], 'Failed to parse Python file:', error);
            return [];
        }

        let parsedData: any;
        try {
            parsedData = JSON.parse(result);
        } catch (error) {
            KoanLog.error([EditorModel, this.python_ParseFile], 'Failed to parse JSON from Python output:', error);
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
            KoanLog.error([EditorModel, this.python_ParseFile], 'Failed to create Challenge instances:', error);
            return [];
        }
    }


}
