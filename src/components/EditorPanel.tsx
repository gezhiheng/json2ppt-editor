import Editor from "@monaco-editor/react";

const editorOptions = {
  minimap: { enabled: false },
  fontSize: 12,
  lineHeight: 20,
  wordWrap: "off",
  scrollBeyondLastLine: false,
  automaticLayout: true
} as const;

type EditorPanelProps = {
  value: string;
  onChange: (nextValue: string) => void;
};

export function EditorPanel({ value, onChange }: EditorPanelProps): JSX.Element {
  return (
    <section className="flex min-h-0 flex-col rounded-xl border border-ink-200/60 bg-[#1f1b16] p-5 shadow-sharp">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-white">JSON Editor</h2>
        <span className="text-xs uppercase tracking-[0.2em] text-ink-200">Realtime</span>
      </div>
      <div className="mt-4 h-full overflow-hidden border border-white/10">
        <Editor
          height="100%"
          defaultLanguage="json"
          theme="vs-dark"
          value={value}
          onChange={(next) => onChange(next ?? "")}
          options={editorOptions}
        />
      </div>
    </section>
  );
}
