declare module "pptxtojson" {
  export type PptxJson = {
    slides?: any[];
    size?: {
      width?: number;
      height?: number;
    };
    themeColors?: string[];
  };

  export function parse(file: ArrayBuffer | Uint8Array | Blob): Promise<PptxJson>;
}
