import * as vscode from 'vscode';
import { KoanLog } from "../log";
import { ChallengeData } from "../koan/data";
import { ProcessResult, Python } from './python';

export class Code {
    public static readonly PYTHON_FILE: string = 'code.py';


    public static async getChallenges(scriptPath: vscode.Uri, pythonFileUri: vscode.Uri): Promise<ChallengeData[]> {
        // Execute the Python tool to parse the file.
        let processResult: ProcessResult;
        try {
            processResult = await Python.execute([scriptPath.fsPath, pythonFileUri.fsPath]);
        }
        catch (error) {
            KoanLog.error([Code, Code.getChallenges], 'Failed to parse Python file:', error);
            return [];
        }

        if (!processResult.output) {
            KoanLog.warn([Code, Code.getChallenges], 'The process output was empty.');
            return [];
        }

        // Expect the standard output to have a single item.
        const result: string = processResult.output[0];

        let data: any;
        try {
            data = JSON.parse(result);
        } catch (error) {
            // TODO: this is a bad way to read the errors array. This could throw even more exceptions.
            KoanLog.error([Code, Code.getChallenges], 'Failed to parse JSON from Python output:', error, String(processResult.errors[0]));
            return [];
        }

        if (!data || !data.challenges) {
            throw new Error('Invalid data format returned from Python parser.');
        }

        try {
            const challenges: ChallengeData[] = data.challenges.map(
                (item: any) => new ChallengeData(item.name, item.instruction, item.code)
            );
            return challenges;

        } catch (error) {
            KoanLog.error([Code, Code.getChallenges], 'Failed to create Challenge data:', error);
            return [];
        }
    }



}
