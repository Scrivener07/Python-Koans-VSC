import * as vscode from 'vscode';
import { Python, Encoding, ProcessResult } from '.';
import { TestFramework } from './testing';

export class Launcher {


    public static async execute(
        exerciseFileUri: vscode.Uri,
        testFileUri: vscode.Uri,
        member_id: string
    ): Promise<ProcessResult> {
        // Get file system paths to use.
        const exerciseFilePath: string = exerciseFileUri.fsPath;
        const testFilePath: string = testFileUri.fsPath;

        // Get the exercise test identity to use.
        let identity = TestFramework.getIdentity(exerciseFilePath, member_id);

        // TODO: This is a hack to shift the Python directory location.
        identity = identity.replace("C01.", "");

        // Get file path information.
        const path: string[] = TestFramework.split_path(exerciseFilePath);

        // Get file directory for module.
        const fileDirectory: string = path.slice(0, -1).join("\\").toString();

        // Get parent file directory for module.
        const parentFileDirectory: string = path.slice(0, -2).join("\\").toString();

        // Get the file name which is the last element.
        const fileName: string | undefined = path.pop();
        if (!fileName) {
            throw new Error("The file name was undefined.");
        }

        // Execute the Python process.
        // Set working directory to the file directory.
        // NOTE: Excluding `identity` parameter runs all discovered unit-tests.
        return Python.execute([
            '-m', 'exercise_test',
            'identity', identity
        ], {
            cwd: fileDirectory,
            encoding: Encoding.UTF8,
            pythonPath: fileDirectory
        });
    }


}
