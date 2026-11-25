import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { usePaginatedQuery, useQuery } from "convex/react";
import { Link, useParams } from "react-router";
import { api } from "../../convex/_generated/api";
import { Scorecard } from "@/components/scorecard";
import { StoryCard } from "@/components/story-card";

export function CompanyDetailPage() {
  const { slug = "" } = useParams();
  const company = useQuery(api.companies.bySlug, { slug });
  const tags = useQuery(api.tags.list);
  const stories = usePaginatedQuery(
    api.stories.listForCompany,
    company ? { companyId: company._id } : "skip",
    { initialNumItems: 10 },
  );

  const tagLabels = Object.fromEntries(
    (tags ?? []).map((tag) => [tag.key, tag.label]),
  );

  if (!company) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-16 w-2/3" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-6 border-b border-border pb-10 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link
            to="/companies"
            className="text-xs font-semibold tracking-widest text-muted-foreground uppercase hover:text-foreground"
          >
            ← All companies
          </Link>
          <h1 className="mt-4 font-heading text-4xl font-bold sm:text-5xl">
            {company.name}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {stories.results.length} published {stories.results.length === 1 ? "story" : "stories"}
            {company.industry ? ` · ${company.industry}` : ""}
          </p>
        </div>
        <Button nativeButton={false} render={<Link to="/submit" />}>Share a story about them</Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
        <Scorecard companyId={company._id} />

        <div className="flex flex-col gap-5">
          <h2 className="font-heading text-2xl font-bold">What people said</h2>
          {stories.results.length === 0 && stories.status !== "LoadingFirstPage" ? (
            <p className="border border-dashed border-border px-5 py-12 text-center text-sm text-muted-foreground">
              No published stories for this company yet.
            </p>
          ) : (
            stories.results.map((story) => (
              <StoryCard
                key={story._id}
                story={story}
                tagLabels={tagLabels}
                showCompany={false}
              />
            ))
          )}
          {stories.status === "LoadingFirstPage" && (
            <Skeleton className="h-64 w-full" />
          )}
          {stories.status === "CanLoadMore" && (
            <Button
              variant="outline"
              onClick={() => stories.loadMore(10)}
              disabled={stories.isLoading}
            >
              Load more
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
