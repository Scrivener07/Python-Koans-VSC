export interface TestSuite {
    /** Full test path ("exercise_test.Testing.test_challenge_01"). */
    identity: string;

    /** The overall suite status. */
    status: TestStatus;

    /** Human-readable result message. */
    message: string;

    /** The test suite summary information. */
    summary: {
        /** Total tests executed. */
        testsRun: number;

        /** Tests that passed. */
        passed: number;

        /** Tests that failed. */
        failed: number;

        /** Tests with errors. */
        errors: number;

        /** Total execution time in milliseconds. */
        duration: number;
    };

    /** The details for individual test cases.  */
    cases: TestCase[];

    /** The standard output. */
    output: string[];
}


/** Represents a an indivisual test case. */
export interface TestCase {
    /** Method name ("challenge_01"). */
    member_id: string;

    /** Test name ("test_challenge_01"). */
    identity: string;

    /** Result status (passed/failed/error). */
    status: TestStatus;

    /** Error message or success message. */
    message?: string;

    /** Time taken for this specific test. */
    duration?: number;

    /** Individual assertions if available. */
    assertions?: TestAssertion[];
}


/** Represents an assertions associated with a test case. */
export interface TestAssertion {
    passed: boolean;
    message: string;
    expected?: any;
    actual?: any;

    /** File and line number where assertion failed. */
    location?: string;
}


export enum TestStatus {
    /** All tests passed. */
    Passed = 'passed',

    /** Tests ran but some failed. */
    Failed = 'failed',

    /** System error in test execution. */
    Error = 'error',

    Pending = 'pending',

    /** Test was skipped. */
    Skipped = 'skipped'
}


export enum StatusIcon {
    Passed = '✅',
    Failed = '❌',
    Error = '💥'
}


enum StatusSymbol {
    Passed = '✓',
    Failed = '✗',
    Error = '⚠'
}
