const token = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN as string | undefined;
const host =
  (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ??
  "https://us.i.posthog.com";

export const posthogEnabled = Boolean(token);

type PostHogClient = typeof import("posthog-js/dist/module.slim").default;

let loading: Promise<PostHogClient> | null = null;

function loadPostHog(): Promise<PostHogClient> {
  if (!loading) {
    loading = Promise.all([
      import("posthog-js/dist/module.slim"),
      import("posthog-js/dist/extension-bundles"),
    ]).then(([{ default: posthog }, { ErrorTrackingExtensions }]) => {
      posthog.init(token as string, {
        api_host: host,
        defaults: "2026-08-30",
        __extensionClasses: { ...ErrorTrackingExtensions },
        // Privacy-first defaults for an anonymous platform: no persistent
        // device identity, no replay, no autocapture, no automatic pageviews.
        persistence: "memory",
        disable_session_recording: true,
        disable_surveys: true,
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        property_denylist: [
          "$ip",
          "$initial_referrer",
          "$initial_referring_domain",
          "$referrer",
          "$referring_domain",
        ],
      });
      return posthog;
    });
  }
  return loading;
}

// Start loading as soon as the app boots, without blocking first render.
if (token) void loadPostHog().catch(() => undefined);

/** Report an error without attaching story content or user input. */
export function captureException(
  error: unknown,
  action: string,
  extra?: Record<string, string | number | boolean>,
): void {
  if (!token) return;
  const normalized =
    error instanceof Error ? error : new Error(String(error));
  void loadPostHog()
    .then((posthog) =>
      posthog.captureException(normalized, { action, ...extra }),
    )
    .catch(() => undefined);
}

/** Send a pathname-only pageview once the SDK is ready. */
export function capturePageview(url: string): void {
  if (!token) return;
  void loadPostHog()
    .then((posthog) => posthog.capture("$pageview", { $current_url: url }))
    .catch(() => undefined);
}
