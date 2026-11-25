import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { captureException } from "@/lib/posthog";
import { requestToken } from "@/lib/tokens";

export function SubmitPage() {
  const tags = useQuery(api.tags.list);
  const submitStory = useMutation(api.stories.submit);
  const navigate = useNavigate();

  const [companyName, setCompanyName] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  function toggleTag(key: string) {
    setSelected((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : current.length < 5
          ? [...current, key]
          : current,
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const token = await requestToken();
      await submitStory({ token, companyName, title, body, tags: selected });
      toast.success("Story submitted. It will appear after moderation.");
      navigate("/");
    } catch (error) {
      captureException(error, "story_submit_failed");
      toast.error(error instanceof Error ? error.message : "Could not submit.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
      <div>
        <p className="text-xs font-bold tracking-[0.3em] text-primary uppercase">
          Anonymous submission
        </p>
        <h1 className="mt-3 font-heading text-4xl font-bold sm:text-5xl">
          Say what you couldn&apos;t say at work.
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
          No account, no email, no name. We do not store your IP address or any
          device information. Please don&apos;t include names, phone numbers or
          other personal details in your story.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-7">
          <div className="flex flex-col gap-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              required
              minLength={2}
              maxLength={120}
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              placeholder="e.g. Acme Corp"
            />
            <p className="text-xs text-muted-foreground">
              Use the company&apos;s common name, not a personal identifier.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              required
              minLength={5}
              maxLength={120}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Sum it up in one line"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="body">Your story</Label>
            <Textarea
              id="body"
              required
              minLength={20}
              maxLength={5000}
              rows={9}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="What happened, and why did you leave?"
            />
            <p className="text-xs text-muted-foreground">At least 20 characters.</p>
          </div>

          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-semibold">
              Categories <span className="text-muted-foreground">(up to 5)</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {(tags ?? []).map((tag) => {
                const active = selected.includes(tag.key);
                return (
                  <Button
                    type="button"
                    key={tag.key}
                    variant={active ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleTag(tag.key)}
                    className="normal-case tracking-normal"
                  >
                    {tag.label}
                  </Button>
                );
              })}
            </div>
          </fieldset>

          <Button type="submit" size="lg" disabled={busy} className="w-fit">
            {busy ? "Submitting…" : "Submit anonymously"}
          </Button>
        </form>
      </div>

      <Card className="h-fit border-border shadow-none lg:sticky lg:top-6">
        <CardHeader className="border-b border-border">
          <CardTitle>Before you post</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-5 text-xs leading-relaxed text-muted-foreground">
          <p>
            <strong className="text-foreground">Stories are user-generated.</strong>{" "}
            They are unverified and do not represent our views.
          </p>
          <p>
            Do not post threats, hate speech, personal contact details or
            confidential company information. Anything like that is held for
            review and never published as-is.
          </p>
          <p>
            If a company believes a claim is false, it can use our{" "}
            <a href="/takedown" className="text-primary underline underline-offset-4">
              takedown process
            </a>
            .
          </p>
          <p>
            By posting you agree to our{" "}
            <a href="/terms" className="text-primary underline underline-offset-4">
              terms
            </a>{" "}
            and{" "}
            <a href="/privacy" className="text-primary underline underline-offset-4">
              privacy policy
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
