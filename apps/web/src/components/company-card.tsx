import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { useQuery } from "convex/react";
import { Link } from "react-router";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";

export function CompanyCard({ company }: { company: Doc<"companies"> }) {
  const scorecard = useQuery(api.stats.companyScorecard, { companyId: company._id });

  return (
    <Link to={`/companies/${company.slug}`} className="group block">
      <Card className="h-full border-border shadow-none transition-colors group-hover:bg-muted/40">
        <CardHeader className="flex-row items-start justify-between gap-4 border-b border-border">
          <CardTitle className="text-base normal-case tracking-normal">
            {company.name}
          </CardTitle>
          <Badge variant="secondary" className="tabular shrink-0">
            {scorecard?.total ?? "—"} stories
          </Badge>
        </CardHeader>
        <CardContent className="flex items-end justify-between gap-4 pt-4">
          <div>
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              Toxicity index
            </p>
            <p className="tabular mt-1 text-3xl font-bold">
              {scorecard?.toxicityIndex ?? "—"}
            </p>
          </div>
          <span className="text-2xl text-muted-foreground transition-transform group-hover:translate-x-1">
            →
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
