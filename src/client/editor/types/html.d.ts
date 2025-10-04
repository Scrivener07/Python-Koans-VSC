// https://developer.mozilla.org/en-US/docs/Web/API/Web_components
// https://github.com/microsoft/TypeScript/blob/main/src/lib/dom.generated.d.ts

interface HTMLElement {
  /** Called when element is connected to the DOM. */
  connectedCallback?(): void;

  /** Called when element is disconnected from the DOM. */
  disconnectedCallback?(): void;

  /** Called when element is moved to a new document. */
  adoptedCallback?(): void;

  /** Called when an observed attribute has been added, removed, updated, or replaced. */
  attributeChangedCallback?(name: string, oldValue: string, newValue: string): void;
}
