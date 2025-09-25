import * as vscode from 'vscode';
import { Python } from '.';

export class Updater {
    public static readonly PYTHON_FILE: string = 'updater.py';


    public static async run(scriptPath: vscode.Uri, pythonFileUri: vscode.Uri, member_id: string, code: string): Promise<string> {
        const pythonFilePath: string = pythonFileUri.fsPath;
        return await Python.start_arguments(scriptPath, [
            pythonFilePath,
            member_id,
            code
        ]);
    }


}
