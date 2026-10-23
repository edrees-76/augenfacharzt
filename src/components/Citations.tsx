const TYPE_LABELS: Record<string, string> = {
  DOG_LEITLINIE: "DOG-Leitlinie",
  DOG_BVA_STELLUNGNAHME: "DOG/BVA-Stellungnahme",
  AWMF_LEITLINIE: "AWMF-Leitlinie",
  EYEWIKI: "EyeWiki",
  OTHER: "Quelle",
};

export type CitationLike = { type: string; title: string; dateLabel: string | null; url: string | null };

export function Citations({ citations }: { citations: CitationLike[] }) {
  if (citations.length === 0) return null;
  return (
    <div className="mt-4 border-t border-border pt-3">
      <p className="mb-1.5 text-xs font-semibold uppercase text-muted">Leitlinien und Quellen</p>
      <ul className="space-y-1">
        {citations.map((c, i) => (
          <li key={i} className="text-xs text-muted">
            <span className="font-medium text-foreground">{TYPE_LABELS[c.type] ?? c.type}:</span>{" "}
            {c.url ? (
              <a
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                {c.title}
              </a>
            ) : (
              c.title
            )}
            {c.dateLabel ? ` (${c.dateLabel})` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
