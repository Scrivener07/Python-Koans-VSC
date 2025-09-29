import { TestSuite as TestSuite, TestCase, TestAssertion, TestStatus } from './testing';


// Union type of all possible commands
export type WebMessage =
    | InitializeCommand
    | CodeRunCommand
    | OutputUpdateCommand;


/**
 * Defines the messaging protocol between the extension and the webview editor.
 */
export enum WebCommands {
    Data_Initialize = 'initialize',
    Document_Update = 'update',
    Code_OpenVirtual = 'code-open-virtual',
    Code_RunTests = 'code-run',
    Code_Reset = 'code-reset',
    Code_Format = 'code-format',
    Code_Update = 'code-update',
    Output_Update = 'output-update',
    Output_Clear = 'output-clear'
}


/**
 * Message structure for communication between the extension and the webview editor.
 */
export interface WebCommand {
    command: WebCommands;
}


export interface InitializeCommand extends WebCommand {
    command: WebCommands.Data_Initialize;
    documentInfo: DocumentInfo;
    pythonDocumentInfo: DocumentInfo;
    challenges: Challenge[];
}


export interface CodeRunCommand extends WebCommand {
    command: WebCommands.Code_RunTests;
    member_id: string;
}


export interface OutputUpdateCommand extends WebCommand {
    command: WebCommands.Output_Update;
    member_id: string;
    suite: TestSuite;
}


export interface DocumentInfo {
    fileName: string;
    uri: string;
    language: string;
    lineCount: number;
    encoding: string;
    content: string;
}


export interface Challenge {
    name: string;
    instruction: string;
    code: string;
}
