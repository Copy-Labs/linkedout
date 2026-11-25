import { Input } from "@workspace/ui/components/input";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { CompanyCard } from "@/components/company-card";

export function CompaniesPage() {
  const companies = useQuery(api.companies.list);
  const [filter, setFilter] = useState("");

  const visible = (companies ?? []).filter((company) =>
    company.name.toLowerCase().includes(filter.trim().toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-10">
      <div>
        <p className="text-xs font-bold tracking-[0.3em] text-primary uppercase">
          Directory
        </p>
        <h1 className="mt-3 font-heading text-4xl font-bold sm:text-5xl">
          Companies
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Every company here exists because someone shared an experience. The
          more stories, the clearer the signal.
        </p>
      </div>

      <Input
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        placeholder="Filter by company name…"
        aria-label="Filter companies"
        className="max-w-sm"
      />

      {visible.length === 0 && !companies ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <Skeleton key={index} className="h-40" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <p className="border border-dashed border-border px-5 py-14 text-center text-sm text-muted-foreground">
          No companies match “{filter}”.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((company) => (
            <CompanyCard key={company._id} company={company} />
          ))}
        </div>
      )}
    </div>
  );
}
