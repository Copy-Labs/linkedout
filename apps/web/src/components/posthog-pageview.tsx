import { useEffect } from "react";
import { useLocation } from "react-router";
import { capturePageview } from "@/lib/posthog";

/** Sends a pageview with the pathname only — no search terms or PII. */
export function PostHogPageView() {
  const location = useLocation();

  useEffect(() => {
    capturePageview(`${window.location.origin}${location.pathname}`);
  }, [location.pathname]);

  return null;
}
