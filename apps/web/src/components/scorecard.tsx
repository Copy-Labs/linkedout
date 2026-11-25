import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

function tone(index: number) {
  if (index >= 70) return "bg-destructive";
  if (index >= 40) return "bg-primary";
  return "bg-muted-foreground";
}

export function Scorecard({ companyId }: { companyId: Id<"companies"> }) {
  const scorecard = useQuery(api.stats.companyScorecard, { companyId });

  if (!scorecard) {
    return <div className="h-48 animate-pulse border border-border bg-muted/30" />;
  }

  const topTags = Object.entries(scorecard.tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const max = topTags[0]?.[1] ?? 1;

  return (
    <Card className="border-border shadow-none">
      <CardHeader className="border-b border-border">
        <CardTitle>Toxicity index</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex items-end gap-3">
          <span className="tabular font-heading text-6xl font-bold leading-none">
            {scorecard.toxicityIndex}
          </span>
          <span className="mb-1 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            / 100
          </span>
        </div>

        <div className="h-2 w-full bg-muted">
          <div
            className={`h-full transition-all duration-500 ${tone(scorecard.toxicityIndex)}`}
            style={{ width: `${scorecard.toxicityIndex}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="font-semibold tracking-widest text-muted-foreground uppercase">
              Reports
            </p>
            <p className="tabular mt-1 text-xl font-semibold">{scorecard.total}</p>
          </div>
          <div>
            <p className="font-semibold tracking-widest text-muted-foreground uppercase">
              Confidence
            </p>
            <p className="mt-1 text-xl font-semibold capitalize">
              {scorecard.confidence}
            </p>
          </div>
        </div>

        {topTags.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-border pt-5">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              Most reported
            </p>
            {topTags.map(([key, count]) => (
              <div key={key} className="flex items-center gap-3">
                <span className="w-40 truncate text-xs">{key.replaceAll("_", " ")}</span>
                <div className="h-1.5 flex-1 bg-muted">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${(count / max) * 100}%` }}
                  />
                </div>
                <span className="tabular w-6 text-right text-xs text-muted-foreground">
                  {count}
                </span>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs leading-relaxed text-muted-foreground">
          A signal from anonymous reports, not a verified fact. More reports
          make the index more meaningful.
        </p>
      </CardContent>
    </Card>
  );
}
