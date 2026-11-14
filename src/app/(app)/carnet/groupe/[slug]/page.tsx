import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/BackLink";
import { getGroup } from "@/lib/groups";
import { ideasForGroup, listIdeas } from "@/lib/ideas";
import { IdeaList } from "../../idees/IdeaList";
import { RenameForm } from "./RenameForm";

export default async function GroupPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [group, allIdeas] = await Promise.all([getGroup(slug), listIdeas()]);
  if (!group) notFound();
  const ideas = ideasForGroup(allIdeas, group.id, group.members.map((m) => m.id));

  return (
    <div className="flex flex-col gap-5">
      <BackLink href="/carnet">Carnet</BackLink>
      <div className="flex flex-col gap-1">
        <h1 className="text-[28px] font-bold leading-tight">{group.name}</h1>
        <p className="text-[15px] text-muted">
          {ideas.length} {ideas.length > 1 ? "idées" : "idée"}
        </p>
      </div>

      <ul className="flex flex-wrap gap-2">
        {group.members.map((m) => (
          <li key={m.id}>
            <Link href={`/carnet/${m.slug}`} className="flex min-h-11 items-center rounded-full bg-surface px-4 text-[15px] font-semibold">
              {m.name}
            </Link>
          </li>
        ))}
      </ul>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-bold">Idées</h2>
        <IdeaList ideas={ideas} empty="Pas encore d'idée" />
      </section>

      <RenameForm slug={group.slug} name={group.name} />
    </div>
  );
}
