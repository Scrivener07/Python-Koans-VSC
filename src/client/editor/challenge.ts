export interface Challenge {
    name: string;
    instruction: string;
    code: string;
}


/**
 * Create a challenge element from a template and data.
 */
export function createChallengeElement(challenge: Challenge): HTMLElement {
    const div = document.createElement('div');
    div.innerHTML = createFallbackChallengeHtml(challenge);
    return div.firstElementChild as HTMLElement;
}



/**
 * Fallback method for string-based HTML when templates aren't loaded.
 */
export function createFallbackChallengeHtml(challenge: Challenge): string {
    return `
    <details class="challenge-container" data-challenge-id="${challenge.name}">
        <summary>
            <!-- Challenge Header -->
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

        <!-- Rest of your existing HTML -->
        <div class="challenge-instructions" id="${challenge.name}_instructions">
            <div class="instructions-content">
                ${challenge.instruction}
            </div>
        </div>

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

        <div class="challenge-output-section">
            <div class="output-header">
                <span class="output-label">Test Results</span>
                <div class="output-actions">
                    <button class="btn-icon" onclick="clearOutput('${challenge.name}')" title="Clear output">
                        <span class="icon">🗑</span>
                    </button>
                </div>
            </div>
            <div class="output-content" id="${challenge.name}_output">
                <div class="output-placeholder">
                    Run tests to see results here...
                </div>
            </div>
        </div>
    </details>`;
}
