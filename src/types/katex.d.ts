interface KatexStatic {
  renderToString(
    tex: string,
    options?: { displayMode?: boolean; throwOnError?: boolean; trust?: boolean }
  ): string;
}

interface Window {
  katex?: KatexStatic;
}
