import { useMemo } from "react";
import { buildCaseTree } from "@/lib/case/tree";
import { useTreeStore, type Filter } from "@/lib/case/store";
import {
  isDepleted,
  isInFlight,
  STATUS_LABEL,
  type Status,
  type TreeNode,
} from "@/lib/case/types";
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

function matchesFilter(n: TreeNode, filter: Filter, q: string, status: Status | "any"): boolean {
  if (status !== "any" && n.status !== status && n.children.length === 0) return false;
  if (filter === "remaining" && n.children.length === 0 && isDepleted(n.status)) return false;
  if (filter === "depleted" && n.children.length === 0 && !isDepleted(n.status)) return false;
  if (filter === "flight" && n.children.length === 0 && !isInFlight(n.status)) return false;
  if (q) {
    const blob = [
      n.label,
      n.description,
      n.note,
      n.reference,
      ...n.emails.map((e) => `${e.subject} ${e.from} ${e.to}`),
    ]
      .join(" ")
      .toLowerCase();
    if (n.children.length === 0 && !blob.includes(q)) return false;
  }
  return true;
}

function visibleChildren(
  n: TreeNode,
  filter: Filter,
  q: string,
  status: Status | "any",
): TreeNode[] {
  return n.children.filter((c) => {
    if (!matchesFilter(c, filter, q, status)) {
      if (!c.children.length) return false;
    }
    if (c.children.length) {
      const vis = visibleChildren(c, filter, q, status);
      if (!vis.length && !matchesFilter(c, filter, q, status)) return false;
      if (filter !== "all" && !vis.length && c.children.length) return false;
    }
    return true;
  });
}

function tooltipFor(n: TreeNode): string {
  const last = n.emails[n.emails.length - 1];
  if (!last) return `${n.label} · ${STATUS_LABEL[n.status]} · no email yet`;
  return `${last.date.slice(0, 10)} · ${last.subject}\n${last.direction === "out" ? "→" : "←"} ${last.direction === "out" ? last.to : last.from}`;
}

function Row({
  node,
  prefix,
  isLast,
  depth,
}: {
  node: TreeNode;
  prefix: string;
  isLast: boolean;
  depth: number;
}) {
  const expanded = useTreeStore((s) => s.expanded[node.path] === true || (s.expanded[node.path] == null && depth < 1));
  const selected = useTreeStore((s) => s.selected === node.path);
  const filter = useTreeStore((s) => s.filter);
  const query = useTreeStore((s) => s.query);
  const statusFilter = useTreeStore((s) => s.statusFilter);
  const activate = useTreeStore((s) => s.activate);
  const setOpen = useTreeStore((s) => s.setOpen);
  const select = useTreeStore((s) => s.select);

  const kids = useMemo(
    () => visibleChildren(node, filter, query.trim().toLowerCase(), statusFilter),
    [node, filter, query, statusFilter],
  );
  const hasKids = kids.length > 0;
  const branch = depth === 0 ? "" : isLast ? "└── " : "├── ";
  const childPrefix = depth === 0 ? "" : prefix + (isLast ? "    " : "│   ");
  const glyph = hasKids ? (expanded ? "▾" : "▸") : "·";
  const last = node.emails.at(-1);

  return (
    <div>
      <div
        role="treeitem"
        aria-expanded={hasKids ? expanded : undefined}
        aria-selected={selected}
        tabIndex={0}
        data-active={selected ? "true" : "false"}
        data-path={node.path}
        data-expanded={hasKids ? (expanded ? "true" : "false") : undefined}
        title={tooltipFor(node)}
        onClick={() => {
          activate(node.path);
        }}
        onKeyDown={(ev) => {
          if (ev.key === "Enter" || ev.key === " ") {
            ev.preventDefault();
            activate(node.path);
          }
          if (ev.key === "ArrowRight" && hasKids) {
            ev.preventDefault();
            select(node.path);
            setOpen(node.path, true);
          }
          if (ev.key === "ArrowLeft" && hasKids) {
            ev.preventDefault();
            setOpen(node.path, false);
          }
        }}
        className={cn(
          "tree-row relative flex min-h-11 cursor-pointer items-start gap-0 px-1 py-1.5 text-sm leading-5",
          selected && "bg-elevated",
        )}
      >
        <span className="shrink-0 select-none text-faint" aria-hidden>
          {prefix}
          {branch}
        </span>
        <span
          aria-hidden
          className={cn(
            "mr-1 inline-flex size-9 shrink-0 items-center justify-center rounded-md text-base leading-none",
            hasKids ? "text-accent" : "text-faint",
          )}
        >
          {glyph}
        </span>
        <span className={cn("min-w-0 flex-1 pt-1.5", STATUS_CLASS[node.status])}>
          <span className="whitespace-pre-wrap break-words">
            {node.label}
            {node.reference ? (
              <span className="text-faint">{`  [${node.reference}]`}</span>
            ) : null}
            <span className="ml-2 text-xs tracking-wide text-faint">
              {STATUS_LABEL[node.status]}
            </span>
          </span>
          {last ? (
            <span className="mt-0.5 block truncate text-xs text-muted">
              {last.date.slice(0, 10)} · {last.subject}
            </span>
          ) : null}
          {last ? (
            <span
              className="tree-tip pointer-events-none absolute left-4 right-2 top-full z-20 mt-1 max-w-md rounded-md border border-line bg-elevated px-3 py-2 text-xs leading-5 text-fg shadow-lg"
              aria-hidden="true"
            >
              <span className="block tabular-nums text-muted">{last.date.slice(0, 10)}</span>
              <span className="mt-0.5 block text-fg">{last.subject}</span>
              <span className="mt-0.5 block text-muted">
                {last.direction === "out" ? `→ ${last.to}` : `← ${last.from}`}
              </span>
            </span>
          ) : null}
        </span>
      </div>
      {hasKids && expanded
        ? kids.map((c, i) => (
            <Row
              key={c.path}
              node={c}
              prefix={childPrefix}
              isLast={i === kids.length - 1}
              depth={depth + 1}
            />
          ))
        : null}
    </div>
  );
}

export function AsciiTree() {
  const tree = buildCaseTree();
  return (
    <div
      role="tree"
      aria-label="Enquiry tree"
      className="rounded-lg border border-line bg-surface px-1 py-2"
    >
      <Row node={tree.root} prefix="" isLast depth={0} />
    </div>
  );
}
