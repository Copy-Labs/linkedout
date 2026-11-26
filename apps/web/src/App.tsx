import { MoonIcon, SunIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Suspense } from "react";
import { Link, Outlet } from "react-router";
import { PostHogPageView } from "@/components/posthog-pageview";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { useTheme } from "@/components/theme-provider";

export function App() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <TurnstileWidget />
      <PostHogPageView />

      <header className="border-b border-border">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-5">
          <Link to="/" className="group flex items-center gap-2">
            <span className="size-2.5 bg-primary transition-transform group-hover:rotate-45" />
            <span className="font-heading text-base font-bold tracking-[0.2em] uppercase">
              Linked<span className="text-primary">Out</span>
            </span>
          </Link>

          <nav className="ml-auto flex items-center gap-1 text-xs font-semibold tracking-widest uppercase">
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link to="/" />}>
              Stories
            </Button>
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false} render={<Link to="/companies" />}
            >
              Companies
            </Button>
            <Button
              variant="default"
              size="sm"
              nativeButton={false} render={<Link to="/submit" />}
            >
              Share your story
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Toggle theme"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <HugeiconsIcon
                icon={theme === "dark" ? SunIcon : MoonIcon}
                strokeWidth={2}
                className="size-4"
              />
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
        <Suspense
          fallback={
            <div className="flex flex-col gap-5">
              <Skeleton className="h-12 w-2/3" />
              <Skeleton className="h-64 w-full" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-md leading-relaxed">
            Anonymous by design. We do not ask who you are, and we do not keep
            anything that could identify you.
          </p>
          <div className="flex flex-wrap gap-5 font-semibold tracking-widest uppercase">
            <Link to="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link to="/takedown" className="hover:text-foreground">
              Takedown
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
