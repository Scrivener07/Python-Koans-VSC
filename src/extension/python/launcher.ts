import * as vscode from 'vscode';
import { spawn } from 'child_process';
import { ProcessEvents, Python, StreamEvents } from '.';
import { TestFramework } from './testing';
import { TestResult } from '../../shared';

export class Launcher {

    /** The Python unit test launcher script to use. */
    public static readonly PYTHON_FILE: string = 'launcher.py';


    public static async launch(
        toolFileUri: vscode.Uri,
        pythonFileUri: vscode.Uri,
        member_id: string
    ): Promise<TestResult> {
        try {
            const pythonFilePath: string = pythonFileUri.fsPath;

            // TODO: This is a hack to shift the Python directory location.
            let identity = TestFramework.getIdentity(pythonFilePath, member_id);
            identity = identity.replace("C01.", "");

            // Get file path information.
            const path: string[] = TestFramework.split_path(pythonFilePath);
            const fileDirectory: string = path.slice(0, -1).join("\\").toString();
            const fileName: string | undefined = path.pop();
            if (!fileName) {
                throw new Error("The file name was undefined.");
            }

            // Set working directory to the file directory.
            const options = {
                cwd: fileDirectory,
                env: {
                    ...process.env,
                    'PYTHONPATH': fileDirectory
                }
            };


            // Execute the Python process.
            const python = spawn('python', [
                // fileName,
                toolFileUri.fsPath,
                'identity', identity
            ], options);

            // Handle the process instance.
            return new Promise((resolve, reject) => {
                let data_stdout: string = '';
                let data_stderr: string = '';

                python.on(ProcessEvents.Spawn, () => {
                    console.log(`Process ${ProcessEvents.Spawn}: '${fileName}'`);
                });

                python.stdout.on(StreamEvents.Data, (data) => {
                    console.log(`Process stream-out ${StreamEvents.Data}: '${fileName}'`);
                    data_stdout += data;
                });

                python.stderr.on(StreamEvents.Data, (data) => {
                    console.log(`Process stream-error ${StreamEvents.Data}: '${fileName}'`);
                    data_stderr += data;
                });

                // TODO: WIP
                python.on(ProcessEvents.Close, (code) => {
                    console.log(`Process ${ProcessEvents.Close}: '${fileName}'`);
                    if (data_stdout.trim()) {
                        const result: TestResult = {
                            success: true,
                            message: data_stdout
                        };
                        resolve(result);
                    }
                    else if (data_stderr.trim()) {
                        // Otherwise reject with the error info.
                        reject(new Error(`Python error: ${data_stderr}`));
                    }
                    else if (code !== 0) {
                        // If no output but non-zero exit code.
                        reject(new Error(`Python process exited with code ${code}.`));
                    }
                    else {
                        // No output but successful exit is suspicious.
                        reject(new Error('Test launcher produced no output.'));
                    }
                });

                python.on(ProcessEvents.Error, (error) => {
                    console.log(`Process error ${ProcessEvents.Error}: '${pythonFileUri}'`);
                    reject(new Error(`Failed to run test: ${error.message}`));
                });
            });
        } catch (error) {
            const result: TestResult = {
                success: false,
                message: `Error executing test: ${error instanceof Error ? error.message : String(error)}`
            };
            console.log(`Error ${ProcessEvents.Error}: '${pythonFileUri}'`, result);
            return result;
        }
    }


    public static async run_Original(
        programFileUri: vscode.Uri,
        pythonFileUri: vscode.Uri,
        member_id: string
    ): Promise<{ success: boolean, message: string }> {
        const pythonFilePath: string = pythonFileUri.fsPath;

        // Form the fully qualified test ID for the specific function
        const testId = TestFramework.get_ID(pythonFilePath, member_id);

        // Create the Python launcher command.
        let output: string = '';
        try {
            // Execute the Python test launcher.
            output = await Python.start_arguments(programFileUri, [
                pythonFilePath,
                testId
            ]);
        } catch (error) {
            console.error("Error running test:", error);
            return {
                success: false,
                message: `Error executing test: ${error instanceof Error ? error.message : String(error)}`
            };
        }

        // Parse the test result
        const result: any = JSON.parse(output);
        return {
            success: result.success,
            message: result.message || (result.success ? "Test passed!" : "Test failed.")
        };
    }


}
