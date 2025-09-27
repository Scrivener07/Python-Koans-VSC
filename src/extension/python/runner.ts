import * as vscode from 'vscode';
import { Python } from '.';

export class Runner {
    public static readonly PYTHON_FILE: string = 'runner.py';


    public static async run(testScriptUri: vscode.Uri, pythonFilePath: string, member_id: string): Promise<{ success: boolean, message: string }> {
        try {
            // Run the test for the specific challenge.
            const processResult = await Python.execute([testScriptUri.fsPath, pythonFilePath, member_id]);
            const output: string = processResult.output.join('\n');

            // Parse the test result.
            const result = JSON.parse(output);
            return {
                success: result.success,
                message: result.message
            };
        } catch (error: any) {
            return {
                success: false,
                message: `Test execution failed: ${error.message}`
            };
        }
    }


}
