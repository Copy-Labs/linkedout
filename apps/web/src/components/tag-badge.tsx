import { Badge } from "@workspace/ui/components/badge";

export function TagBadge({ label }: { label: string }) {
  return (
    <Badge
      variant="outline"
      className="border-border/70 bg-muted/40 px-2 py-1 tracking-wider normal-case"
    >
      {label}
    </Badge>
  );
}
