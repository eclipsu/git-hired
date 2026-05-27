import { languageColor } from '../../utils/languageColors';

export default function LanguagePill({ lang }: { lang: string }) {
  const color = languageColor(lang);
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2 py-0.5 rounded-sm border border-border bg-secondary">
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      <span style={{ color }}>{lang}</span>
    </span>
  );
}
