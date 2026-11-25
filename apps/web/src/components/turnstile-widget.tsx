import { useEffect, useRef } from "react";

/** A single shared widget used for every single-use token request. */
export function TurnstileWidget() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    const renderWidget = () => {
      if (cancelled || !container.current || window.turnstileWidget) return;
      window.turnstileWidget = window.turnstile!.render(container.current, {
        sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY as string,
        size: "compact",
      });
    };

    if (window.turnstile) {
      renderWidget();
      return () => {
        cancelled = true;
      };
    }

    const script = document.createElement("script");
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = renderWidget;
    document.head.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      ref={container}
      aria-hidden="true"
      className="fixed bottom-2 left-2 z-50 opacity-40"
    />
  );
}
