import type { PresentationData } from "../types/ppt";

export type TemplateEntry = {
  id: string;
  name: string;
  data: PresentationData;
};

const templateModules = import.meta.glob("../../template/*.json", {
  eager: true,
  import: "default"
}) as Record<string, PresentationData>;

export const templateList: TemplateEntry[] = Object.entries(templateModules)
  .map(([path, data]) => ({
    id: path,
    name: path.split("/").pop()?.replace(".json", "") ?? path,
    data
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const initialTemplate = templateList[0];
export const initialJson = JSON.stringify(initialTemplate?.data ?? {}, null, 2);

export function findTemplateById(templateId: string): TemplateEntry | undefined {
  return templateList.find((item) => item.id === templateId);
}
