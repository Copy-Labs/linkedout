import { Skeleton } from "@workspace/ui/components/skeleton";
import { useQuery } from "convex/react";
import { Link, useSearchParams } from "react-router";
import { api } from "../../convex/_generated/api";
import { SearchBar } from "@/components/search-bar";
import { StoryCard } from "@/components/story-card";

export function SearchPage() {
  const [params] = useSearchParams();
  const term = params.get("q")?.trim() ?? "";
  const companies = useQuery(api.companies.search, term ? { term } : "skip");
  const stories = useQuery(api.stories.search, term ? { term } : "skip");
  const tags = useQuery(api.tags.list);
  const tagLabels = Object.fromEntries(
    (tags ?? []).map((tag) => [tag.key, tag.label]),
  );

  return (
    <div className="flex flex-col gap-10">
      <div>
        <p className="text-xs font-bold tracking-[0.3em] text-primary uppercase">
          Search
        </p>
        <h1 className="mt-3 font-heading text-4xl font-bold sm:text-5xl">
          {term ? `Results for “${term}”` : "Find a company"}
        </h1>
        <div className="mt-6 max-w-2xl">
          <SearchBar />
        </div>
      </div>

      {!term ? (
        <p className="text-sm text-muted-foreground">
          Type a company name or a phrase from a story.
        </p>
      ) : (
        <>
          <section className="flex flex-col gap-4">
            <h2 className="font-heading text-xl font-bold">Companies</h2>
            {companies === undefined ? (
              <Skeleton className="h-24 w-full" />
            ) : companies.length === 0 ? (
              <p className="text-sm text-muted-foreground">No companies found.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {companies.map((company) => (
                  <Link
                    key={company._id}
                    to={`/companies/${company.slug}`}
                    className="border border-border px-4 py-3 text-sm font-semibold transition-colors hover:bg-muted/40"
                  >
                    {company.name} <span className="text-primary">→</span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="font-heading text-xl font-bold">Stories</h2>
            {stories === undefined ? (
              <Skeleton className="h-48 w-full" />
            ) : stories.length === 0 ? (
              <p className="text-sm text-muted-foreground">No stories found.</p>
            ) : (
              stories.map((story) => (
                <StoryCard
                  key={story._id}
                  story={story}
                  tagLabels={tagLabels}
                />
              ))
            )}
          </section>
        </>
      )}
    </div>
  );
}
