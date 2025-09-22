/**
 * Defines the messaging protocol between the extension and the webview editor.
 */
export enum EditorCommands {
    Data_Initialize = 'initialize',
    Document_UpdateText = 'update',
    Code_OpenVirtual = 'openCodeCell',
    Code_RunTests = 'runTests',
    Code_Reset = 'resetChallenge',
    Code_Format = 'formatCode',
    Output_Update = 'updateChallengeOutput',
    Output_Clear = 'clearOutput'
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


// Message Types
//--------------------------------------------------
// Define message types.

export interface DocumentInfo {
    fileName: string;
    uri: string;
    lineCount: number;
    content: string;
    language: string;
}
