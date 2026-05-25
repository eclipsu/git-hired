import { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { StreamLanguage } from '@codemirror/language';
import { stex } from '@codemirror/legacy-modes/mode/stex';

const latexLanguage = StreamLanguage.define(stex);

interface LatexEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function LatexEditor({ value, onChange, className = '' }: LatexEditorProps) {
  const extensions = useMemo(() => [latexLanguage], []);

  return (
    <CodeMirror
      value={value}
      height="100%"
      extensions={extensions}
      onChange={onChange}
      className={`h-full overflow-hidden rounded-xl border border-gray-700 text-sm ${className}`}
      theme="dark"
      basicSetup={{
        lineNumbers: true,
        foldGutter: false,
        highlightActiveLine: true,
      }}
    />
  );
}
