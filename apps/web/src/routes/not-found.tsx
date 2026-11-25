import { Button } from "@workspace/ui/components/button";
import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <div className="flex min-h-96 flex-col items-start justify-center gap-5">
      <p className="text-xs font-bold tracking-[0.3em] text-primary uppercase">
        404
      </p>
      <h1 className="font-heading text-5xl font-bold">Nothing here.</h1>
      <p className="text-sm text-muted-foreground">
        The page you were looking for does not exist.
      </p>
      <Button nativeButton={false} render={<Link to="/" />}>Back to stories</Button>
    </div>
  );
}
