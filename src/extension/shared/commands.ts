export enum EditorCommands {
    Document_UpdateText = 'update',
    Code_RunTests = 'runTests',
    Code_Reset = 'resetChallenge',
    Code_OpenVirtual = 'openCodeCell',
    Code_Format = 'formatCode',
    Output_Update = 'updateChallengeOutput',
    Output_Clear = 'clearOutput'
}

export interface TestResult {
    success: boolean;
    message: string;
}

export interface WebviewMessage {
    command: EditorCommands;
    member_id?: string;
    result?: TestResult;
    text?: string;
    code?: string;
}
