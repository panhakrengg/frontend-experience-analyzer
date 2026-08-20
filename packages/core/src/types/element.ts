export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ElementReference {
  selector: string;

  tagName: string;

  id?: string;

  classes?: string[];

  role?: string;

  text?: string;

  accessibleName?: string;

  attributes?: Record<string, string>;

  boundingBox?: BoundingBox;

  visible: boolean;

  interactive: boolean;
}
