/**
 * Defines the messaging protocol between the extension and the webview editor.
 */
export enum EditorCommands {
    Data_Initialize = 'initialize',
    Document_UpdateText = 'update',
    Code_OpenVirtual = 'code-open-virtual',
    Code_RunTests = 'code-run',
    Code_Reset = 'code-reset',
    Code_Format = 'code-format',
    Code_Update = 'code-update',
    Output_Update = 'output-update',
    Output_Clear = 'output-clear'
}


/**
 * Represents the result of a test run.
 */
export interface TestResult {
    success: boolean;
    message: string;
}


/**
 * Message structure for communication between the extension and the webview editor.
 */
export interface WebviewMessage {
    command: EditorCommands;
    member_id?: string;
    result?: TestResult;
    text?: string;
    code?: string;
}


/**
 * Message structure for communication between the extension and the webview editor.
 */
export interface DocumentInfo {
    fileName: string;
    uri: string;
    language: string;
    lineCount: number;
    encoding: string;
    content: string;
}
