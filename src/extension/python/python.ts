import { ChildProcessWithoutNullStreams, spawn } from 'child_process';


export interface PythonOptions {
    cwd?: string;
    pythonPath?: string;
    encoding?: Encoding;
    pipeData?: boolean
}


export enum Encoding {
    UTF8 = 'utf-8',
    UTF16 = 'utf-16',
    UTF32 = 'utf-32',
    ASCII = 'ascii',
    LATIN1 = 'latin1',
    CP1252 = 'cp1252'
}


export enum ProcessEvents {
    Close = 'close',
    Disconnect = 'disconnect',
    Error = 'error',
    Exit = 'exit',
    Message = 'message',
    Spawn = 'spawn',
}


export enum StreamEvents {
    Error = 'error',
    Data = 'data',
    End = 'end'
}


export class ProcessResult {
    public processID?: number;
    public exitCode: number | null = null;
    public errors: string[] = [];
    public output: string[] = [];
}


export class Python {
    private static readonly Executable: string = 'python';
    private static readonly PATH: string = 'PYTHONPATH';
    private static readonly ENCODING: string = 'PYTHONIOENCODING';

    private static readonly PIPE_DATA: number = 3;


    /** Execute a Python process and collect the results (stdout/stderr). */
    public static execute(
        args: string[] = [],
        options: PythonOptions = {}
    ): Promise<ProcessResult> {
        const python = this.spawn(args, options);
        return this.monitor(python);
    }


    /** Internal method to set up and spawn a Python process. */
    public static spawn(
        args: string[] = [],
        options: PythonOptions = {}
    ): ChildProcessWithoutNullStreams {
        const environment = {
            ...process.env,
            [Python.ENCODING]: options.encoding || Encoding.UTF8
        };

        if (options.pythonPath) {
            environment[Python.PATH] = options.pythonPath;
        }

        return spawn(Python.Executable, args, {
            cwd: options.cwd,
            env: environment,
            // stdin@0, stdout@1, stderr@2, fd_json@3
            stdio: options.pipeData ?
                ['pipe', 'pipe', 'pipe', 'pipe'] :  // With JSON pipe
                ['pipe', 'pipe', 'pipe']            // Standard pipes only
        });
    }


    /** Monitor process execution to collect results. */
    public static monitor(
        python: ChildProcessWithoutNullStreams
    ): Promise<ProcessResult> {
        return new Promise((resolve, reject) => {
            const result: ProcessResult = new ProcessResult();

            python.on(ProcessEvents.Error, (error) => {
                console.log(`Process[${python.pid}]:${ProcessEvents.Error}:`, error.message);
                reject(error);
            });

            python.on(ProcessEvents.Spawn, () => {
                console.log(`Process[${python.pid}]:${ProcessEvents.Spawn}`);
            });

            if (python.stdout) {
                python.stdout.on(StreamEvents.Data, (data) => {
                    console.log(`Process[${python.pid}]:stdout:${StreamEvents.Data}:`, String(data));
                    result.output.push(data);
                });
            }

            if (python.stderr) {
                python.stderr.on(StreamEvents.Data, (data) => {
                    console.log(`Process[${python.pid}]:stderr:${StreamEvents.Data}:`, String(data));
                    result.errors.push(data);
                });
            }

            python.on(ProcessEvents.Close, (code) => {
                console.log(`Process[${python.pid}] ${ProcessEvents.Close}`);
                result.processID = python.pid;
                result.exitCode = code;
                resolve(result);
            });
        });
    }


    public static pipe_json(process: ChildProcessWithoutNullStreams): Promise<any> {
        if (process.stdio.length < Python.PIPE_DATA) {
            console.error("JSON pipe stream not available.");
            return Promise.resolve(null);
        }

        const pipe = process.stdio[Python.PIPE_DATA];
        if (!pipe) {
            console.error("JSON pipe stream was null or undefined.");
            return Promise.resolve(null);
        }

        // Create a promise to handle the JSON data.
        return new Promise<any>((resolve) => {
            let text: string = '';
            let hasData = false;

            pipe.on(StreamEvents.Data, (data) => {
                hasData = true;
                text += data.toString();
            });

            pipe.on(StreamEvents.End, () => {
                if (!hasData) {
                    console.warn('JSON pipe closed without sending any data.');
                    resolve(null);
                    return;
                }
                try {
                    if (text.trim()) {
                        resolve(JSON.parse(text));
                    } else {
                        console.warn('JSON pipe sent empty data.');
                        resolve(null);
                    }
                } catch (error) {
                    console.error('Failed to parse JSON:', error, 'Data:', text);
                    resolve(null);
                }
            });

            pipe.on(StreamEvents.Error, (err) => {
                console.error('JSON pipe error:', err);
                resolve(null);
            });

        });
    }


    private static help(): Promise<ProcessResult> {
        return Python.execute(['-h']);
    }


}
