import { vscode } from './services/vscode';
import { KoanChallengeElement } from './components/challenge';
import { WebCommands, WebMessage, InitializeCommand, CodeUpdateCommand, OutputUpdateCommand } from '../../shared/messaging';
import { DocumentMetaElement } from './components/file-details';
import { HTMLCodeEditor } from './components/code-editor';


export class App {
    constructor() {
        console.log('app::constructor');

        // Register custom HTML elements.
        KoanChallengeElement.define();
        DocumentMetaElement.define();
        HTMLCodeEditor.define();
        window.addEventListener('message', (event) => this.onMessage(event));
    }


    // Messaging
    //--------------------------------------------------

    private onMessage(event: MessageEvent<any>): void {
        if ('vscodeScheduleAsyncWork' in event.data) {
            // Filter out VS Code's internal scheduling messages.
            return;
        }

        const message = event.data as WebMessage;
        switch (message.command) {
            case WebCommands.Data_Initialize:
                this.onMessage_Initialize(message);
                break;
            case WebCommands.Output_Update:
                this.onMessage_OutputUpdate(message);
                break;
            default:
                console.warn('Unknown message from extension:', message);
        }
    }


    // Initialize
    //--------------------------------------------------

    // New function to populate the UI with data.
    private onMessage_Initialize(data: InitializeCommand): void {
        App.init_Welcome(document.body, data);

        // Populate the document details.
        App.init_MetaContainer(document.body, data);

        // Populate the challenges container.
        App.init_ChallengeContainer(document.body, data);

        // TODO: This might be too naive of a way to grab this text area.
        // Set up event listener for the textarea.
        const textarea = document.querySelector('textarea');
        if (textarea) {
            textarea.addEventListener('input', () => {
                vscode.postMessage({
                    command: WebCommands.Document_Update,
                    text: textarea.value
                });
            });
        }
        // this.setup_global_handlers();
        this.applyInputHandlers();
    }



    private static init_Welcome(body: HTMLElement, data: InitializeCommand) {
        const welcome: HTMLDivElement = document.createElement('div');
        body.appendChild(welcome);

        const header: HTMLHeadingElement = document.createElement('h1');
        header.textContent = 'Python Workbook';
        welcome.appendChild(header);

        const documentation: HTMLParagraphElement = document.createElement('p');
        documentation.setAttribute('id', 'module-docstring');
        documentation.innerHTML = 'The Python module <code>docstring</code> will be loaded in here.';
        welcome.appendChild(documentation);
    }


    private static init_ChallengeContainer(body: HTMLElement, data: InitializeCommand) {
        const section: HTMLDivElement = document.createElement('div');
        body.appendChild(section);

        const header: HTMLHeadingElement = document.createElement('h1');
        header.innerText = 'Challenges';
        section.appendChild(header);

        const challenges_container: HTMLDivElement = document.createElement('div');
        section.setAttribute('id', 'challenges-container');
        section.appendChild(challenges_container);

        // Add each challenge using the custom element.
        data.challenges.forEach(challenge => {
            const challengeElement: KoanChallengeElement = KoanChallengeElement.create();
            challengeElement.challenge = challenge;
            challenges_container.appendChild(challengeElement);
        });

    }


    private static init_MetaContainer(body: HTMLElement, data: InitializeCommand): void {
        const container: HTMLDivElement = document.createElement('div');
        body.appendChild(container);

        const title: HTMLHeadingElement = document.createElement('h1');
        title.innerText = 'Document Meta';
        container.appendChild(title);

        const items: HTMLDivElement = document.createElement('div');
        container.setAttribute('id', 'document-details');
        container.appendChild(items);

        const manifestElement: DocumentMetaElement = DocumentMetaElement.create();
        manifestElement.info = data.documentInfo;
        items.appendChild(manifestElement);

        const exerciseElement: DocumentMetaElement = DocumentMetaElement.create();
        exerciseElement.info = data.pythonDocumentInfo;
        items.appendChild(exerciseElement);
    }


    // Input
    //--------------------------------------------------

    /** Apply input handlers to every code text area. */
    private applyInputHandlers(): void {
        document.addEventListener('editor-change', (event: Event) => {
            const customEvent = event as CustomEvent;
            if (customEvent.detail) {
                const message = App.Code_Update_New(customEvent.detail.challengeId, customEvent.detail.code);
                this.handleCodeEditorChange(message);
            }
        });

    }


    // Input: Debounce
    //--------------------------------------------------

    /** The input debounce timer to use. */
    private updateTimeout: ReturnType<typeof setTimeout> | null = null;

    /** The input debouce handler to use. */
    private handleCodeEditorChange(message: CodeUpdateCommand): void {
        // Clear previous timeout.
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
        // Set new timeout (ms delay).
        const delay: number = 1000;
        this.updateTimeout = setTimeout(() => {
            vscode.postMessage(message);
        }, delay);
    }



    // Messaging: Code Update
    //--------------------------------------------------

    private static Code_Update_Send(message: CodeUpdateCommand): void {
        vscode.postMessage(message);
    }

    private static Code_Update_New(challengeId: string, newCode: string): CodeUpdateCommand {
        return {
            command: WebCommands.Code_Update,
            member_id: challengeId,
            code: newCode
        };
    }



    // Command Response Handlers
    //--------------------------------------------------

    private onMessage_OutputUpdate(message: OutputUpdateCommand): void {
        const member_id: string = message.suite.cases[0].member_id;
        const challengeElement: KoanChallengeElement | null = App.getChallenge(member_id);
        if (challengeElement) {
            challengeElement.update(message.suite);
        }
    }


    private static getChallenge(member_id: string): KoanChallengeElement | null {
        return document.querySelector(`koan-challenge[data-challenge-id="${member_id}"]`) as KoanChallengeElement;
    }


}
