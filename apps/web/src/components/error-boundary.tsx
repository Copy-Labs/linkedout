import { Component, type ErrorInfo, type ReactNode } from "react";
import { captureException } from "@/lib/posthog";

type Props = { children: ReactNode };
type State = { error: Error | null };

/** Keeps a failed render from blanking the whole application. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    captureException(error, "react_error_boundary", {
      componentStack: (info.componentStack ?? "").slice(0, 2000),
    });
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-5 px-6 text-center">
        <p className="text-xs font-bold tracking-[0.3em] text-primary uppercase">
          Something went wrong
        </p>
        <h1 className="font-heading text-4xl font-bold">We couldn&apos;t load this page.</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Your story has not been affected. Try reloading the page.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="border border-primary px-5 py-2 text-xs font-semibold tracking-widest uppercase hover:bg-primary hover:text-primary-foreground"
        >
          Reload
        </button>
      </div>
    );
  }
}
