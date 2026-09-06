import { PARTIES, SNAPSHOT_DATE } from "./parties";
import {
  isDepleted,
  isInFlight,
  type Avenue,
  type EmailHit,
  type Party,
  type Sector,
  type Status,
  type TreeNode,
} from "./types";

export const SECTOR_LABEL: Record<Sector, string> = {
  heritage: "heritage",
  archive: "archives",
  land: "land · planning · title",
  justice: "justice · police · courts",
  health: "health · deaths",
  elected: "elected · political",
  regulator: "regulators · ombudsmen",
  utility: "utilities",
  media: "media",
  private: "private · defendants",
};

const SECTOR_ORDER: Sector[] = [
  "heritage",
  "archive",
  "land",
  "justice",
  "health",
  "elected",
  "regulator",
  "utility",
  "media",
  "private",
];

function rollup(children: TreeNode[]): { remaining: number; depleted: number; status: Status } {
  if (!children.length) return { remaining: 0, depleted: 0, status: "open" };
  let remaining = 0;
  let depleted = 0;
  for (const c of children) {
    remaining += c.remaining;
    depleted += c.depleted;
  }
  const statuses = children.map((c) => c.status);
  let status: Status = "open";
  if (children.every((c) => isDepleted(c.status))) status = "exhausted";
  else if (statuses.includes("complaint")) status = "complaint";
  else if (statuses.includes("review")) status = "review";
  else if (statuses.includes("awaiting")) status = "awaiting";
  else if (statuses.includes("replied")) status = "replied";
  else if (statuses.includes("sent")) status = "sent";
  else if (statuses.includes("bounce")) status = "bounce";
  else if (statuses.includes("open")) status = "open";
  return { remaining, depleted, status };
}

function avenueNode(a: Avenue, partyId: string, parentPath: string, sector?: Party["sector"]): TreeNode {
  const path = `${parentPath}/${a.id}`;
  const children = (a.children ?? []).map((c) => avenueNode(c, partyId, path, sector));
  const isLeaf = children.length === 0;
  const remaining = isLeaf ? (isDepleted(a.status) ? 0 : 1) : children.reduce((n, c) => n + c.remaining, 0);
  const depleted = isLeaf ? (isDepleted(a.status) ? 1 : 0) : children.reduce((n, c) => n + c.depleted, 0);
  const rolled = children.length ? rollup(children) : { remaining, depleted, status: a.status };
  return {
    id: a.id,
    path,
    label: a.label,
    kind: a.kind,
    status: a.status,
    emails: a.emails ?? [],
    description: a.description,
    how: a.how,
    policyUrl: a.policyUrl,
    contact: a.contact,
    reference: a.reference,
    note: a.note,
    deadline: a.deadline,
    remaining: children.length ? rolled.remaining : remaining,
    depleted: children.length ? rolled.depleted : depleted,
    children,
    partyId,
    sector,
  };
}

function partyNode(p: Party): TreeNode {
  const children = p.avenues.map((a) => avenueNode(a, p.id, p.id, p.sector));
  const rolled = rollup(children);
  const emails: EmailHit[] = [];
  const walk = (n: TreeNode) => {
    emails.push(...n.emails);
    n.children.forEach(walk);
  };
  children.forEach(walk);
  emails.sort((a, b) => a.date.localeCompare(b.date));
  return {
    id: p.id,
    path: p.id,
    label: p.shortName,
    status: rolled.status,
    emails,
    description: p.role,
    note: p.notes,
    remaining: rolled.remaining,
    depleted: rolled.depleted,
    children,
    partyId: p.id,
    sector: p.sector,
  };
}

function sectorNode(sector: Sector, parties: TreeNode[]): TreeNode {
  const rolled = rollup(parties);
  return {
    id: sector,
    path: `sector:${sector}`,
    label: SECTOR_LABEL[sector],
    status: rolled.status,
    emails: [],
    remaining: rolled.remaining,
    depleted: rolled.depleted,
    children: parties,
    sector,
  };
}

export type CaseTree = {
  root: TreeNode;
  parties: Party[];
  partyNodes: TreeNode[];
  remaining: number;
  depleted: number;
  inFlight: number;
  snapshotDate: string;
};

let cached: CaseTree | null = null;

