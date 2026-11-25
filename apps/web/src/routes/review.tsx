import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { createAdminSession } from "@/lib/admin";
import { captureException } from "@/lib/posthog";

type Verdict = "approved" | "rejected" | "flagged";

export function ReviewPage() {
  const [secret, setSecret] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const queue = useQuery(
    api.moderation.pending,
    token ? { adminToken: token } : "skip",
  );
  const override = useMutation(api.moderation.override);
  const resolve = useMutation(api.reports.resolve);
  const erase = useMutation(api.stories.erase);

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const session = await createAdminSession(secret);
      setToken(session.token);
      setSecret("");
      toast.success("Signed in for 30 minutes.");
    } catch (err) {
      captureException(err, "admin_sign_in_failed");
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  async function decide(storyId: string, verdict: Verdict) {
    try {
      await override({
        adminToken: token,
        storyId: storyId as Id<"stories">,
        verdict,
        reason: `Manual review: ${verdict}`,
      });
      toast.success(`Story ${verdict}.`);
    } catch (err) {
      captureException(err, "moderation_override_failed", { verdict });
      toast.error(err instanceof Error ? err.message : "Could not update.");
    }
  }

  async function removeStory(storyId: string) {
    if (!window.confirm("Permanently delete this story and its reports? This cannot be undone.")) {
      return;
    }
    try {
      await erase({
        adminToken: token,
        storyId: storyId as Id<"stories">,
        reason: "Erased from the review queue",
      });
      toast.success("Story permanently deleted.");
    } catch (err) {
      captureException(err, "story_erase_failed");
      toast.error(err instanceof Error ? err.message : "Could not delete.");
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs font-bold tracking-[0.3em] text-primary uppercase">
          Internal
        </p>
        <h1 className="mt-3 font-heading text-4xl font-bold">Review queue</h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          Pending and flagged stories, plus open takedown requests. This page is
          not linked from the public navigation. The permanent admin secret is
          exchanged for a 30-minute session token at the edge.
        </p>
      </div>

      {!token ? (
        <form onSubmit={signIn} className="flex max-w-md flex-col gap-3">
          <label htmlFor="admin-secret" className="text-xs font-semibold tracking-widest uppercase">
            Admin secret
          </label>
          <Input
            id="admin-secret"
            type="password"
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
            placeholder="Enter the Convex ADMIN_SECRET"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={busy || !secret} className="w-fit">
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              Session active · 30 minutes
            </span>
            <Button variant="ghost" size="xs" onClick={() => setToken("")}>
              Sign out
            </Button>
          </div>

          {queue === undefined ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <div className="grid gap-8 lg:grid-cols-2">
              <Card className="border-border shadow-none">
                <CardHeader className="border-b border-border">
                  <CardTitle>Stories ({queue.stories.length})</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 pt-5">
                  {queue.stories.length === 0 && (
                    <p className="text-sm text-muted-foreground">Nothing to review.</p>
                  )}
                  {queue.stories.map((story) => (
                    <div key={story._id} className="border border-border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold tracking-widest uppercase">
                          {story.status} · {story.companyName}
                        </span>
                        <span className="tabular text-xs text-muted-foreground">
                          {new Date(story._creationTime).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-3 font-semibold">{story.title}</p>
                      <p className="mt-2 line-clamp-4 text-sm text-muted-foreground">
                        {story.body}
                      </p>
                      {story.flags.length > 0 && (
                        <p className="mt-3 text-xs text-destructive">
                          {story.flags.join(" ")}
                        </p>
                      )}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button size="xs" onClick={() => decide(story._id, "approved")}>
                          Approve
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => decide(story._id, "flagged")}
                        >
                          Flag
                        </Button>
                        <Button
                          size="xs"
                          variant="destructive"
                          onClick={() => decide(story._id, "rejected")}
                        >
                          Reject
                        </Button>
                        <Button
                          size="xs"
                          variant="destructive"
                          onClick={() => removeStory(story._id)}
                        >
                          Delete permanently
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="h-fit border-border shadow-none">
                <CardHeader className="border-b border-border">
                  <CardTitle>Reports ({queue.reports.length})</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 pt-5">
                  {queue.reports.length === 0 && (
                    <p className="text-sm text-muted-foreground">No open reports.</p>
                  )}
                  {queue.reports.map((report) => (
                    <div key={report._id} className="border border-border p-4">
                      <p className="text-xs font-bold tracking-widest uppercase">
                        {report.reason}
                      </p>
                      {report.detail && (
                        <p className="mt-2 text-sm text-muted-foreground">{report.detail}</p>
                      )}
                      <div className="mt-4 flex gap-2">
                        <Button
                          size="xs"
                          variant="destructive"
                          onClick={async () => {
                            try {
                              await resolve({
                                adminToken: token,
                                reportId: report._id,
                                resolution: "removed",
                              });
                              toast.success("Story removed from public view.");
                            } catch (err) {
                              captureException(err, "report_resolve_failed");
                              toast.error(err instanceof Error ? err.message : "Failed.");
                            }
                          }}
                        >
                          Remove story
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={async () => {
                            try {
                              await resolve({
                                adminToken: token,
                                reportId: report._id,
                                resolution: "kept",
                              });
                              toast.success("Report closed.");
                            } catch (err) {
                              captureException(err, "report_resolve_failed");
                              toast.error(err instanceof Error ? err.message : "Failed.");
                            }
                          }}
                        >
                          Keep story
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
