import { DocumentInfo } from "../../../shared/messaging";

export class DocumentMetaElement extends HTMLElement {
    public static readonly HTML_TAG: string = 'koan-document-meta';


    private _info: DocumentInfo;
    get info(): DocumentInfo { return this._info; }
    set info(value: DocumentInfo) {
        this._info = value;
        if (this.isConnected) {
            this.innerHTML = this.createTemplate();
        }
    }


    constructor() {
        super();
        this._info = {
            uri: 'UNDEFINED',
            fileName: 'UNDEFINED',
            encoding: 'UNDEFINED',
            language: 'UNDEFINED',
            lineCount: 0,
            content: 'UNDEFINED'
        };
    }


    public static define(): void {
        customElements.define(DocumentMetaElement.HTML_TAG, DocumentMetaElement);
    }


    public static create(): DocumentMetaElement {
        return document.createElement(DocumentMetaElement.HTML_TAG) as DocumentMetaElement;
    }


    public override connectedCallback(): void {
        this.setAttribute('document-meta-id', this._info.uri);
        this.className = 'document-container';
        this.innerHTML = this.createTemplate();
    }


    private createTemplate(): string {
        return `
        <details>
            <summary>Document</summary>
            <ul>
                <li><b>File:</b> ${this.info.fileName}</li>
                <li><b>URI:</b> ${this.info.uri}</li>
                <li><b>Encoding:</b> ${this.info.encoding}</li>
                <li><b>Language:</b> ${this.info.language}</li>
                <li><b>Lines:</b> ${this.info.lineCount}</li>
                <li><b>Characters:</b> ${this.info.content.length}</li>
            </ul>
        </details>
        `;
    }


}
