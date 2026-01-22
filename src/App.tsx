import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import { EditorPanel } from "./components/EditorPanel";
import { HeaderBar } from "./components/HeaderBar";
import { PreviewPanel } from "./components/PreviewPanel";
import { buildPptx } from "./lib/pptx";
import { findTemplateById, initialJson, initialTemplate, templateList, type TemplateEntry } from "./lib/templates";
import type { Deck } from "./types/ppt";

const MIN_PREVIEW_WIDTH = 320;
const PREVIEW_GUTTER = 48;

function safeParse(value: string): { data: Deck | null; error: string } {
  try {
    return { data: JSON.parse(value) as Deck, error: "" };
  } catch (error) {
    return { data: null, error: (error as Error).message };
  }
}

function getTemplateOrFallback(templateId: string): TemplateEntry | undefined {
  return findTemplateById(templateId) ?? templateList[0];
}

function buildDownload(jsonText: string, fileName: string): void {
  const blob = new Blob([jsonText], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function App(): JSX.Element {
  const [jsonText, setJsonText] = useState(initialJson);
  const [exporting, setExporting] = useState(false);
  const [previewWidth, setPreviewWidth] = useState(720);
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplate?.id ?? "");
  const deferredJsonText = useDeferredValue(jsonText);
  const previewRef = useRef<HTMLDivElement | null>(null);

  const parsed = useMemo(() => safeParse(deferredJsonText), [deferredJsonText]);
  const deck = parsed.data;
  const slideWidth = deck?.width ?? 1000;
  const slideHeight = deck?.height ?? 562.5;

  const selectedTemplate = useMemo(() => getTemplateOrFallback(selectedTemplateId), [selectedTemplateId]);

  function applyTemplate(templateId: string): void {
    const template = getTemplateOrFallback(templateId);
    if (!template) return;
    setSelectedTemplateId(template.id);
    setJsonText(JSON.stringify(template.data, null, 2));
  }

  useEffect(() => {
    function updateWidth(): void {
      if (!previewRef.current) return;
      const containerWidth = previewRef.current.clientWidth;
      const availableWidth = Math.max(MIN_PREVIEW_WIDTH, containerWidth - PREVIEW_GUTTER);
      setPreviewWidth(Math.min(slideWidth, availableWidth));
    }

    updateWidth();

    if (typeof ResizeObserver === "undefined" || !previewRef.current) {
      window.addEventListener("resize", updateWidth);
      return () => window.removeEventListener("resize", updateWidth);
    }

    const observer = new ResizeObserver(updateWidth);
    observer.observe(previewRef.current);
    return () => observer.disconnect();
  }, [slideWidth]);

  async function handleExportPptx(): Promise<void> {
    const current = safeParse(jsonText);
    if (!current.data) {
      alert("JSON parse error. Fix the JSON before exporting.");
      return;
    }
    setExporting(true);
    try {
      await buildPptx(current.data);
    } finally {
      setExporting(false);
    }
  }

  function handleExportJson(): void {
    const fileName = `${deck?.title ?? "json2ppt"}.json`;
    buildDownload(jsonText, fileName);
  }

  return (
    <div className="h-screen px-6 py-6">
      <div className="mx-auto flex h-full flex-col gap-6">
        <HeaderBar
          deck={deck}
          templates={templateList}
          selectedTemplateId={selectedTemplate?.id ?? ""}
          isExporting={exporting}
          jsonError={parsed.error}
          onTemplateChange={applyTemplate}
          onResetTemplate={() => applyTemplate(selectedTemplate?.id ?? "")}
          onExportJson={handleExportJson}
          onExportPptx={handleExportPptx}
        />

        <main className="grid flex-1 min-h-0 gap-6 lg:grid-cols-[1fr_1.4fr]">
          <EditorPanel value={jsonText} onChange={setJsonText} />
          <PreviewPanel
            deck={deck}
            slideWidth={slideWidth}
            slideHeight={slideHeight}
            previewWidth={previewWidth}
            previewRef={previewRef}
          />
        </main>
      </div>
    </div>
  );
}
