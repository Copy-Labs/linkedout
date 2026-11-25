import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card";
import { useMutation } from "convex/react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { captureException } from "@/lib/posthog";
import { requestToken } from "@/lib/tokens";
import { TagBadge } from "./tag-badge";

const REPORT_REASONS = [
  { value: "defamation", label: "Defamatory" },
  { value: "pii", label: "Personal info" },
  { value: "hate", label: "Hate or threats" },
  { value: "spam", label: "Spam" },
  { value: "other", label: "Other" },
] as const;

type ReportReason = (typeof REPORT_REASONS)[number]["value"];

type Props = {
  story: Doc<"stories">;
  tagLabels?: Record<string, string>;
  showCompany?: boolean;
};

function formatDate(time: number) {
  return new Date(time).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function StoryCard({ story, tagLabels = {}, showCompany = true }: Props) {
  const addReaction = useMutation(api.reactions.add);
  const createReport = useMutation(api.reports.create);
  const [busy, setBusy] = useState(false);
  const [reporting, setReporting] = useState(false);

  async function handleMeToo() {
    setBusy(true);
    try {
      const token = await requestToken();
      await addReaction({ storyId: story._id, token });
      toast.success("Noted. Thank you for speaking up.");
    } catch (error) {
      captureException(error, "me_too_failed");
      toast.error(error instanceof Error ? error.message : "Could not record that.");
    } finally {
      setBusy(false);
    }
  }

  async function handleReport(reason: ReportReason) {
    setBusy(true);
    try {
      const token = await requestToken();
      await createReport({ storyId: story._id, reason, token });
      toast.success("Report sent for review.");
      setReporting(false);
    } catch (error) {
      captureException(error, "report_failed");
      toast.error(error instanceof Error ? error.message : "Could not send the report.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border-border shadow-none">
      <CardHeader className="flex-row items-center justify-between gap-4 border-b border-border py-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {showCompany && (
            <Link
              to={`/companies/${story.companySlug ?? story.companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              className="font-bold tracking-widest uppercase hover:text-primary"
            >
              {story.companyName}
            </Link>
          )}
          <span className="text-muted-foreground">·</span>
          <span className="tabular text-muted-foreground">
            {formatDate(story._creationTime)}
          </span>
        </div>
        <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          Anonymous
        </span>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 pt-5">
        <h3 className="font-heading text-xl leading-snug font-semibold">
          {story.title}
        </h3>
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/85">
          {story.body}
        </p>

        {story.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {story.tags.map((tag) => (
              <TagBadge key={tag} label={tagLabels[tag] ?? tag.replaceAll("_", " ")} />
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMeToo}
            disabled={busy}
          >
            Me too <span className="tabular ml-1 text-primary">{story.meTooCount}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReporting((value) => !value)}
          >
            {reporting ? "Cancel" : "Report"}
          </Button>
        </div>

        {reporting && (
          <div className="flex flex-wrap gap-2 border border-border bg-muted/30 p-3">
            <span className="w-full text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              Why should this be reviewed?
            </span>
            {REPORT_REASONS.map((reason) => (
              <Button
                key={reason.value}
                variant="outline"
                size="xs"
                disabled={busy}
                onClick={() => handleReport(reason.value)}
              >
                {reason.label}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
