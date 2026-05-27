const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178C6',
  Python: '#3572A5',
  Go: '#00ADD8',
  Rust: '#DEA584',
  JavaScript: '#F1E05A',
  Ruby: '#CC342D',
  Java: '#B07219',
  'C++': '#F34B7D',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  PHP: '#777BB4',
  Shell: '#89E051',
  HTML: '#E34C26',
  CSS: '#563D7C',
  Vue: '#41B883',
  Dart: '#00B4AB',
  C: '#555555',
};

export function languageColor(language: string | null): string {
  if (!language) return '#8B949E';
  return LANG_COLORS[language] ?? '#8B949E';
}
