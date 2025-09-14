// We've set up this sample using CSS modules, which lets you import class
// names into JavaScript: https://github.com/css-modules/css-modules
// You can configure or change this in the webpack.config.js file.
import * as style from './style.css';
import type { RendererContext } from 'vscode-notebook-renderer';

interface IRenderInfo {
  container: HTMLElement;
  mime: string;
  value: any;
  context: RendererContext<unknown>;
}

interface TestResult {
  result: 'pass' | 'fail' | 'error' | 'pending';
  message?: string;
  details?: string;
  assertions?: Array<{
    passed: boolean;
    message: string;
  }>;
}

// This function is called to render your contents.
export function render({ container, mime, value }: IRenderInfo) {
  // Clear container
  container.innerHTML = '';

  // Render test results in a nice way
  const result = value as TestResult;

  const resultContainer = document.createElement('div');
  resultContainer.classList.add('koan-result');

  // Header with result status
  const header = document.createElement('div');
  header.classList.add('result-header', result.result);
  header.textContent = getResultHeader(result);
  resultContainer.appendChild(header);

  // Message if any
  if (result.message) {
    const message = document.createElement('div');
    message.classList.add('result-message');
    message.textContent = result.message;
    resultContainer.appendChild(message);
  }

  // Details if any
  if (result.details) {
    const details = document.createElement('pre');
    details.classList.add('result-details');
    details.textContent = result.details;
    resultContainer.appendChild(details);
  }

  // Assertions if any
  if (result.assertions && result.assertions.length > 0) {
    const assertions = document.createElement('ul');
    assertions.classList.add('assertions-list');

    for (const assertion of result.assertions) {
      const item = document.createElement('li');
      item.classList.add(assertion.passed ? 'passed' : 'failed');
      item.textContent = assertion.message;
      assertions.appendChild(item);
    }

    resultContainer.appendChild(assertions);
  }

  container.appendChild(resultContainer);
}

function getResultHeader(result: TestResult): string {
  switch (result.result) {
    case 'pass':
      return '✓ Test Passed';
    case 'fail':
      return '✗ Test Failed';
    case 'error':
      return '⚠ Error';
    case 'pending':
      return '⋯ Pending';
    default:
      return 'Unknown Status';
  }
}

if (module.hot) {
  module.hot.addDisposeHandler(() => {
    // In development, this will be called before the renderer is reloaded.
    // You can use this to clean up or stash any state.
  });
}
