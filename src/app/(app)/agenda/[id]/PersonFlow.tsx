"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import type { EventGift, Step } from "@/lib/agenda";
import { RatingPicker } from "../../carnet/offerts/RatingPicker";
import { chooseIdea, chooseNew, dropGift, giveGift, removePerson, setGiftSecret, setGiftStep } from "../actions";

const LABEL: Record<Step, string> = { to_find: "À trouver", chosen: "Choisi", ordered: "Acheté", ready: "Prêt", given: "Offert" };
const BG: Record<Step, string> = { to_find: "bg-todo", chosen: "bg-progress", ordered: "bg-progress", ready: "bg-ready", given: "bg-ready" };
const DOT: Record<Step, string> = { to_find: "bg-todo-dot", chosen: "bg-progress-dot", ordered: "bg-progress-dot", ready: "bg-ready-dot", given: "bg-ready-dot" };
const STEPS: Step[] = ["chosen", "ordered", "ready", "given"];

const primary = "h-11 rounded-xl bg-accent px-4 text-[15px] font-semibold text-white disabled:opacity-60";
const quiet = "h-11 px-2 text-[15px] font-semibold text-muted disabled:opacity-60";

type Candidate = { id: string; title: string; note: string | null };

// Une personne dans un événement : son étape, et ce qu'il y a à faire pour passer à la suivante (#40).
export function PersonFlow({
  eventId,
  person,
  candidates,
  defaultOpen,
}: {
  eventId: string;
  person: { id: string; slug: string; name: string; step: Step; gift: EventGift | null };
  candidates: Candidate[];
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [buying, setBuying] = useState(false);
  const [giving, setGiving] = useState(false);
  const [pickup, setPickup] = useState("");
  const [newMessage, newAction, newPending] = useActionState(chooseNew.bind(null, eventId, person.id), null);
  const run = (fn: () => Promise<string | null | void>) => start(async () => setError((await fn()) ?? null));
  const { step, gift } = person;

  return (
    <li className={`flex flex-col rounded-2xl ${BG[step]}`}>
      <div className="flex items-center">
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex min-h-14 min-w-0 flex-1 items-center gap-3 py-2 pl-3 text-left">
          <span aria-hidden="true" className={`h-3 w-3 shrink-0 rounded-full ${DOT[step]}`} />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="flex items-baseline justify-between gap-2">
              <span className="truncate text-[16px] font-semibold">{person.name}</span>
              <span className="shrink-0 text-[13px] font-semibold">{LABEL[step]}</span>
            </span>
            <span className="truncate text-[14px] text-muted">
              {gift ? gift.title : candidates.length ? `${candidates.length} ${candidates.length > 1 ? "idées" : "idée"}` : "Aucune idée"}
            </span>
          </span>
        </button>
        <form action={removePerson.bind(null, eventId, person.id)}>
          <button type="submit" aria-label={`Retirer ${person.name} de l'événement`} className="flex h-14 w-11 items-center justify-center text-muted">
            <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M2 2l10 10M12 2L2 12" />
            </svg>
          </button>
        </form>
      </div>

      {open && (
        <div className="mx-1.5 mb-1.5 flex flex-col gap-3 rounded-2xl bg-bg p-3">
          {gift ? (
            <>
              <ol className="flex gap-1" aria-label="Étapes">
                {STEPS.map((s) => (
                  <li key={s} className={`h-1.5 flex-1 rounded ${STEPS.indexOf(s) <= STEPS.indexOf(step) ? DOT[step] : "bg-surface"}`} title={LABEL[s]} />
                ))}
              </ol>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[16px] font-semibold">{gift.title}</p>
                {step !== "given" && (
                  <button
                    type="button"
                    disabled={pending}
                    aria-pressed={gift.secret}
                    onClick={() => run(() => setGiftSecret(gift.id, !gift.secret))}
                    className={`h-11 shrink-0 rounded-full px-4 text-[14px] font-semibold disabled:opacity-60 ${gift.secret ? "bg-accent text-white" : "bg-surface text-muted"}`}
                  >
                    Secret
                  </button>
                )}
              </div>
              {step === "ordered" && gift.needsPickup && <p className="text-[14px]">À récupérer{gift.pickupPlace ? ` : ${gift.pickupPlace}` : ""}</p>}

              {step === "chosen" &&
                (buying ? (
                  <div className="flex flex-col gap-2">
                    <input
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                      placeholder="À récupérer où ? (sinon vide)"
                      aria-label="Lieu de retrait"
                      className="h-11 rounded-xl bg-surface px-3 text-[16px] outline-accent placeholder:text-faint"
                    />
                    <button type="button" disabled={pending} onClick={() => {
                        setBuying(false);
                        run(() => setGiftStep(gift.id, "ordered", pickup));
                      }} className={primary}>
                      Valider l&apos;achat
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setBuying(true)} className={primary}>
                    Acheté
                  </button>
                ))}
              {step === "ordered" && (
                <button type="button" disabled={pending} onClick={() => run(() => setGiftStep(gift.id, "ready"))} className={primary}>
                  Prêt
                </button>
              )}
              {step === "ready" &&
                (giving ? (
                  <RatingPicker pending={pending} onRate={(r, c) => run(() => giveGift(gift.id, r, c))} onLater={() => run(() => giveGift(gift.id, null))} />
                ) : (
                  <button type="button" onClick={() => setGiving(true)} className={primary}>
                    Offert
                  </button>
                ))}
              {step !== "given" && (
                <button type="button" disabled={pending} onClick={() => {
                    setBuying(false);
                    setGiving(false);
                    run(() => dropGift(gift.id));
                  }} className={`${quiet} self-start`}>
                  Changer d&apos;avis
                </button>
              )}
            </>
          ) : (
            <>
              {candidates.length > 0 && (
                <ul className="flex flex-col gap-1">
                  {candidates.map((c) => (
                    <li key={c.id} className="flex items-center gap-2">
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="text-[15px] font-semibold">{c.title}</span>
                        {c.note && <span className="line-clamp-1 text-[13px] text-muted">{c.note}</span>}
                      </span>
                      <button type="button" disabled={pending} onClick={() => run(() => chooseIdea(eventId, c.id))} className="h-11 shrink-0 rounded-xl bg-surface px-3 text-[15px] font-semibold text-accent disabled:opacity-60">
                        Retenir
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <form action={newAction} className="flex flex-wrap gap-2">
                <input
                  name="title"
                  required
                  autoComplete="off"
                  placeholder="Autre cadeau"
                  aria-label="Autre cadeau"
                  className="h-11 min-w-0 flex-1 rounded-xl bg-surface px-3 text-[16px] outline-accent placeholder:text-faint"
                />
                <button type="submit" disabled={newPending} className={primary}>
                  Retenir
                </button>
                <label className="flex h-11 cursor-pointer items-center rounded-full bg-surface px-4 text-[14px] font-semibold text-muted has-checked:bg-accent has-checked:text-white">
                  <input type="checkbox" name="secret" value="1" className="sr-only" />
                  Secret
                </label>
              </form>
              {newMessage && <span className="text-[14px] font-semibold text-accent">{newMessage}</span>}
              <Link href={`/carnet/${person.slug}`} className="flex min-h-11 w-fit items-center text-[15px] font-semibold text-accent">
                Fiche et brief Instinct
              </Link>
            </>
          )}
          {error && <span className="text-[14px] font-semibold text-accent">{error}</span>}
        </div>
      )}
    </li>
  );
}
