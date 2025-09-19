import * as vscode from 'vscode';
import { KoanLog } from '../log';

export class KoanNotebookKernel {
    private static readonly CONTROLLER_ID: string = 'python-koans-controller';
    private static readonly NOTEBOOK_TYPE: string = 'python-koans';
    private static readonly CONTROLLER_LABEL: string = 'Python Koans';
    private static readonly LANGUAGE_PYTHON: string = 'python';


    static activate(context: vscode.ExtensionContext) {
        KoanLog.info([this, this.activate], "Activating");
        context.subscriptions.push(KoanNotebookKernel.create());
    }


    static create(): vscode.NotebookController {
        // Register a custom notebook controller for executing cells
        const controller = vscode.notebooks.createNotebookController(
            KoanNotebookKernel.CONTROLLER_ID,
            KoanNotebookKernel.NOTEBOOK_TYPE,
            KoanNotebookKernel.CONTROLLER_LABEL
        );
        controller.supportedLanguages = [KoanNotebookKernel.LANGUAGE_PYTHON];
        controller.supportsExecutionOrder = true;
        controller.executeHandler = KoanNotebookKernel.onExecute;
        return controller;
    }


    // Execute cell handler
    static async onExecute(
        cells: vscode.NotebookCell[],
        notebook: vscode.NotebookDocument,
        controller: vscode.NotebookController
    ): Promise<void> {
        KoanLog.info([KoanNotebookKernel, KoanNotebookKernel.onExecute], 'Executing', cells.length, 'cells in notebook', notebook.uri.toString());
        for (const cell of cells) {
            const execution = controller.createNotebookCellExecution(cell);
            execution.start(Date.now());

            try {
                // Run the cell code through test runner
                // This is where you'd integrate with custom unittest runner
                const result = await KoanNotebookKernel.onRunUnitTest(cell.document.getText());

                // Create output with custom MIME type that renderer handles
                const outputItems = [
                    vscode.NotebookCellOutputItem.text(
                        JSON.stringify(result),
                        'x-application/custom-json-output'
                    )
                ];

                execution.replaceOutput([new vscode.NotebookCellOutput(outputItems)]);
                execution.end(true, Date.now());
            } catch (error) {
                execution.end(false, Date.now());
            }
        }
    }


    // Run Python unit tests for a cell.
    static async onRunUnitTest(code: string): Promise<any> {
        KoanLog.info([KoanNotebookKernel, KoanNotebookKernel.onRunUnitTest]);
        // TODO: Implement custom test runner logic
        return { result: 'pending', message: 'Test runner not implemented yet' };
    }


}
