import * as vscode from 'vscode';
import { Python, ProcessResult } from '.';

export class Updater {
    public static readonly PYTHON_FILE: string = 'updater.py';


    public static async run(scriptUri: vscode.Uri, pythonFileUri: vscode.Uri, member_id: string, code: string): Promise<string> {
        const processResult: ProcessResult = await Python.execute([
            scriptUri.fsPath,
            pythonFileUri.fsPath,
            member_id,
            code
        ]);
        return processResult.output.join('\n');
    }


}
