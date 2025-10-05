declare global {
    interface Window {
        /** Stores any custom configurations used for Monaco editor. */
        MonacoConfiguration?: IMonacoConfiguration;

        /** Required, Monaco searches for `MonacoEnvironment` to provide a worker factory implementation. */
        MonacoEnvironment?: IMonacoEnvironment;
    }
}


export function monacoSetup(): void {
    self.MonacoConfiguration = setupConfiguration();
    self.MonacoEnvironment = setupEnvironment(self.MonacoConfiguration.basePath);
}


// Monaco Configuration
//--------------------------------------------------

const MONACO_DATA_BASE_PATH: string = 'monaco-worker-base-path';

interface IMonacoConfiguration {
    basePath: string;
}


function setupConfiguration(): IMonacoConfiguration {
    // Get worker path from data element.
    const dataElement = document.getElementById(MONACO_DATA_BASE_PATH);
    const workerBasePath = dataElement?.getAttribute('value');
    if (!workerBasePath) {
        throw new Error("The provided worker base path cannot be undefined.");
    }
    return {
        basePath: workerBasePath
    };
}


// Monaco Environment
//--------------------------------------------------

interface IMonacoEnvironment {
    /** Provides a web worker factory implementation.
     * In this case, creates a blob with worker code for a same-origin worker to avoid cross-origin complexities. */
    getWorker(moduleId: string, label: string): Worker;
}


// Method for loading Monaco workers.
function setupEnvironment(workerBasePath: string): IMonacoEnvironment {
    return {
        getWorker: function (moduleId: string, label: string): Worker {
            // Create a Blob containing a script that imports the worker.
            const workerBlob: Blob = new Blob([
                `importScripts('${workerBasePath}/${label === 'python' ? 'python.worker.js' : 'editor.worker.js'}');`
            ], {
                type: 'application/javascript'
            });

            // Create a worker from the Blob URL (same origin).
            return new Worker(URL.createObjectURL(workerBlob), {
                name: label
            });
        }
    };
}
