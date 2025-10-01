import * as vscode from 'vscode';
import { Python, Encoding } from '.';
import { TestSuite, TestStatus } from '../../shared/testing';

export class TestFramework {

    /** The test module name (assuming standard pattern). */
    private static readonly TEST_MODULE: string = 'exercise_test';

    /** The test class name (inherits `unittest.TestCase`). */
    private static readonly TEST_CASE: string = 'Testing';


    public static async execute(
        testerFileUri: vscode.Uri,
        member_id: string
    ): Promise<TestSuite> {
        // Get file system paths to use.
        const testerFilePath: string = testerFileUri.fsPath;
        const testerPath: string[] = TestFramework.path_split(testerFilePath);

        // Get the exercise test identity to use.
        const identity = TestFramework.getIdentity(testerFilePath, member_id);
        const fileDirectory: string = TestFramework.path_join(testerPath.slice(0, -1));
        let moduleName: string | undefined = testerPath.pop();
        if (!moduleName) {
            throw new Error("The file name was undefined.");
        }
        else {
            moduleName = moduleName.replace('.py', '');
        }

        // Execute the Python process.
        const process = Python.spawn([
            '-m', moduleName,
            "client",
            'identity', identity
        ], {
            cwd: fileDirectory,
            encoding: Encoding.UTF8,
            pythonPath: fileDirectory,
            pipeData: true
        });

        // Capture the test results.
        const [result, test_suite] = await Promise.all([
            Python.monitor(process),
            Python.pipe_json(process)
        ]);

        if (!result) {
            throw new Error("Failed to retrieve process result.");
        }
        else if (!test_suite) {
            throw new Error("Failed to retrieve test data.");
        }

        // NOTE: Make sure to convert Buffers to strings.
        const stdout: string[] = result.output.map(String);
        const stderr: string[] = result.errors.map(String);
        const suite: TestSuite = {
            identity: identity,
            status: TestFramework.exitToStatus(result.exitCode),
            message: test_suite.wasSuccessful ? "All tests passed" : "Some tests failed",
            summary: {
                testsRun: test_suite.summary.testsRun,
                passed: test_suite.summary.passed,
                failed: test_suite.summary.failed,
                errors: test_suite.summary.errors,
                duration: test_suite.summary.duration
            },
            cases: test_suite.cases.map((test_case: any) => ({
                member_id: member_id,
                identity: test_case.id,
                status: this.stringToStatus(test_case.status),
                message: test_case.message,
                duration: test_case.duration,
                assertions: []
            })),
            output: stdout
        };
        return suite;
    }


    private static exitToStatus(exitCode: number | null): TestStatus {
        if (exitCode === null) {
            return TestStatus.Unknown;
        } else if (exitCode === 0) {
            return TestStatus.Passed;
        } else if (exitCode === 1) {
            return TestStatus.Failed;
        } else if (exitCode >= 2) {
            return TestStatus.Error;
        } else {
            return TestStatus.Unknown;
        }
    }


    private static stringToStatus(status: string): TestStatus {
        switch (status.trim().toLowerCase()) {
            case 'passed':
                return TestStatus.Passed;
            case 'failed':
                return TestStatus.Failed;
            case 'error':
                return TestStatus.Error;
            case 'skipped':
                return TestStatus.Skipped;
            default:
                return TestStatus.Unknown;
        }
    }


    /**
     * Derive a test ID using the Python unit test convention.
     * @param pythonFilePath Path to the Python file containing the function.
     * @param memberId Name of the Python function to test (e.g., "challenge_01").
     * @returns A fully qualified unit test identity for the specific function.
     */
    private static getIdentity(pythonFilePath: string, memberId: string): string {
        // Get file path part information.
        const path: string[] = TestFramework.path_split(pythonFilePath);
        const fileName: string = path.pop() || TestFramework.TEST_MODULE;
        const moduleName: string = fileName.replace('.py', '');
        const testName: string = `test_${memberId}`;
        const identity = `${moduleName}.${TestFramework.TEST_CASE}.${testName}`;
        return identity;
    }


    private static path_split(filePath: string): string[] {
        return filePath.split(/[/\\]/);
    }


    private static path_join(path: string[]): string {
        return path.join("\\").toString();
    }


}
