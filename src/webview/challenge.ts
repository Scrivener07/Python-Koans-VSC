// Create HTML for a challenge.
export function createChallengeHtml(challenge: any): string {
    return `
    <div class="challenge-container" data-challenge-id="${challenge.name}">

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
                <button class="btn-primary" onclick="runChallenge('${challenge.name}')">
                    <span class="icon">▶</span> Run Tests
                </button>
                <button class="btn-secondary" onclick="openCodeCell('${challenge.name}')">
                    <span class="icon">📝</span> Open Code Cell
                </button>
            </div>
        </div>

        <!-- Instructions Panel (Collapsible) -->
        <div class="challenge-instructions" id="${challenge.name}_instructions">
            <div class="instructions-content">
                ${challenge.instruction}
            </div>
        </div>

        <!-- Code Editor Section -->
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

        <!-- Output Section -->
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
    </div>`;
}
