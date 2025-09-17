import * as vscode from 'vscode';
import { KoanLog } from './KoanLog';

export class KoanNotebookSerializer implements vscode.NotebookSerializer {


    static activate(context: vscode.ExtensionContext) {
        KoanLog.info([this, this.activate], context.extensionUri, "Registering notebook serializer");

        // Register a custom notebook serializer.
        context.subscriptions.push(
            vscode.workspace.registerNotebookSerializer('python-koans', new KoanNotebookSerializer())
        );
    }

    // Convert koan file format to notebook data.
    async deserializeNotebook(content: Uint8Array, token: vscode.CancellationToken): Promise<vscode.NotebookData> {
        console.log('Deserializing koan notebook...');

        // Parse the JSON content from the notebook file.
        const text: string = Buffer.from(content).toString();
        let json;
        try {
            json = JSON.parse(text);
            console.log('Parsed notebook with', json.cells?.length || 0, 'cells');
        } catch (error) {
            console.error('Failed to parse JSON:', error);
            return new vscode.NotebookData([]);
        }

        // Create cells with appropriate metadata.
        // Iterate over json cells or empty array.
        const cells: vscode.NotebookCellData[] = [];
        for (const cellData of json.cells || []) {
            const cell: vscode.NotebookCellData | undefined = this.deserializeCell(cellData);
            if (cell) {
                cells.push(cell);
            }
            else {
                console.error('Failed to deserialize cell:', cellData);
                continue;
            }
        }

        // Create and return the notebook data object from the cells.
        const notebook_data: vscode.NotebookData = new vscode.NotebookData(cells);
        return notebook_data;
    }



    private deserializeCell(cellData: any): vscode.NotebookCellData | undefined {
        // Handle `source` as array (Jupyter format) or string
        let source = cellData.source;
        if (source) {
            if (Array.isArray(source)) {
                source = source.join('\n');
            }
        }
        else {
            console.log('Cell source is empty or undefined, defaulting to empty string.');
            source = '';
        }

        // Map Jupyter `cell_type` to VS Code cell `kind`.
        let kind: vscode.NotebookCellKind;
        if (cellData.cell_type === 'code') {
            kind = vscode.NotebookCellKind.Code;
        } else {
            kind = vscode.NotebookCellKind.Markup;
        }

        // Default to python for code cells if language is not specified
        // NOTE: This is a non-standard field that may be undefined.
        let language = cellData.language;
        if (!language) {
            if (kind === vscode.NotebookCellKind.Code) {
                language = 'python';
            }
            else {
                language = 'markdown';
            }
        }

        // Create the cell
        let cell: vscode.NotebookCellData;
        try {
            // Attempt to create the cell
            cell = new vscode.NotebookCellData(kind, source, language);
        } catch (error) {
            console.error('Failed to create notebook cell:', error);
            return undefined;
        }

        // Set cell metadata
        cell.metadata = {
            editable: kind === vscode.NotebookCellKind.Code,
            runnable: kind === vscode.NotebookCellKind.Code,
            deletable: false,
            koan: {
                role: kind === vscode.NotebookCellKind.Code ? 'solution' : 'instruction'
            }
        };

        return cell;
    }


    // Identify cells that should be editable.
    private isSolutionCell(cellData: any): boolean {
        // Check metadata first
        if (cellData.metadata?.role === 'solution' || cellData.metadata?.editable === true) {
            return true;
        }

        // Only code cells can be solution cells
        if (cellData.cell_type !== 'code') {
            return false;
        }

        // Check content patterns
        const content = Array.isArray(cellData.source) ? cellData.source.join('') : cellData.source || '';

        // Look for def challenge_ pattern or NotImplementedError
        return /def\s+challenge_\d+\s*\(/i.test(content) ||
            content.includes('raise NotImplementedError()') ||
            content.includes('# Your code here') ||
            content.includes('# TODO:');
    }


    // Convert notebook data back to koan format.
    async serializeNotebook(data: vscode.NotebookData, token: vscode.CancellationToken): Promise<Uint8Array> {
        console.log('Serializing koan notebook...');

        // Convert notebook data back to JSON format.
        const json = {
            cells: data.cells.map(cell => {
                return {
                    cell_type: cell.kind === vscode.NotebookCellKind.Code ? 'code' : 'markdown',
                    // language: cell.languageId,
                    metadata: cell.metadata,
                    source: cell.value
                };
            })
        };

        // Serialize cells back to koan notebook format.
        const content = JSON.stringify(json, null, 4);
        return Buffer.from(content);
    }


}
