import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { cn } from "../lib/utils";
import type { Deck } from "../types/ppt";

type TemplateEntry = {
  id: string;
  name: string;
};

type HeaderBarProps = {
  deck: Deck | null;
  templates: TemplateEntry[];
  selectedTemplateId: string;
  isExporting: boolean;
  jsonError: string;
  onTemplateChange: (templateId: string) => void;
  onResetTemplate: () => void;
  onExportJson: () => void;
  onExportPptx: () => void;
};

function getStatusText(deck: Deck | null, jsonError: string): string {
  if (jsonError) {
    return `JSON error: ${jsonError}`;
  }
  if (deck?.title) {
    return `JSON valid · ${deck.title}`;
  }
  return "JSON valid";
}

export function HeaderBar({
  deck,
  templates,
  selectedTemplateId,
  isExporting,
  jsonError,
  onTemplateChange,
  onResetTemplate,
  onExportJson,
  onExportPptx
}: HeaderBarProps): JSX.Element {
  return (
    <header className="flex flex-col gap-4 rounded-xl border border-white/70 bg-white/70 p-6 shadow-soft backdrop-blur">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl text-ink-900 md:text-4xl">
          Live JSON to PPTX editor with instant slide previews
        </h1>
        <p className="max-w-3xl text-sm text-ink-700">
          Edit the JSON on the left, watch the slides render in real time on the right, then export a PPTX
          package using PptxGenJS.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Select value={selectedTemplateId} onValueChange={onTemplateChange}>
          <SelectTrigger className="min-w-[180px]">
            <span className="text-ink-500">Template</span>
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={onResetTemplate} variant="ghost">
          Reset template
        </Button>
        <Button onClick={onExportJson} variant="ghost">
          Export JSON
        </Button>
        <Button onClick={onExportPptx} disabled={isExporting}>
          {isExporting ? "Exporting..." : "Export PPTX"}
        </Button>
        <div className={cn("text-xs", jsonError ? "text-ember-700" : "text-ink-500")}>
          {getStatusText(deck, jsonError)}
        </div>
      </div>
    </header>
  );
}
