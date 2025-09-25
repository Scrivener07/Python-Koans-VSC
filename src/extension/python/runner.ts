import * as vscode from 'vscode';
import { Python } from '.';

export class Runner {
    public static readonly PYTHON_FILE: string = 'runner.py';


    public static async run(testScriptPath: vscode.Uri, pythonFilePath: string, member_id: string): Promise<{ success: boolean, message: string }> {
        try {
            // Run the test for the specific challenge.
            const output: string = await Python.start_arguments(testScriptPath, [pythonFilePath, member_id]);

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
