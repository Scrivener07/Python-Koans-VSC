export class Manifest {
    /** The Python exercise file path. */
    public exercise: string;

    /** The Python unit test file path. */
    public test: string;

    /** The Python solution file path. */
    public solution: string;


    constructor(exercise: string = '', test: string = '', solution: string = '') {
        this.exercise = exercise;
        this.test = test;
        this.solution = solution;
    }


    public encode(): any {
        return {
            exercise: this.exercise,
            test: this.test,
            solution: this.solution
        };
    }


    public static decode(text: string): Manifest {
        const data: any = JSON.parse(text);
        if (!data) {
            throw new Error('Could not parse the koan manifest.');
        }
        else if (!data.exercise) {
            throw new Error('Missing required "exercise" specified in koan manifest');
        }
        else if (!data.test) {
            throw new Error('Missing required "test" specified in koan manifest');
        }
        else if (!data.solution) {
            throw new Error('Missing required "solution" specified in koan manifest');
        }
        const manifest: Manifest = new Manifest();
        manifest.exercise = data.exercise;
        manifest.test = data.test;
        manifest.solution = data.solution;
        return manifest;
    }


}


export class Challenge {
    // This is the unique identifier for the challenge.
    // For now it is the name of the Python function.
    public name: string;

    // This is the rendered function docstring (in markdown format).
    public instruction: string;

    // This is the challenge function code body.
    public code: string;


    constructor(name: string, instruction: string, code: string) {
        this.name = name;
        this.instruction = instruction;
        this.code = code;
    }


    /**
     * Gets a short description derived from the first 30 characters of the instruction text.
     */
    public description(): string {
        return `${this.instruction.substring(0, 30)}...`;
    }


}
