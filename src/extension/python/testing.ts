import * as vscode from 'vscode';
import { Python, Encoding, ProcessResult } from '.';
import { TestSuite as TestSuite, TestCase, TestAssertion, TestStatus } from '../../shared/testing';


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
        const processResult: ProcessResult = await Python.execute([
            '-m', moduleName,
            "client",
            'identity', identity
        ], {
            cwd: fileDirectory,
            encoding: Encoding.UTF8,
            pythonPath: fileDirectory
        });

        // NOTE: Make sure to convert Buffers to strings.
        const stdout: string[] = processResult.output.map(String);
        const stderr: string[] = processResult.errors.map(String);


        // Populate the test case assertions.
        const case_assertions: TestAssertion[] = [];
        for (let index = 0; index < stderr.length; index++) {
            const element: string = stderr[index];
            const assertion: TestAssertion = {
                passed: false,
                message: element,
                expected: undefined,
                actual: undefined,
                location: undefined
            };
            case_assertions.push(assertion);
        }

        const testCase: TestCase = {
            member_id: member_id,
            identity: identity,
            status: TestStatus.Skipped,
            message: 'CASE_MESSAGE_GOES_HERE',
            duration: 0,
            assertions: case_assertions
        };


        const summary = this.parseDetails(stderr);
        const suite: TestSuite = {
            identity: identity,
            status: TestFramework.toStatus(processResult.exitCode),
            message: 'SUITE_MESSAGE_GOES_HERE',
            summary: {
                testsRun: summary.testsRun,
                passed: summary.passed,
                failed: summary.failed,
                errors: summary.errors,
                duration: 0
            },
            cases: [
                testCase
            ],
            output: stdout
        };

        console.log(JSON.stringify(suite));
        return suite;
    }


    private static toStatus(exitCode: number | null): TestStatus {
        switch (exitCode) {
            case 0:
                return TestStatus.Passed;
            case 1:
                return TestStatus.Failed;
            default:
                return TestStatus.Error;
        }
    }


    private static parseDetails(stderr: string[]): { testsRun: number, passed: number, failed: number, errors: number } {
        let testsRun: number = 0;
        let failed: number = 0;
        let errors: number = 0;

        // Parse the unittest output format.
        for (const line of stderr) {
            // "Ran X tests in Y.ZZZs"
            const runMatch: RegExpMatchArray | null = line.match(/Ran (\d+) test/);
            if (runMatch) {
                testsRun = parseInt(runMatch[1], 10);
            }

            // "FAILED (failures=X, errors=Y)"
            if (line.includes('FAILED')) {
                const failMatch: RegExpMatchArray | null = line.match(/failures=(\d+)/);
                const errorMatch: RegExpMatchArray | null = line.match(/errors=(\d+)/);

                if (failMatch) {
                    failed = parseInt(failMatch[1], 10);
                }
                if (errorMatch) {
                    errors = parseInt(errorMatch[1], 10);
                }
            }
        }

        // Calculate passed tests.
        const passed: number = testsRun - failed - errors;
        return { testsRun, passed, failed, errors };
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
