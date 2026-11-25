import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { usePaginatedQuery, useQuery } from "convex/react";
import { Link } from "react-router";
import { api } from "../../convex/_generated/api";
import { CompanyCard } from "@/components/company-card";
import { SearchBar } from "@/components/search-bar";
import { StoryCard } from "@/components/story-card";

export function HomePage() {
  const stories = usePaginatedQuery(
    api.stories.listRecent,
    {},
    { initialNumItems: 6 },
  );
  const companies = useQuery(api.companies.list);
  const tags = useQuery(api.tags.list);
  const stats = useQuery(api.stats.homeStats);

  const tagLabels = Object.fromEntries(
    (tags ?? []).map((tag) => [tag.key, tag.label]),
  );

  return (
    <div className="flex flex-col gap-16">
      <section className="relative border-b border-border pb-14">
        <div className="pointer-events-none absolute inset-y-0 -right-24 w-72 opacity-[0.07] editorial-rule" />
        <p className="text-xs font-bold tracking-[0.3em] text-primary uppercase">
          Workplace transparency, unfiltered
        </p>
        <h1 className="mt-5 max-w-3xl font-heading text-5xl leading-[0.98] font-bold tracking-tight sm:text-7xl">
          The truth about work,
          <br />
          <span className="text-primary">without the filter.</span>
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
          Anonymous stories from people who left. Search a company before you
          accept the offer — and see what others were never allowed to say out
          loud.
        </p>
        <div className="mt-8 max-w-2xl">
          <SearchBar large />
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-6 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          <span>No accounts</span>
          <span className="size-1 bg-primary" />
          <span>No personal data</span>
          <span className="size-1 bg-primary" />
          <Link to="/submit" className="border-b border-primary text-foreground">
            Share your story →
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-4 border-y border-border py-6">
        {[
          { label: "Stories", value: stats?.stories },
          { label: "Companies", value: stats?.companies },
          { label: "Me too's", value: stats?.meToo },
        ].map((stat) => (
          <div key={stat.label}>
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              {stat.label}
            </p>
            <p className="tabular mt-2 font-heading text-3xl font-bold">
              {stat.value ?? "—"}
            </p>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.3em] text-primary uppercase">
              Latest
            </p>
            <h2 className="mt-2 font-heading text-3xl font-bold">Recent stories</h2>
          </div>
          <Button variant="link" size="sm" nativeButton={false} render={<Link to="/companies" />}>
            Browse companies →
          </Button>
        </div>

        {stories.results.length === 0 && stories.status !== "LoadingFirstPage" ? (
          <Card className="border-dashed border-border shadow-none">
            <CardContent className="py-14 text-center text-sm text-muted-foreground">
              No stories have been published yet.{" "}
              <Link to="/submit" className="text-primary underline underline-offset-4">
                Be the first.
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {stories.results.map((story) => (
              <StoryCard
                key={story._id}
                story={story}
                tagLabels={tagLabels}
              />
            ))}
            {stories.status === "LoadingFirstPage" &&
              [0, 1, 2, 3].map((index) => (
                <Skeleton key={index} className="h-64 w-full" />
              ))}
          </div>
        )}

        {stories.status === "CanLoadMore" && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => stories.loadMore(6)}
              disabled={stories.isLoading}
            >
              Load more stories
            </Button>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-6">
        <div>
          <p className="text-xs font-bold tracking-[0.3em] text-primary uppercase">
            Currently discussed
          </p>
          <h2 className="mt-2 font-heading text-3xl font-bold">Companies</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(companies ?? []).slice(0, 6).map((company) => (
            <CompanyCard key={company._id} company={company} />
          ))}
          {!companies && [0, 1, 2].map((index) => <Skeleton key={index} className="h-40" />)}
        </div>
      </section>
    </div>
  );
}
