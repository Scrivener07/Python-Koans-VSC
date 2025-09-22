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

export interface TestResult {
    success: boolean;
    message: string;
}

export interface WebviewMessage {
    command: string;
    member_id?: string;
    result?: TestResult;
    text?: string;
}
