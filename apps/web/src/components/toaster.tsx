import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useTheme } from "./theme-provider";

/** Toasts follow the app's own theme toggle, not next-themes. */
export function Toaster(props: ToasterProps) {
  const { theme } = useTheme();
  return <Sonner theme={theme === "system" ? "system" : theme} {...props} />;
}
