export class TestFramework {

    /** The test module name (assuming standard pattern). */
    private static readonly TEST_MODULE: string = 'exercise_test';

    /** The test class name (inherits `unittest.TestCase`). */
    private static readonly TEST_CASE: string = 'Testing';


    /**
     * Derive a test ID using the Python unit test convention.
     * @param pythonFilePath Path to the Python file containing the function
     * @param memberId Name of the Python function to test (e.g., "challenge_01")
     * @returns A fully qualified unit test identity for the specific function.
     */
    public static getIdentity(pythonFilePath: string, memberId: string): string {
        // Extract directory from path.
        const pathParts = pythonFilePath.split(/[\/\\]/);
        const fileName = pathParts.pop() || ''; // TODO: Use filename as Python module.
        const directory = pathParts.pop() || '';

        const testName: string = `test_${memberId}`;
        const identity = `${directory}.${TestFramework.TEST_MODULE}.${TestFramework.TEST_CASE}.${testName}`;
        return identity;
    }


    // Unused alternative.
    public static get_ID(pythonFilePath: string, memberId: string) {
        // Get the directory path and file name from the Python file path
        const lastSlashIndex = pythonFilePath.lastIndexOf('/');
        const lastBackslashIndex = pythonFilePath.lastIndexOf('\\');
        const pathSeparatorIndex = Math.max(lastSlashIndex, lastBackslashIndex);

        const directory = pythonFilePath.substring(0, pathSeparatorIndex);
        const fileName = pythonFilePath.substring(pathSeparatorIndex + 1);
        const moduleName = fileName.replace('.py', '');

        // Create the fully qualified test identity for the specific function.
        const testName: string = `test_${memberId}`;
        const identity = `${TestFramework.TEST_MODULE}.${TestFramework.TEST_CASE}.${testName}`;
        return identity;
    }


    public static split_path(filePath: string): string[] {
        return filePath.split(/[/\\]/);
    }


}
