import { ConvexProvider } from "convex/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/toaster";

import "@workspace/ui/globals.css";
import "@/styles/app.css";
import "@/lib/posthog";

import { ThemeProvider } from "@/components/theme-provider";
import { convex } from "@/lib/convex";
import { router } from "@/router";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <ThemeProvider>
        <ErrorBoundary>
          <RouterProvider router={router} />
        </ErrorBoundary>
        <Toaster position="bottom-right" />
      </ThemeProvider>
    </ConvexProvider>
  </StrictMode>,
);
