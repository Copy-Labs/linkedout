import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { useState } from "react";
import { useNavigate } from "react-router";

export function SearchBar({ large = false }: { large?: boolean }) {
  const [term, setTerm] = useState("");
  const navigate = useNavigate();

  return (
    <form
      className="flex w-full gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (term.trim()) navigate(`/search?q=${encodeURIComponent(term.trim())}`);
      }}
    >
      <Input
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder="Search a company or a story…"
        aria-label="Search"
        className={large ? "h-13 border-foreground/20 bg-background px-4 text-base" : ""}
      />
      <Button type="submit" size={large ? "lg" : "default"}>
        Search
      </Button>
    </form>
  );
}
