// Extend the Window interface to include MonacoEnvironment.
declare global {
  interface Window {
    MonacoEnvironment?: any;
  }
}

// Method for loading Monaco workers.
export function setupMonacoWorkers(basePath: string): void {
  self.MonacoEnvironment = {
    getWorker: function (moduleId: string, label: string) {
      // Create a Blob containing a script that imports the worker.
      const workerBlob = new Blob([
        `importScripts('${basePath}/${label === 'python' ? 'python.worker.js' : 'editor.worker.js'}');`
      ], { type: 'application/javascript' });

      // Create a worker from the Blob URL (same origin).
      return new Worker(URL.createObjectURL(workerBlob), {
        name: label
      });
    }
  };
}
