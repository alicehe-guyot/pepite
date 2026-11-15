import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/BackLink";
import { getGroup, listGroups } from "@/lib/groups";
import { listIdeas, shareText } from "@/lib/ideas";
import { ShareButton } from "@/components/ShareButton";
import { IdeaList } from "../../idees/IdeaList";
import { Members } from "./Members";
import { EditableTitle } from "@/components/EditableTitle";
import { ConfirmButton } from "@/components/ConfirmButton";
import { deleteGroup, renameGroupTo } from "../../actions";
import { listPersons } from "@/lib/persons";

export default async function GroupPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [group, allIdeas, groups, everyone] = await Promise.all([getGroup(slug), listIdeas(), listGroups(), listPersons()]);
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
      sizes: m.sizes,
      ideas: ideas.filter((i) => i.recipients.some((r) => r.kind === "person" && r.id === m.id)),
    })),
    ...subgroups.map((g) => ({ name: `${g.members.map((m) => m.name).join(" et ")}, ${g.members.length > 2 ? "un cadeau commun" : "un cadeau à deux"}`, ideas: forGroup(g.id) })),
    { name: `${names.join(", ")}, ensemble`, ideas: forGroup(group.id) },
  ]);

  return (
    <div className="flex flex-col gap-4">
      <BackLink href="/carnet">Carnet</BackLink>
      <div className="flex flex-col">
        <EditableTitle value={group.name} onSave={renameGroupTo.bind(null, group.slug)} />
        <p className="text-[15px] text-muted">
          {ideas.length} {ideas.length > 1 ? "idées" : "idée"}
        </p>
      </div>

      <Members groupId={group.id} members={group.members} everyone={everyone.map((p) => ({ id: p.id, slug: p.slug, name: p.name }))} />

      <ShareButton text={share} photos={ideas.flatMap((i) => (i.imageUrl ? [{ url: i.imageUrl, name: i.title }] : []))} />

      <section className="flex flex-col gap-3">
        <div className="flex min-h-11 items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold">Idées</h2>
          <Link href={`/capture?pour=group:${group.id}&retour=/carnet/groupe/${group.slug}`} className="flex h-11 items-center gap-1 rounded-xl px-2 text-[15px] font-semibold text-accent">
            <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M7 2v10M2 7h10" />
            </svg>
            Idée
          </Link>
        </div>
        <IdeaList ideas={ideas} empty="Pas encore d'idée" />
      </section>

      <ConfirmButton action={deleteGroup.bind(null, group.slug)} label="Supprimer le groupe" />
    </div>
  );
}
