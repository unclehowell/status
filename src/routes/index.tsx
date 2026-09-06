import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AsciiTree } from "@/components/ascii-tree";
import { DetailPanel } from "@/components/detail-panel";
import { WebMcpTools } from "@/components/webmcp-tools";
import { buildCaseTree, exhaustionSummary } from "@/lib/case/tree";
import { useTreeStore, type Filter } from "@/lib/case/store";
import { STATUS_LABEL, type Status } from "@/lib/case/types";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/")({ component: Home });

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "remaining", label: "Remaining" },
  { id: "flight", label: "In flight" },
  { id: "depleted", label: "Depleted" },
];

const STATUSES: (Status | "any")[] = [
  "any",
  "open",
  "sent",
  "awaiting",
  "replied",
  "review",
  "complaint",
  "bounce",
  "exhausted",
];

function Home() {
  const tree = buildCaseTree();
  const summary = useMemo(() => exhaustionSummary(), []);
  const filter = useTreeStore((s) => s.filter);
  const setFilter = useTreeStore((s) => s.setFilter);
  const query = useTreeStore((s) => s.query);
  const setQuery = useTreeStore((s) => s.setQuery);
  const statusFilter = useTreeStore((s) => s.statusFilter);
  const setStatusFilter = useTreeStore((s) => s.setStatusFilter);
  const expandAll = useTreeStore((s) => s.expandAll);
  const pct = tree.remaining + tree.depleted
    ? Math.round((tree.depleted / (tree.remaining + tree.depleted)) * 100)
    : 0;

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <WebMcpTools />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Dataset",
            name: "Enquiry — Great House Farm",
            description:
              "FOI, GDPR and SAR enquiry tree for every party in dialogue on BP Properties Ltd v Buckler / Great House Farm, Llandough.",
            dateModified: tree.snapshotDate,
            url: "/api/tree.json",
            keywords: [
              "FOI",
              "SAR",
              "GDPR",
              "Cadw",
              "Llandough",
              "Buckler",
              "Williams",
              "Great House Farm",
            ],
          }),
        }}
      />

      <header className="border-b border-line px-4 py-5 sm:px-6">
        <p className="text-xs tracking-[0.18em] text-muted">TY MAWR · LLANDOUGH · 1667–1988</p>
        <h1 className="mt-2 text-2xl font-medium tracking-tight text-accent sm:text-3xl">
          Enquiry
        </h1>
        <p className="mt-2 hidden max-w-2xl text-pretty text-sm leading-6 text-muted sm:block">
          Each party opens at enquiry. Expand that for foi, gdpr and sar. Expand each of those for
          internal review. Colour is the live email status. Legal action is held until remaining
          avenues are gone.
        </p>
        <p className="mt-2 max-w-2xl text-pretty text-sm leading-6 text-muted sm:hidden">
          Tap enquiry → foi / gdpr / sar → internal review.
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Parties" value={String(tree.parties.length)} />
          <Stat label="Remaining" value={String(tree.remaining)} tone="text-status-open" />
          <Stat label="In flight" value={String(tree.inFlight)} tone="text-status-awaiting" />
          <Stat label="Depleted" value={`${tree.depleted}  ${pct}%`} tone="text-status-exhausted" />
        </dl>
      </header>

      <section className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:px-6">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "min-h-11 rounded-full border px-4 text-sm",
                filter === f.id
                  ? "border-accent bg-accent text-accent-fg"
                  : "border-line bg-surface text-fg",
              )}
            >
              {f.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => expandAll(true)}
            className="min-h-11 rounded-full border border-line bg-surface px-4 text-sm text-muted"
          >
            Expand
          </button>
          <button
            type="button"
            onClick={() => expandAll(false)}
            className="min-h-11 rounded-full border border-line bg-surface px-4 text-sm text-muted"
          >
            Collapse
          </button>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="q">
            Search
          </label>
          <input
            id="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search parties, refs, subjects…"
            className="min-h-11 flex-1 rounded-md border border-line bg-elevated px-3 text-sm text-fg outline-none placeholder:text-faint focus:border-accent"
          />
          <label className="sr-only" htmlFor="st">
            Status
          </label>
          <select
            id="st"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Status | "any")}
            className="min-h-11 rounded-md border border-line bg-elevated px-3 text-sm text-fg"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "any" ? "Any status" : STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <Legend />
      </section>

      <main className="grid gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)] lg:px-6">
        <div className="max-h-[70dvh] overflow-y-auto overscroll-contain lg:max-h-[calc(100dvh-8rem)]">
          <AsciiTree />
        </div>
        <DetailPanel />
      </main>

      <section className="border-t border-line px-4 py-6 sm:px-6">
        <h2 className="text-sm font-medium text-accent">Next remaining actions</h2>
        <ol className="mt-3 space-y-2 text-sm leading-6">
          {summary.nextActions.map((a, i) => (
            <li key={a.path}>
              <button
                type="button"
                onClick={() => useTreeStore.getState().expandTo(a.path)}
                className="text-left text-status-open underline-offset-4 hover:underline"
              >
                {i + 1}. {a.party} — {a.label}
              </button>
              <span className="ml-2 text-xs text-faint">{STATUS_LABEL[a.status]}</span>
            </li>
          ))}
        </ol>
        <p className="mt-6 max-w-2xl text-pretty text-xs leading-5 text-muted">
          Snapshot {tree.snapshotDate} from Gmail correspondence on the Williams/Buckler · BP ·
          Llandough matter. Agent endpoints: /api/tree.json · /api/remaining.json ·
          /api/summary.json · /llms.txt. WebMCP tools register on this page as document.modelContext.
        </p>
      </section>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-md border border-line bg-surface px-3 py-3">
      <dt className="text-[11px] tracking-wide text-muted">{label}</dt>
      <dd className={cn("mt-1 text-lg tabular-nums", tone ?? "text-fg")}>{value}</dd>
    </div>
  );
}

function Legend() {
  const items: { s: Status; label: string }[] = [
    { s: "open", label: "remaining" },
    { s: "sent", label: "sent" },
    { s: "awaiting", label: "awaiting" },
    { s: "replied", label: "replied" },
    { s: "review", label: "review" },
    { s: "complaint", label: "complaint" },
    { s: "exhausted", label: "depleted" },
    { s: "bounce", label: "bounce" },
  ];
  const cls: Record<Status, string> = {
    open: "text-status-open",
    sent: "text-status-sent",
    awaiting: "text-status-awaiting",
    replied: "text-status-replied",
    review: "text-status-review",
    complaint: "text-status-complaint",
    exhausted: "text-status-exhausted",
    bounce: "text-status-bounce",
  };
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
      {items.map((it) => (
        <li key={it.s} className={cls[it.s]}>
          ▢ {it.label}
        </li>
      ))}
    </ul>
  );
}
