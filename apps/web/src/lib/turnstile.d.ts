export {};

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact";
        },
      ) => string;
      execute: (
        widgetId: string,
        options?: { action?: string },
      ) => Promise<string | void>;
      getResponse: (widgetId: string) => string;
      remove: (widgetId: string) => void;
    };
    turnstileWidget?: string;
  }
}
