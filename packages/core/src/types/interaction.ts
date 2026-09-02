export interface ConsoleMessage {
  type: "error" | "warning" | "log";
  text: string;
  location?: string;
}

export interface NetworkEvent {
  url: string;
  method: string;
  status: number;
  failed: boolean;
  errorText?: string;
}

export interface InteractionEvent {
  type: "click" | "keyboard" | "form-submit" | "modal-escape" | "dropdown-toggle";
  targetSelector: string;
  success: boolean;
  errorMessage?: string;
  focusBefore?: string;
  focusAfter?: string;
  mutationsCount?: number;
  timestamp?: string;
}

export interface InteractionTrace {
  consoleErrors: ConsoleMessage[];
  networkFailures: NetworkEvent[];
  interactions: InteractionEvent[];
}
