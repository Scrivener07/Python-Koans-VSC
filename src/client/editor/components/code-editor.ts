import * as monaco from 'monaco-editor';

export class HTMLCodeEditor extends HTMLElement {
    public static readonly HTML_TAG: string = 'code-editor-html';

    /** The Monaco code editor element. */
    private editor: monaco.editor.IStandaloneCodeEditor | undefined;

    /**The Monaco disposables to manage. */
    private disposables: monaco.IDisposable[];

    /** A cached copy of the code text value to use. */
    private _value: string;

    /** Gets or sets the editor text to use. */
    get value(): string {
        return this.editor?.getValue() || this._value;
    }
    set value(code: string) {
        this._value = code;
        this.editor?.setValue(code);
    }


    // Object
    //--------------------------------------------------

    constructor() {
        super();
        this._value = 'UNDEFINED';
        this.disposables = [];
    }


    // HTML
    //--------------------------------------------------

    public static define(): void {
        customElements.define(HTMLCodeEditor.HTML_TAG, HTMLCodeEditor);
    }


    public static create(code: string): HTMLCodeEditor {
        const element: HTMLCodeEditor = document.createElement(HTMLCodeEditor.HTML_TAG) as HTMLCodeEditor;
        element._value = code;
        return element;
    }


    // DOM
    //--------------------------------------------------

    public override connectedCallback(): void {
        const codeElement: HTMLPreElement = document.createElement('pre');
        codeElement.className = 'code-editor';
        this.appendChild(codeElement);

        // Get VS Code's current theme information.
        const isDarkTheme: boolean = VSC.themeIsDark();

        // Create Monaco editor.
        this.editor = monaco.editor.create(codeElement, {
            value: this._value || '',
            language: 'python',
            theme: isDarkTheme ? 'vs-dark' : 'vs',
            automaticLayout: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            scrollbar: {
                vertical: 'auto',
                horizontal: 'auto'
            },
            lineHeight: 18,
            padding: { top: 8, bottom: 8 },
            fontSize: 13,
            renderLineHighlight: 'all',
            tabSize: 4,
            insertSpaces: true,
            fontFamily: 'var(--vscode-editor-font-family)',
            contextmenu: false
        });

        this.disposables.push(
            this.editor.onDidChangeModelContent((e) => this.onDidChangeModelContent(e))
        );
    }


    public override disconnectedCallback(): void {
        if (this.editor) {
            this.editor.dispose();
            this.editor = undefined;
        }
        this.disposables.forEach(disposable => disposable.dispose());
        this.disposables = [];
    }


    // Element
    //--------------------------------------------------

    public override focus(): void {
        if (this.editor) {
            this.editor.focus();
        }
    }


    // Monaco
    //--------------------------------------------------

    private onDidChangeModelContent(e: monaco.editor.IModelContentChangedEvent): void {
        if (!this.editor) { return; }
        const contentChanged = new CustomEvent(CodeEditorEvents.CONTENT_CHANGED, {
            bubbles: true,
            detail: {
                event: e,
                value: this.editor.getValue()
            }
        });
        this.dispatchEvent(contentChanged);
    }


    // Monaco: Actions
    //--------------------------------------------------

    public formatDocument(): void {
        if (!this.editor) { return; }
        this.editor.getAction('editor.action.formatDocument')?.run();
    }


}

class VSC {

    public static themeIsDark(): boolean {
        return document.body.classList.contains('vscode-dark');
    }

}

export class CodeEditorEvents {
    public static readonly CONTENT_CHANGED: string = 'monaco-content-changed';
}
