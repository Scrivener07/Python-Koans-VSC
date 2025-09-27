import * as vscode from 'vscode';
import { Python, PythonOptions, Encoding, ProcessResult } from '.';
import { TestFramework } from './testing';

/** Python's unittest Writes to stderr by Design
 * The Python unittest framework deliberately writes its output to stderr rather than stdout, even when tests pass.
 *
 * This is by design for two key reasons:
 * - Separation of Concerns: stdout is reserved for the actual program output, while stderr is used for meta-information about the testing process
 * - Pipeline Compatibility: Makes it easier to pipe program output while still seeing test results
 */

// These are the identities when starting the `exercise_test.py` as a *program* file.
// __main__.Testing.test_challenge_01
// __main__.Testing.test_challenge_02
// __main__.Testing.test_challenge_03
// __main__.Testing.test_challenge_04
// __main__.Testing.test_challenge_05

// These are the identites when started as a module.
// exercise_test.Testing.test_challenge_01
// exercise_test.Testing.test_challenge_02
// exercise_test.Testing.test_challenge_03

export class Launcher {


    public static async launch(
        exerciseFileUri: vscode.Uri,
        testFileUri: vscode.Uri,
        member_id: string
    ): Promise<ProcessResult> {
        // Get file system paths to use.
        const exerciseFilePath: string = exerciseFileUri.fsPath;
        const testFilePath: string = testFileUri.fsPath;

        // Get the exercise test identity to use.
        let identity = TestFramework.getIdentity(exerciseFilePath, member_id);

        // TODO: This is a hack to shift the Python directory location. (didnt work)
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
