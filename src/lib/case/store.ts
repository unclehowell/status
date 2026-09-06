import { create } from "zustand";
import { persist } from "zustand/middleware";
import { buildCaseTree, findNode } from "./tree";
import type { Status, TreeNode } from "./types";

export type Filter = "all" | "remaining" | "flight" | "depleted";

type State = {
  expanded: Record<string, boolean>;
  selected: string | null;
  filter: Filter;
  query: string;
  statusFilter: Status | "any";
  toggle: (path: string) => void;
  expandTo: (path: string) => void;
  expandAll: (open: boolean) => void;
  select: (path: string | null) => void;
  activate: (path: string) => void;
  setOpen: (path: string, open: boolean) => void;
  setFilter: (f: Filter) => void;
  setQuery: (q: string) => void;
  setStatusFilter: (s: Status | "any") => void;
};

function defaultExpanded(): Record<string, boolean> {
  const tree = buildCaseTree();
  const out: Record<string, boolean> = { root: true };
  for (const sector of tree.root.children) {
    out[sector.path] = true;
    for (const p of sector.children) {
      out[p.path] = true;
    }
  }
  return out;
}

function markAncestors(path: string, next: Record<string, boolean>, includeSelf: boolean) {
  const tree = buildCaseTree();
  const walk = (n: TreeNode, trail: string[]): boolean => {
    if (n.path === path) {
      for (const p of trail) next[p] = true;
      if (includeSelf) next[n.path] = true;
      return true;
    }
    for (const c of n.children) {
      if (walk(c, [...trail, n.path])) return true;
    }
    return false;
  };
  walk(tree.root, []);
  next.root = true;
}

export const useTreeStore = create<State>()(
  persist(
    (set) => ({
      expanded: defaultExpanded(),
      selected: null,
      filter: "all",
      query: "",
      statusFilter: "any",
      toggle: (path) =>
        set((s) => ({
          expanded: { ...s.expanded, [path]: !s.expanded[path] },
        })),
      setOpen: (path, open) =>
        set((s) => ({
          expanded: { ...s.expanded, [path]: open },
        })),
      expandTo: (path) =>
        set((s) => {
          const next = { ...s.expanded };
          markAncestors(path, next, true);
          return { expanded: next, selected: path };
        }),
      expandAll: (open) => {
        const tree = buildCaseTree();
        const next: Record<string, boolean> = { root: true };
        const walk = (n: TreeNode) => {
          if (n.children.length) next[n.path] = open;
          n.children.forEach(walk);
        };
        walk(tree.root);
        next.root = true;
        set({ expanded: next });
      },
      select: (path) => {
        if (!path) {
          set({ selected: null });
          return;
        }
        set((s) => {
          const next = { ...s.expanded };
          markAncestors(path, next, false);
          return { selected: path, expanded: next };
        });
      },
      activate: (path) =>
        set((s) => {
          const node = findNode(path);
          const next = { ...s.expanded };
          markAncestors(path, next, false);
          if (node && node.children.length > 0) {
            const isOpen = s.expanded[path] === true;
            if (!isOpen) next[path] = true;
            else if (s.selected === path) next[path] = false;
          }
          return { selected: path, expanded: next };
        }),
      setFilter: (filter) => set({ filter }),
      setQuery: (query) => set({ query }),
      setStatusFilter: (statusFilter) => set({ statusFilter }),
    }),
    {
      name: "enquiry-tree-v4",
      partialize: (s) => ({
        filter: s.filter,
        query: s.query,
        statusFilter: s.statusFilter,
      }),
    },
  ),
);
