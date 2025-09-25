import * as vscode from 'vscode';
import { spawn } from 'child_process';


export enum ProcessEvents {
    Close = 'close',
    Disconnect = 'disconnect',
    Error = 'error',
    Exit = 'exit',
    Message = 'message',
    Spawn = 'spawn',
}


export enum StreamEvents {
    Data = 'data',
}


export class Python {
    public static readonly PATH: string = "PYTHONPATH";


    private static help(): void {
        const python = spawn('python', ['-h']);

        python.stdout.on(StreamEvents.Data, (data) => {
            console.log(`Python:stdout: ${data}`);
        });

        python.stderr.on(StreamEvents.Data, (data) => {
            console.error(`Python:stderr: ${data}`);
        });

        python.on(ProcessEvents.Close, (code) => {
            console.log(`Python: Child process exited with code ${code}`);
        });
    }


    public static start(script: vscode.Uri): string {
        const filePath = script.fsPath;
        const python = spawn('python', [filePath]);
        let result: string = '';

        python.stdout.on(StreamEvents.Data, (data) => {
            console.log(`Python:stdout: ${data}`);
            result += data;
        });

        python.stderr.on(StreamEvents.Data, (data) => {
            console.error(`Python:stderr: ${data}`);
            result += data;
        });

        python.on(ProcessEvents.Close, (code) => {
            console.log(`Python: Child process exited with code ${code}`);
            return result;
        });

        return result;
    }


    public static async start_arguments(script: vscode.Uri, args: string[]): Promise<string> {
        const filePath = script.fsPath;

        return new Promise<string>((resolve, reject) => {
            const python = spawn('python', [filePath, ...args]);
            console.log(`Python: ${filePath}`, ...args);

            let stdout: string = '';
            let stderr: string = '';

            python.stdout.on(StreamEvents.Data, (data) => {
                stdout += data;
            });

            python.stderr.on(StreamEvents.Data, (data) => {
                stderr += data;
            });

            python.on(ProcessEvents.Error, (error) => {
                reject(new Error(`Failed to start Python process:\n${error.message}`));
            });

            python.on(ProcessEvents.Close, (code) => {
                if (code === 0) {
                    console.log(`Python: Child process exited with code ${code}:\n${stdout}`);
                    resolve(stdout);
                } else {
                    reject(new Error(`Python process exited with code ${code}:\n${stderr}`));
                }
            });
        });
    }


}
