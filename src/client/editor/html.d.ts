// https://developer.mozilla.org/en-US/docs/Web/API/Web_components
// https://github.com/microsoft/TypeScript/blob/main/src/lib/dom.generated.d.ts

interface HTMLElement {
  connectedCallback?(): void;
  disconnectedCallback?(): void;
  adoptedCallback?(): void;
  attributeChangedCallback?(name: string, oldValue: string, newValue: string): void;
}
