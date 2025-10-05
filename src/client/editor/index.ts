import { vscode } from './services/vscode';
import { monacoSetup } from './services/monaco';
import { App } from './app';
import { WebCommands } from '../../shared/messaging';

class Program {
    private static app: App;


    public static main() {
        monacoSetup();
        Program.app = new App();
        vscode.postMessage({ command: WebCommands.Data_Ready });
    }


}


// Entry Point
//--------------------------------------------------

Program.main();