export function buildCaseTree(): CaseTree {
  if (cached) return cached;
  const partyNodes = PARTIES.map(partyNode);
  const bySector = new Map<Sector, TreeNode[]>();
  for (const n of partyNodes) {
    const s = n.sector ?? "private";
    const list = bySector.get(s) ?? [];
    list.push(n);
    bySector.set(s, list);
  }
  const sectorNodes = SECTOR_ORDER.filter((s) => bySector.has(s)).map((s) =>
    sectorNode(s, bySector.get(s) ?? []),
  );
  const rolled = rollup(sectorNodes);
  let inFlight = 0;
  const count = (n: TreeNode) => {
    if (!n.children.length && isInFlight(n.status)) inFlight += 1;
    n.children.forEach(count);
  };
  partyNodes.forEach(count);
  cached = {
    root: {
      id: "root",
      path: "root",
      label: "Great House Farm / BP v Buckler 1987",
      status: rolled.status,
      emails: [],
      remaining: rolled.remaining,
      depleted: rolled.depleted,
      children: sectorNodes,
    },
    parties: PARTIES,
    partyNodes,
    remaining: rolled.remaining,
    depleted: rolled.depleted,
    inFlight,
    snapshotDate: SNAPSHOT_DATE,
  };
  return cached;
}

export function findNode(path: string): TreeNode | undefined {
  const tree = buildCaseTree();
  if (path === "root" || path === "") return tree.root;
  const walk = (n: TreeNode): TreeNode | undefined => {
    if (n.path === path) return n;
    for (const c of n.children) {
      const hit = walk(c);
      if (hit) return hit;
    }
    return undefined;
  };
  return walk(tree.root);
}

export function listRemaining(filter?: { partyId?: string; sector?: string }): TreeNode[] {
  const tree = buildCaseTree();
  const out: TreeNode[] = [];
  const walk = (n: TreeNode) => {
    if (
      !n.children.length &&
      !isDepleted(n.status) &&
      n.id !== "root" &&
      !n.path.startsWith("sector:") &&
      (!filter?.partyId || n.partyId === filter.partyId) &&
      (!filter?.sector || n.sector === filter.sector)
    ) {
      out.push(n);
    }
    n.children.forEach(walk);
  };
  tree.partyNodes.forEach(walk);
  return out;
}

export function searchTree(query: string): TreeNode[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const tree = buildCaseTree();
  const out: TreeNode[] = [];
  const walk = (n: TreeNode) => {
    const blob = [
      n.label,
      n.description,
      n.how,
      n.note,
      n.reference,
      n.contact,
      ...n.emails.map((e) => `${e.subject} ${e.from} ${e.to} ${e.preview}`),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (blob.includes(q) && n.id !== "root" && !n.path.startsWith("sector:")) out.push(n);
    n.children.forEach(walk);
  };
  walk(tree.root);
  return out;
}

export function partyById(id: string): Party | undefined {
  return PARTIES.find((p) => p.id === id);
}

export type ExhaustionSummary = {
  snapshotDate: string;
  parties: number;
  remaining: number;
  depleted: number;
  inFlight: number;
  bySector: Record<string, { remaining: number; depleted: number; parties: number }>;
  nextActions: { path: string; party: string; label: string; status: Status; how: string }[];
};

export function exhaustionSummary(): ExhaustionSummary {
  const tree = buildCaseTree();
  const bySector: ExhaustionSummary["bySector"] = {};
  for (const p of tree.parties) {
    const node = tree.partyNodes.find((n) => n.id === p.id);
    if (!node) continue;
    const slot = (bySector[p.sector] ??= { remaining: 0, depleted: 0, parties: 0 });
    slot.remaining += node.remaining;
    slot.depleted += node.depleted;
    slot.parties += 1;
  }
  const remainingLeaves = listRemaining();
  const priority = (s: Status) =>
    ({ awaiting: 0, review: 1, sent: 2, replied: 3, complaint: 4, open: 5, bounce: 6, exhausted: 7 })[s];
  remainingLeaves.sort((a, b) => priority(a.status) - priority(b.status));
  const nextActions = remainingLeaves.slice(0, 12).map((n) => ({
    path: n.path,
    party: partyById(n.partyId ?? "")?.shortName ?? n.partyId ?? "",
    label: n.label,
    status: n.status,
    how: n.how ?? "",
  }));
  return {
    snapshotDate: tree.snapshotDate,
    parties: tree.parties.length,
    remaining: tree.remaining,
    depleted: tree.depleted,
    inFlight: tree.inFlight,
    bySector,
    nextActions,
  };
}

export function flattenLeaves(n: TreeNode): TreeNode[] {
  if (!n.children.length) return [n];
  return n.children.flatMap(flattenLeaves);
}
