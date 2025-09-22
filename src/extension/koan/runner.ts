import * as vscode from 'vscode';
import { spawn } from 'child_process';

export class Python {


    public static help(): void {
        const python = spawn('python', ['-h']);

        python.stdout.on('data', (data) => {
            console.log(`Python:stdout: ${data}`);
        });

        python.stderr.on('data', (data) => {
            console.error(`Python:stderr: ${data}`);
        });

        python.on('close', (code) => {
            console.log(`Python: Child process exited with code ${code}`);
        });
    }


    public static start(script: vscode.Uri): string {
        const filePath = script.fsPath;
        const python = spawn('python', [filePath]);
        let result: string = '';

        python.stdout.on('data', (data) => {
            console.log(`Python:stdout: ${data}`);
            result += data;
        });

        python.stderr.on('data', (data) => {
            console.error(`Python:stderr: ${data}`);
            result += data;
        });

        python.on('close', (code) => {
            console.log(`Python: Child process exited with code ${code}`);
            return result;
        });

        return result;
    }


    public static async start_arguments(script: vscode.Uri, args: string[]): Promise<string> {
        const filePath = script.fsPath;

        return new Promise<string>((resolve, reject) => {
            const python = spawn('python', [filePath, ...args]);
            let stdout: string = '';
            let stderr: string = '';

            python.stdout.on('data', (data) => {
                console.log(`Python:stdout: ${data}`);
                stdout += data;
            });

            python.stderr.on('data', (data) => {
                console.error(`Python:stderr: ${data}`);
                stderr += data;
            });

            python.on('error', (error) => {
                console.error(`Python process error: ${error.message}`);
                reject(new Error(`Failed to start Python process: ${error.message}`));
            });

            python.on('close', (code) => {
                console.log(`Python: Child process exited with code ${code}`);
                if (code === 0) {
                    resolve(stdout);
                } else {
                    reject(new Error(`Python process exited with code ${code}: ${stderr}`));
                }
            });
        });
    }


}
