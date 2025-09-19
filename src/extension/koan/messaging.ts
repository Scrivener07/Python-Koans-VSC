/**
 * Defines the messaging protocol between the extension and the webview editor.
 */
export enum EditorCommands {
    Data_Initialize = 'initialize',
    Document_UpdateText = 'update',
    Code_RunTests = 'runTests',
    Code_Reset = 'resetChallenge',
    Code_OpenVirtual = 'openCodeCell',
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
