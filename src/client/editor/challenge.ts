interface Challenge {
    name: string;
    instruction: string;
    code: string;
}


/**
 * Create a challenge element from a template and data.
 */
export function createChallengeElement(challenge: Challenge): HTMLElement {
    const div = document.createElement('div');
    div.innerHTML = create(challenge);
    return div.firstElementChild as HTMLElement;
}



/**
 * Fallback method for string-based HTML when templates aren't loaded.
 */
function create(challenge: Challenge): string {
    return `
    <details class="challenge-container" data-challenge-id="${challenge.name}">
        ${header(challenge)}
        ${instructions(challenge)}
        ${code(challenge)}
        ${output(challenge)}
        ${results(challenge)}
    </details>`;
}



function header(challenge: Challenge): string {
    return `
    <summary>
        <div class="challenge-header">
            <div class="challenge-title">
                <h2>${challenge.name}</h2>
                <span class="challenge-status" data-status="pending">○</span>
            </div>

            <div class="challenge-controls">
                <button class="btn-secondary" onclick="toggleChallenge('${challenge.name}')">
                    <span class="icon">📖</span> View Instructions
                </button>
                <button class="btn-secondary" onclick="openCodeCell('${challenge.name}')">
                    <span class="icon">📝</span> Open Code Cell
                </button>
                <button class="btn-primary" onclick="runChallenge('${challenge.name}')">
                    <span class="icon">▶</span> Run Tests
                </button>
            </div>
        </div>
    </summary>
    `;
}


function instructions(challenge: Challenge): string {
    return `
    <div class="challenge-instructions" id="${challenge.name}_instructions">
        <div class="instructions-content">
            ${challenge.instruction}
        </div>
    </div>
    `;
}


function code(challenge: Challenge): string {
    return `
    <div class="challenge-code-section">

        <div class="code-header">
            <span class="code-label">Your Solution</span>
            <div class="code-actions">
                <button class="btn-icon" onclick="resetChallenge('${challenge.name}')" title="Reset to original">
                    <span class="icon">↺</span>
                </button>
                <button class="btn-icon" onclick="formatCode('${challenge.name}')" title="Format code">
                    <span class="icon">✨</span>
                </button>
            </div>
        </div>

        <div class="code-editor" id="${challenge.name}_editor">
            <textarea
                id="${challenge.name}_code"
                class="code-input"
                placeholder="# Write your solution here..."
                spellcheck="false"
            >${challenge.code}</textarea>
        </div>

    </div>
    `;
}


function output(challenge: Challenge): string {
    return `
    <div class="challenge-output-section">

        <div class="output-header">
            <span class="output-label">Standard Output</span>
        </div>

        <div class="output-content" id="${challenge.name}_stdout">
            <div class="output-placeholder">
                No output from your code yet...
            </div>
        </div>

    </div>
    `;
}


function results(challenge: Challenge): string {
    return `
    <div class="challenge-results-section">

        <div class="results-header">
            <span class="results-label">Test Results</span>
            <div class="results-actions">
                <button class="btn-icon" onclick="clearResults('${challenge.name}')" title="Clear results">
                    <span class="icon">🗑</span>
                </button>
            </div>
        </div>

        <div class="results-content" id="${challenge.name}_results">
            <div class="results-placeholder">
                Run tests to see results here...
            </div>
        </div>

    </div>
    `;
}
