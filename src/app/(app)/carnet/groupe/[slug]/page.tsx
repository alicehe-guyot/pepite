import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/BackLink";
import { getGroup, listGroups } from "@/lib/groups";
import { listIdeas, shareText } from "@/lib/ideas";
import { ShareButton } from "@/components/ShareButton";
import { IdeaList } from "../../idees/IdeaList";
import { RenameForm } from "./RenameForm";

export default async function GroupPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [group, allIdeas, groups] = await Promise.all([getGroup(slug), listIdeas(), listGroups()]);
  if (!group) notFound();
  const memberIds = group.members.map((m) => m.id);
  // Sous-groupes : les groupes dont tous les membres sont dans celui-ci (ex. Alice & JB dans
  // Alice & JB & Emile). Leurs idées comptent ici : un cadeau pour le couple plutôt qu'un chacun (#43).
  const subgroups = groups.filter(
    (g) => g.id !== group.id && g.members.length > 1 && g.members.every((m) => memberIds.includes(m.id)),
  );
  const groupIds = [group.id, ...subgroups.map((g) => g.id)];
  const ideas = allIdeas
    .filter((i) => !i.given)
    .filter((i) => i.recipients.some((r) => (r.kind === "group" ? groupIds.includes(r.id) : memberIds.includes(r.id))));
  const forGroup = (id: string) => ideas.filter((i) => i.recipients.some((r) => r.kind === "group" && r.id === id));
  const names = group.members.map((m) => m.name);
  const share = shareText(`Idées cadeaux pour ${names.slice(0, -1).join(", ")}${names.length > 1 ? " et " : ""}${names.at(-1) ?? ""}`, [
    ...group.members.map((m) => ({
      name: m.name,
      ideas: ideas.filter((i) => i.recipients.some((r) => r.kind === "person" && r.id === m.id)),
    })),
    ...subgroups.map((g) => ({ name: `${g.members.map((m) => m.name).join(" et ")}, ${g.members.length > 2 ? "un cadeau commun" : "un cadeau à deux"}`, ideas: forGroup(g.id) })),
    { name: `${names.join(", ")}, ensemble`, ideas: forGroup(group.id) },
  ]);

  return (
    <div className="flex flex-col gap-5">
      <BackLink href="/carnet">Carnet</BackLink>
      <div className="flex flex-col gap-1">
        <h1 className="text-[24px] font-bold leading-tight">{group.name}</h1>
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

      <ShareButton text={share} />

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-bold">Idées</h2>
        <IdeaList ideas={ideas} empty="Pas encore d'idée" />
      </section>

      <RenameForm slug={group.slug} name={group.name} />
    </div>
  );
}
