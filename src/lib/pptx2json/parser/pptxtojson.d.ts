export interface PptxSize {
  width: number;
  height: number;
}

export interface PptxParseResult {
  slides: any[];
  themeColors: string[];
  size: PptxSize;
}

export function parse(file: ArrayBuffer, options?: Record<string, unknown>: any): Promise<PptxParseResult>;
