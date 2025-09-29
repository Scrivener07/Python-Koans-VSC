import { ChildProcessWithoutNullStreams, spawn } from 'child_process';


export interface PythonOptions {
    cwd?: string;
    pythonPath?: string;
    encoding?: Encoding;
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
    Data = 'data',
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


    /** Execute a Python process and collect the results (stdout/stderr). */
    public static execute(
        args: string[] = [],
        options: PythonOptions = {}
    ): Promise<ProcessResult> {
        const python = this.spawn(args, options);
        return this.monitor(python);
    }


    /** Internal method to set up and spawn a Python process. */
    private static spawn(
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
            env: environment
        });
    }


    /** Monitor process execution to collect results. */
    private static monitor(
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

            python.stdout.on(StreamEvents.Data, (data) => {
                console.log(`Process[${python.pid}]:stdout:${StreamEvents.Data}:`, String(data));
                result.output.push(data);
            });

            python.stderr.on(StreamEvents.Data, (data) => {
                console.log(`Process[${python.pid}]:stderr:${StreamEvents.Data}:`, String(data));
                result.errors.push(data);
            });

            python.on(ProcessEvents.Close, (code) => {
                console.log(`Process[${python.pid}] ${ProcessEvents.Close}`);
                result.processID = python.pid;
                result.exitCode = code;
                resolve(result);
            });
        });
    }


    private static help(): Promise<ProcessResult> {
        return Python.execute(['-h']);
    }


}
