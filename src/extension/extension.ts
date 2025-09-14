// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Register a custom notebook serializer
  context.subscriptions.push(
    vscode.workspace.registerNotebookSerializer('python-koans',
      new KoansNotebookSerializer())
  );

  // Register a custom notebook controller for executing cells
  const controller = vscode.notebooks.createNotebookController(
    'python-koans-controller',
    'python-koans',
    'Python Koans'
  );

  controller.supportedLanguages = ['python'];
  controller.supportsExecutionOrder = true;
  controller.executeHandler = executeNotebookCell;

  context.subscriptions.push(controller);

  // Register commands for the koans workflow
  context.subscriptions.push(
    vscode.commands.registerCommand('python-koans.verifyChallenge',
      verifyCurrentChallenge)
  );
}

// Notebook serializer implementation
class KoansNotebookSerializer implements vscode.NotebookSerializer {
  async deserializeNotebook(
    content: Uint8Array,
    token: vscode.CancellationToken
  ): Promise<vscode.NotebookData> {
    // Convert your koan file format to notebook data
    const contents = Buffer.from(content).toString();
    // Parse contents and create cells
    const cells: vscode.NotebookCellData[] = [];
    // TODO: Parse koan file and create cells

    return new vscode.NotebookData(cells);
  }

  async serializeNotebook(
    data: vscode.NotebookData,
    token: vscode.CancellationToken
  ): Promise<Uint8Array> {
    // Convert notebook data back to your koan format
    // TODO: Serialize cells back to koan format
    return Buffer.from(''); // Replace with actual serialization
  }
}

// Execute cell handler
async function executeNotebookCell(
  cells: vscode.NotebookCell[],
  notebook: vscode.NotebookDocument,
  controller: vscode.NotebookController
): Promise<void> {
  for (const cell of cells) {
    const execution = controller.createNotebookCellExecution(cell);
    execution.start(Date.now());

    try {
      // Run the cell code through your test runner
      // This is where you'd integrate with your custom unittest runner
      const result = await runPythonTest(cell.document.getText());

      // Create output with custom MIME type that your renderer handles
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
  // TODO: Implement your custom test runner logic
  return { result: 'pending', message: 'Test runner not implemented yet' };
}

// Command handler for verifying the current challenge
async function verifyCurrentChallenge() {
  // TODO: Implement verification logic
}

export function deactivate() {}
