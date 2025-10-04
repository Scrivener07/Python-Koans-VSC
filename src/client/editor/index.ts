import { vscode } from './services/vscode';
import { setupMonaco } from './services/monaco';
import { App } from './app';
import { WebCommands } from '../../shared/messaging';


class Program {
    private static app:App;

    public static main() {
        setupMonaco();
        Program.app = new App();
        Program.app.start();
        vscode.postMessage({ command: WebCommands.Data_Ready });
    }

}


// Entry Point
//--------------------------------------------------

Program.main();
