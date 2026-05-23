const LANG_COLORS: Record<string, string> = {
  JavaScript: '#b8a84a',
  TypeScript: '#5a7a9a',
  Python: '#5a7a6a',
  Java: '#8a7a6a',
  Go: '#6a8a9a',
  Rust: '#8a6a5a',
  Ruby: '#9a5a5a',
  PHP: '#7a7a9a',
  'C++': '#6a7a8a',
  C: '#7a8a9a',
  Swift: '#9a7a6a',
  Kotlin: '#7a6a9a',
  Shell: '#6a6a6a',
  HTML: '#9a6a5a',
  CSS: '#6a7a9a',
  Vue: '#6a8a7a',
  Dart: '#6a8a9a',
};

export function languageColor(language: string | null): string {
  if (!language) return '#94a3b8';
  return LANG_COLORS[language] ?? '#94a3b8';
}
