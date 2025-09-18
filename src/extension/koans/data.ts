export class KoanData {

    public readonly cells: Map<string, Challenge>;

    private static readonly DEFAULT_INSTRUCTION: string = 'This is a description of the challenge.';
    private static readonly DEFAULT_CODE: string = '# Your code here\nprint(\"Hello World!\")\npass';


    constructor() {
        this.cells = new Map<string, Challenge>();

        // Initialize with some example challenges.
        const challenges = this.data_default();
        for (const challenge of challenges) {
            this.cells.set(challenge.name, challenge);
        }
    }


    private data_default(): Challenge[] {
        return [
            new Challenge('challenge_01', KoanData.DEFAULT_INSTRUCTION, KoanData.DEFAULT_CODE),
            new Challenge('challenge_02', KoanData.DEFAULT_INSTRUCTION, KoanData.DEFAULT_CODE),
            new Challenge('challenge_03', KoanData.DEFAULT_INSTRUCTION, KoanData.DEFAULT_CODE),
            new Challenge('challenge_04', KoanData.DEFAULT_INSTRUCTION, KoanData.DEFAULT_CODE),
            new Challenge('challenge_05', KoanData.DEFAULT_INSTRUCTION, KoanData.DEFAULT_CODE)
        ];
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
