export type FrameworkType =
  | "nextjs"
  | "nuxt"
  | "vite"
  | "remix"
  | "svelte"
  | "vanilla";

export interface FrameworkDetection {
  framework: FrameworkType;
  version?: string;
  router?: "app" | "pages";
  sourceDir?: string;
}

export interface SourceLocation {
  file: string;
  line: number;
  column?: number;
  componentName?: string;
}
