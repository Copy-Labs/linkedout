import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";

type Kind = "privacy" | "terms" | "takedown";

const CONTENT: Record<
  Kind,
  { title: string; intro: string; sections: { heading: string; body: string }[] }
> = {
  privacy: {
    title: "Privacy",
    intro:
      "LinkedOut is built around a simple promise: we do not know who you are, and we do not keep anything that could tell us.",
    sections: [
      {
        heading: "What we do not collect",
        body: "There are no accounts. We do not ask for your name, email address, phone number, employer records or any form of government ID. We do not store IP addresses, browser fingerprints or user-agent strings. Our edge layer uses a salted, rotating hash of an IP only as a transient rate-limit key; it is never written to a database or log.",
      },
      {
        heading: "What we do store",
        body: "When you submit a story we store the story text, the company name you provide, the categories you choose, the moderation result and a count of anonymous “Me Too” reactions. Submissions use single-use tokens; we store only a one-way hash of each token, never the token itself.",
      },
      {
        heading: "Bot protection",
        body: "We use Cloudflare Turnstile to distinguish people from bots. It is configured in a privacy-friendly mode and is not used to track you across sites.",
      },
      {
        heading: "Images and metadata",
        body: "Image uploads are not supported in this version. If introduced later, all embedded metadata (EXIF, GPS, timestamps) will be removed before a file is stored.",
      },
      {
        heading: "Your choices",
        body: "Because we do not link stories to identities, we cannot find your story and delete it on request. Do not include identifying details in a submission. If a story contains personal information, use the takedown process and it will be removed after review.",
      },
      {
        heading: "Draft notice",
        body: "This policy is a working draft for launch preparation and has not yet been reviewed by a qualified legal professional in your jurisdiction.",
      },
    ],
  },
  terms: {
    title: "Terms of use",
    intro:
      "LinkedOut is a space for sharing workplace experiences. It is not a place for attacks, threats or unverified accusations presented as fact.",
    sections: [
      {
        heading: "User-generated content",
        body: "All stories are posted anonymously by users. They are unverified, reflect the author's experience, and do not represent the views of LinkedOut. You are responsible for what you submit.",
      },
      {
        heading: "What is not allowed",
        body: "Do not post threats of violence, harassment, hate speech, personal contact details, private individuals' names, confidential or trade-secret information, or knowingly false claims about a person.",
      },
      {
        heading: "Moderation",
        body: "Submissions are screened before publication. Anything with possible personal information, links or other risk signals is held for human review. We may remove content at any time, with or without notice, to keep the platform safe and lawful.",
      },
      {
        heading: "Takedowns",
        body: "Companies and individuals can request removal of a story through our takedown page. We review requests in good faith and may remove content that violates these terms or applicable law.",
      },
      {
        heading: "No legal advice",
        body: "Nothing on LinkedOut is legal advice, nor is the toxicity index a verified rating of an employer. It is an aggregate signal based on anonymous reports.",
      },
      {
        heading: "Draft notice",
        body: "These terms are a working draft for launch preparation and have not yet been reviewed by a qualified legal professional in your jurisdiction.",
      },
    ],
  },
  takedown: {
    title: "Takedown requests",
    intro:
      "If you believe a story is defamatory, contains personal information or violates our terms, you can ask us to review it.",
    sections: [
      {
        heading: "How to request a review",
        body: "Send the URL of the story, the specific part you believe is wrong or harmful, and a short explanation of why. If you are representing a company, include enough information to show that you are authorised to speak for it. Do not include personal details of private individuals in your request.",
      },
      {
        heading: "What we do",
        body: "A human reviews the request against our terms. We may keep the story, remove it, or ask for more context. We aim to respond within a reasonable working period, and we prioritise cases involving personal safety or private data.",
      },
      {
        heading: "Our position",
        body: "We host user-generated experiences, not our own claims about employers. We are not able to verify every account, so a takedown request is a request for review under our terms, not an automatic removal.",
      },
      {
        heading: "Draft notice",
        body: "This process is a working draft for launch preparation and has not yet been reviewed by a qualified legal professional in your jurisdiction.",
      },
    ],
  },
};

export function LegalPage({ kind }: { kind: Kind }) {
  const content = CONTENT[kind];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <p className="text-xs font-bold tracking-[0.3em] text-primary uppercase">
          LinkedOut
        </p>
        <h1 className="mt-3 font-heading text-4xl font-bold sm:text-5xl">
          {content.title}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          {content.intro}
        </p>
      </div>

      {content.sections.map((section) => (
        <Card key={section.heading} className="border-border shadow-none">
          <CardHeader className="border-b border-border py-4">
            <CardTitle className="text-base normal-case tracking-normal">
              {section.heading}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 text-sm leading-relaxed text-foreground/80">
            {section.body}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
