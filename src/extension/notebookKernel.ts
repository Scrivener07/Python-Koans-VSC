import * as vscode from 'vscode';
import { KoanLog } from './log';

export class KoanNotebookKernel {

    static activate(context: vscode.ExtensionContext) {
        KoanLog.info([this, this.activate], "Activating");
        // Register a custom notebook controller.
        context.subscriptions.push(KoanNotebookKernel.create());
    }


    static create(): vscode.NotebookController {
        // Register a custom notebook controller for executing cells
        const controller = vscode.notebooks.createNotebookController(
            'python-koans-controller',
            'python-koans',
            'Python Koans'
        );
        controller.supportedLanguages = ['python'];
        controller.supportsExecutionOrder = true;
        controller.executeHandler = executeNotebookCell;
        return controller
    }

}


// Execute cell handler
async function executeNotebookCell(
    cells: vscode.NotebookCell[],
    notebook: vscode.NotebookDocument,
    controller: vscode.NotebookController
): Promise<void> {
    KoanLog.info([KoanNotebookKernel, executeNotebookCell], 'Executing', cells.length, 'cells in notebook', notebook.uri.toString());
    for (const cell of cells) {
        const execution = controller.createNotebookCellExecution(cell);
        execution.start(Date.now());

        try {
            // Run the cell code through test runner
            // This is where you'd integrate with custom unittest runner
            const result = await runPythonTest(cell.document.getText());

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


// Run Python tests for a cell
async function runPythonTest(code: string): Promise<any> {
    KoanLog.info([KoanNotebookKernel, runPythonTest], 'Executing python cell...');
    // TODO: Implement custom test runner logic
    return { result: 'pending', message: 'Test runner not implemented yet' };
}
