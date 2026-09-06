import { ExternalLink } from "lucide-react";
import { findNode, partyById } from "@/lib/case/tree";
import { useTreeStore } from "@/lib/case/store";
import { STATUS_LABEL, type EmailHit, type Status } from "@/lib/case/types";
import { cn } from "@/lib/cn";

const STATUS_CLASS: Record<Status, string> = {
  open: "text-status-open",
  sent: "text-status-sent",
  awaiting: "text-status-awaiting",
  replied: "text-status-replied",
  review: "text-status-review",
  complaint: "text-status-complaint",
  exhausted: "text-status-exhausted",
  bounce: "text-status-bounce",
};

function Mail({ hit }: { hit: EmailHit }) {
  return (
    <li className="border-l-2 border-line py-2 pl-3">
      <div className="flex flex-wrap items-baseline gap-x-2 text-xs text-muted">
        <span className="tabular-nums text-fg">{hit.date.slice(0, 10)}</span>
        <span>{hit.direction === "out" ? "out" : "in"}</span>
        {hit.reference ? <span className="text-faint">{hit.reference}</span> : null}
      </div>
      <div className="mt-1 text-sm text-fg">{hit.subject}</div>
      <div className="mt-0.5 text-xs text-muted">
        {hit.direction === "out" ? `to ${hit.to}` : `from ${hit.from}`}
      </div>
      <p className="mt-1 text-pretty text-xs leading-5 text-muted">{hit.preview}</p>
    </li>
  );
}

export function DetailPanel() {
  const selected = useTreeStore((s) => s.selected);
  const select = useTreeStore((s) => s.select);
  const node = selected ? findNode(selected) : null;
  const party = node?.partyId ? partyById(node.partyId) : undefined;

  if (!node || node.id === "root") {
    return (
      <aside
        id="enquiry-detail"
        className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 lg:sticky lg:top-4"
      >
        <h2 className="text-sm font-medium text-accent">Select a node</h2>
        <p className="text-pretty text-sm leading-6 text-muted">
          Tap a party, then enquiry → foi / gdpr / sar → internal review. Colour follows the
          emails. Last subject sits under each line.
        </p>
      </aside>
    );
  }

  return (
    <aside
      id="enquiry-detail"
      className="flex max-h-[calc(100dvh-2rem)] flex-col gap-5 overflow-y-auto rounded-lg border border-line bg-surface p-4 lg:sticky lg:top-4"
    >
      <header className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <div className={cn("text-xs tracking-wide", STATUS_CLASS[node.status])}>
            {STATUS_LABEL[node.status]}
            {node.kind ? ` · ${node.kind.toUpperCase()}` : ""}
          </div>
          <button
            type="button"
            onClick={() => select(null)}
            className="min-h-11 rounded-md border border-line px-3 text-xs text-muted lg:hidden"
          >
            Close
          </button>
        </div>
        <h2 className="text-balance text-base font-medium leading-snug text-fg">{node.label}</h2>
        {party ? (
          <p className="text-xs text-muted">
            {party.name}
            {node.reference ? ` · ${node.reference}` : ""}
          </p>
        ) : null}
      </header>

      {party?.holds ? (
        <p className="text-pretty text-sm leading-6 text-muted">{party.holds}</p>
      ) : null}

      {party?.wdtk ? (
        <a
          className="text-sm text-accent underline-offset-4 hover:underline"
          href={party.wdtk}
          target="_blank"
          rel="noreferrer"
        >
          WhatDoTheyKnow
        </a>
      ) : null}

      {party?.emails?.length ? (
        <p className="text-xs leading-5 text-muted">{party.emails.join(" · ")}</p>
      ) : null}

      {node.description ? (
        <p className="text-pretty text-sm leading-6 text-muted">{node.description}</p>
      ) : null}

      {node.how ? (
        <section>
          <h3 className="text-xs tracking-wide text-accent">How to</h3>
          <p className="mt-2 text-pretty text-sm leading-6 text-fg">{node.how}</p>
        </section>
      ) : null}

      {node.note ? (
        <p className="text-pretty text-sm leading-6 text-status-awaiting">{node.note}</p>
      ) : null}

      {node.deadline ? (
        <p className="text-sm text-status-awaiting">Deadline {node.deadline}</p>
      ) : null}

      {node.contact ? (
        <p className="text-sm text-muted">
          Contact{" "}
          <a className="text-accent underline-offset-4 hover:underline" href={`mailto:${node.contact}`}>
            {node.contact}
          </a>
        </p>
      ) : null}

      {node.policyUrl ? (
        <a
          className="inline-flex min-h-11 items-center gap-2 text-sm text-accent underline-offset-4 hover:underline"
          href={node.policyUrl}
          target="_blank"
          rel="noreferrer"
        >
          Procedure / policy
          <ExternalLink className="size-3.5" />
        </a>
      ) : null}

      {party?.policies?.length ? (
        <section>
          <h3 className="text-xs tracking-wide text-accent">Policy links</h3>
          <ul className="mt-2 space-y-1">
            {party.policies.map((p) => (
              <li key={p.url}>
                <a
                  className="inline-flex min-h-11 items-center gap-2 text-sm text-fg underline-offset-4 hover:underline"
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {p.label}
                  <ExternalLink className="size-3.5 text-muted" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {node.emails.length ? (
        <section>
          <h3 className="text-xs tracking-wide text-accent">Correspondence</h3>
          <ol className="mt-2">
            {node.emails.map((e, i) => (
              <Mail key={`${e.date}-${e.subject}-${i}`} hit={e} />
            ))}
          </ol>
        </section>
      ) : (
        <p className="text-sm text-muted">No email on this rung yet — still remaining.</p>
      )}
    </aside>
  );
}
