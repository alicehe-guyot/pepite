import Link from "next/link";
import type { Idea } from "@/lib/ideas";
import { DeleteButton } from "./DeleteButton";

// Une ligne par idée : titre, destinataires, catégorie. Les pistes sont sur fond soleil.
export function IdeaList({ ideas, empty = "Aucune idée" }: { ideas: Idea[]; empty?: string }) {
  if (!ideas.length) return <p className="text-muted">{empty}</p>;

  return (
    <ul className="grid gap-2 md:grid-cols-2">
      {ideas.map((i) => {
        const details = [i.recipients.map((r) => r.name).join(", ") || "À trier", i.category].filter(Boolean).join(", ");
        return (
          <li key={i.id} className={`flex items-start rounded-2xl ${i.is_lead ? "bg-sun" : "bg-surface"}`}>
            <Link href={`/carnet/idees/${i.id}`} className="flex min-h-[56px] min-w-0 flex-1 flex-col justify-center gap-0.5 py-2.5 pl-3">
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-[16px] font-semibold">{i.title}</span>
                {(i.is_lead || i.given) && (
                  <span className="shrink-0 text-[13px] font-semibold text-muted">{i.given ? "Offerte" : "Piste"}</span>
                )}
              </span>
              <span className="truncate text-[14px] text-muted">{details}</span>
              {i.note && <span className="line-clamp-2 text-[14px]">{i.note}</span>}
            </Link>
            <DeleteButton id={i.id} title={i.title} />
          </li>
        );
      })}
    </ul>
  );
}
