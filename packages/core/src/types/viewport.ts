export interface Viewport {
  name: string;
  width: number;
  height: number;
}

export const DEFAULT_VIEWPORTS: Viewport[] = [
  {
    name: "mobile",
    width: 375,
    height: 812,
  },
  {
    name: "tablet",
    width: 768,
    height: 1024,
  },
  {
    name: "desktop",
    width: 1440,
    height: 900,
  },
];
