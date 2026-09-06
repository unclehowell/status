import { i as __toESM } from "../_runtime.mjs";
import { L as require_react, v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as ExternalLink } from "../_libs/lucide-react.mjs";
import { a as listRemaining, c as STATUS_LABEL, i as findNode, l as isDepleted, n as buildCaseTree, o as partyById, r as exhaustionSummary, s as searchTree, u as isInFlight } from "./router-MYX0bFUL.mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-GRICJizB.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function defaultExpanded() {
	const tree = buildCaseTree();
	const out = { root: true };
	for (const sector of tree.root.children) {
		out[sector.path] = true;
		for (const p of sector.children) out[p.path] = true;
	}
	return out;
}
function markAncestors(path, next, includeSelf) {
	const tree = buildCaseTree();
	const walk = (n, trail) => {
		if (n.path === path) {
			for (const p of trail) next[p] = true;
			if (includeSelf) next[n.path] = true;
			return true;
		}
		for (const c of n.children) if (walk(c, [...trail, n.path])) return true;
		return false;
	};
	walk(tree.root, []);
	next.root = true;
}
var useTreeStore = create()(persist((set) => ({
	expanded: defaultExpanded(),
	selected: null,
	filter: "all",
	query: "",
	statusFilter: "any",
	toggle: (path) => set((s) => ({ expanded: {
		...s.expanded,
		[path]: !s.expanded[path]
	} })),
	setOpen: (path, open) => set((s) => ({ expanded: {
		...s.expanded,
		[path]: open
	} })),
	expandTo: (path) => set((s) => {
		const next = { ...s.expanded };
		markAncestors(path, next, true);
		return {
			expanded: next,
			selected: path
		};
	}),
	expandAll: (open) => {
		const tree = buildCaseTree();
		const next = { root: true };
		const walk = (n) => {
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
			return {
				selected: path,
				expanded: next
			};
		});
	},
	activate: (path) => set((s) => {
		const node = findNode(path);
		const next = { ...s.expanded };
		markAncestors(path, next, false);
		if (node && node.children.length > 0) {
			if (!(s.expanded[path] === true)) next[path] = true;
			else if (s.selected === path) next[path] = false;
		}
		return {
			selected: path,
			expanded: next
		};
	}),
	setFilter: (filter) => set({ filter }),
	setQuery: (query) => set({ query }),
	setStatusFilter: (statusFilter) => set({ statusFilter })
}), {
	name: "enquiry-tree-v4",
	partialize: (s) => ({
		filter: s.filter,
		query: s.query,
		statusFilter: s.statusFilter
	})
}));
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var STATUS_CLASS$1 = {
	open: "text-status-open",
	sent: "text-status-sent",
	awaiting: "text-status-awaiting",
	replied: "text-status-replied",
	review: "text-status-review",
	complaint: "text-status-complaint",
	exhausted: "text-status-exhausted",
	bounce: "text-status-bounce"
};
function matchesFilter(n, filter, q, status) {
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
			...n.emails.map((e) => `${e.subject} ${e.from} ${e.to}`)
		].join(" ").toLowerCase();
		if (n.children.length === 0 && !blob.includes(q)) return false;
	}
	return true;
}
function visibleChildren(n, filter, q, status) {
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
function tooltipFor(n) {
	const last = n.emails[n.emails.length - 1];
	if (!last) return `${n.label} · ${STATUS_LABEL[n.status]} · no email yet`;
	return `${last.date.slice(0, 10)} · ${last.subject}\n${last.direction === "out" ? "→" : "←"} ${last.direction === "out" ? last.to : last.from}`;
}
function Row({ node, prefix, isLast, depth }) {
	const expanded = useTreeStore((s) => s.expanded[node.path] === true || s.expanded[node.path] == null && depth < 1);
	const selected = useTreeStore((s) => s.selected === node.path);
	const filter = useTreeStore((s) => s.filter);
	const query = useTreeStore((s) => s.query);
	const statusFilter = useTreeStore((s) => s.statusFilter);
	const activate = useTreeStore((s) => s.activate);
	const setOpen = useTreeStore((s) => s.setOpen);
	const select = useTreeStore((s) => s.select);
	const kids = (0, import_react.useMemo)(() => visibleChildren(node, filter, query.trim().toLowerCase(), statusFilter), [
		node,
		filter,
		query,
		statusFilter
	]);
	const hasKids = kids.length > 0;
	const branch = depth === 0 ? "" : isLast ? "└── " : "├── ";
	const childPrefix = depth === 0 ? "" : prefix + (isLast ? "    " : "│   ");
	const glyph = hasKids ? expanded ? "▾" : "▸" : "·";
	const last = node.emails.at(-1);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		role: "treeitem",
		"aria-expanded": hasKids ? expanded : void 0,
		"aria-selected": selected,
		tabIndex: 0,
		"data-active": selected ? "true" : "false",
		"data-path": node.path,
		"data-expanded": hasKids ? expanded ? "true" : "false" : void 0,
		title: tooltipFor(node),
		onClick: () => {
			activate(node.path);
		},
		onKeyDown: (ev) => {
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
		},
		className: cn("tree-row relative flex min-h-11 cursor-pointer items-start gap-0 px-1 py-1.5 text-sm leading-5", selected && "bg-elevated"),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "shrink-0 select-none text-faint",
				"aria-hidden": true,
				children: [prefix, branch]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				"aria-hidden": true,
				className: cn("mr-1 inline-flex size-9 shrink-0 items-center justify-center rounded-md text-base leading-none", hasKids ? "text-accent" : "text-faint"),
				children: glyph
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: cn("min-w-0 flex-1 pt-1.5", STATUS_CLASS$1[node.status]),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "whitespace-pre-wrap break-words",
						children: [
							node.label,
							node.reference ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-faint",
								children: `  [${node.reference}]`
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ml-2 text-xs tracking-wide text-faint",
								children: STATUS_LABEL[node.status]
							})
						]
					}),
					last ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "mt-0.5 block truncate text-xs text-muted",
						children: [
							last.date.slice(0, 10),
							" · ",
							last.subject
						]
					}) : null,
					last ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "tree-tip pointer-events-none absolute left-4 right-2 top-full z-20 mt-1 max-w-md rounded-md border border-line bg-elevated px-3 py-2 text-xs leading-5 text-fg shadow-lg",
						"aria-hidden": "true",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block tabular-nums text-muted",
								children: last.date.slice(0, 10)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-0.5 block text-fg",
								children: last.subject
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-0.5 block text-muted",
								children: last.direction === "out" ? `→ ${last.to}` : `← ${last.from}`
							})
						]
					}) : null
				]
			})
		]
	}), hasKids && expanded ? kids.map((c, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
		node: c,
		prefix: childPrefix,
		isLast: i === kids.length - 1,
		depth: depth + 1
	}, c.path)) : null] });
}
function AsciiTree() {
	const tree = buildCaseTree();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		role: "tree",
		"aria-label": "Enquiry tree",
		className: "rounded-lg border border-line bg-surface px-1 py-2",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
			node: tree.root,
			prefix: "",
			isLast: true,
			depth: 0
		})
	});
}
var STATUS_CLASS = {
	open: "text-status-open",
	sent: "text-status-sent",
	awaiting: "text-status-awaiting",
	replied: "text-status-replied",
	review: "text-status-review",
	complaint: "text-status-complaint",
	exhausted: "text-status-exhausted",
	bounce: "text-status-bounce"
};
function Mail({ hit }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: "border-l-2 border-line py-2 pl-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-baseline gap-x-2 text-xs text-muted",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "tabular-nums text-fg",
						children: hit.date.slice(0, 10)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: hit.direction === "out" ? "out" : "in" }),
					hit.reference ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-faint",
						children: hit.reference
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1 text-sm text-fg",
				children: hit.subject
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-0.5 text-xs text-muted",
				children: hit.direction === "out" ? `to ${hit.to}` : `from ${hit.from}`
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-pretty text-xs leading-5 text-muted",
				children: hit.preview
			})
		]
	});
}
function DetailPanel() {
	const selected = useTreeStore((s) => s.selected);
	const select = useTreeStore((s) => s.select);
	const node = selected ? findNode(selected) : null;
	const party = node?.partyId ? partyById(node.partyId) : void 0;
	if (!node || node.id === "root") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		id: "enquiry-detail",
		className: "flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 lg:sticky lg:top-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-sm font-medium text-accent",
			children: "Select a node"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-pretty text-sm leading-6 text-muted",
			children: "Tap a party, then enquiry → foi / gdpr / sar → internal review. Colour follows the emails. Last subject sits under each line."
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		id: "enquiry-detail",
		className: "flex max-h-[calc(100dvh-2rem)] flex-col gap-5 overflow-y-auto rounded-lg border border-line bg-surface p-4 lg:sticky lg:top-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-col gap-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: cn("text-xs tracking-wide", STATUS_CLASS[node.status]),
							children: [STATUS_LABEL[node.status], node.kind ? ` · ${node.kind.toUpperCase()}` : ""]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => select(null),
							className: "min-h-11 rounded-md border border-line px-3 text-xs text-muted lg:hidden",
							children: "Close"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-balance text-base font-medium leading-snug text-fg",
						children: node.label
					}),
					party ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted",
						children: [party.name, node.reference ? ` · ${node.reference}` : ""]
					}) : null
				]
			}),
			party?.holds ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-pretty text-sm leading-6 text-muted",
				children: party.holds
			}) : null,
			party?.wdtk ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				className: "text-sm text-accent underline-offset-4 hover:underline",
				href: party.wdtk,
				target: "_blank",
				rel: "noreferrer",
				children: "WhatDoTheyKnow"
			}) : null,
			party?.emails?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs leading-5 text-muted",
				children: party.emails.join(" · ")
			}) : null,
			node.description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-pretty text-sm leading-6 text-muted",
				children: node.description
			}) : null,
			node.how ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "text-xs tracking-wide text-accent",
				children: "How to"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-pretty text-sm leading-6 text-fg",
				children: node.how
			})] }) : null,
			node.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-pretty text-sm leading-6 text-status-awaiting",
				children: node.note
			}) : null,
			node.deadline ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-status-awaiting",
				children: ["Deadline ", node.deadline]
			}) : null,
			node.contact ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted",
				children: [
					"Contact",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						className: "text-accent underline-offset-4 hover:underline",
						href: `mailto:${node.contact}`,
						children: node.contact
					})
				]
			}) : null,
			node.policyUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
				className: "inline-flex min-h-11 items-center gap-2 text-sm text-accent underline-offset-4 hover:underline",
				href: node.policyUrl,
				target: "_blank",
				rel: "noreferrer",
				children: ["Procedure / policy", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "size-3.5" })]
			}) : null,
			party?.policies?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "text-xs tracking-wide text-accent",
				children: "Policy links"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-2 space-y-1",
				children: party.policies.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					className: "inline-flex min-h-11 items-center gap-2 text-sm text-fg underline-offset-4 hover:underline",
					href: p.url,
					target: "_blank",
					rel: "noreferrer",
					children: [p.label, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "size-3.5 text-muted" })]
				}) }, p.url))
			})] }) : null,
			node.emails.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "text-xs tracking-wide text-accent",
				children: "Correspondence"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "mt-2",
				children: node.emails.map((e, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { hit: e }, `${e.date}-${e.subject}-${i}`))
			})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "No email on this rung yet — still remaining."
			})
		]
	});
}
function json(data) {
	return { content: [{
		type: "text",
		text: JSON.stringify(data, null, 2)
	}] };
}
function WebMcpTools() {
	const expandTo = useTreeStore((s) => s.expandTo);
	const setQuery = useTreeStore((s) => s.setQuery);
	(0, import_react.useEffect)(() => {
		const tools = [
			{
				name: "list_parties",
				title: "List parties",
				description: "List every party in the Great House Farm / BP v Buckler 1987 exhaustion tree, with remaining vs depleted avenue counts.",
				inputSchema: {
					type: "object",
					properties: {},
					additionalProperties: false
				},
				execute: () => {
					return json(buildCaseTree().partyNodes.map((n) => ({
						id: n.id,
						name: partyById(n.id)?.name,
						sector: n.sector,
						remaining: n.remaining,
						depleted: n.depleted,
						status: n.status
					})));
				}
			},
			{
				name: "get_party",
				title: "Get party",
				description: "Full procedure tree, policies, contacts and correspondence for one party.",
				inputSchema: {
					type: "object",
					properties: { id: {
						type: "string",
						description: "Party id, e.g. cadw, vog, swp, hmlr"
					} },
					required: ["id"]
				},
				execute: ({ id }) => {
					const party = partyById(String(id ?? ""));
					if (!party) return json({ error: "unknown party" });
					return json(party);
				}
			},
			{
				name: "list_remaining",
				title: "List remaining avenues",
				description: "Every procedure step not yet depleted. Optional partyId or sector filter. Use this to see what is left before legal action.",
				inputSchema: {
					type: "object",
					properties: {
						partyId: { type: "string" },
						sector: {
							type: "string",
							enum: [
								"heritage",
								"land",
								"justice",
								"health",
								"elected",
								"regulator",
								"media",
								"utility",
								"private",
								"archive"
							]
						}
					}
				},
				execute: (input) => json(listRemaining({
					partyId: input.partyId ? String(input.partyId) : void 0,
					sector: input.sector ? String(input.sector) : void 0
				}).map((n) => ({
					path: n.path,
					party: partyById(n.partyId ?? "")?.shortName,
					label: n.label,
					status: n.status,
					how: n.how,
					contact: n.contact,
					policyUrl: n.policyUrl
				})))
			},
			{
				name: "get_avenue",
				title: "Get avenue",
				description: "One tree node by path (partyId/avenue/step), including emails.",
				inputSchema: {
					type: "object",
					properties: { path: {
						type: "string",
						description: "e.g. cadw/enquiry/foi/foi.review"
					} },
					required: ["path"]
				},
				execute: ({ path }) => json(findNode(String(path ?? "")) ?? { error: "not found" })
			},
			{
				name: "search_correspondence",
				title: "Search correspondence",
				description: "Search party names, avenue labels, email subjects and previews.",
				inputSchema: {
					type: "object",
					properties: { query: { type: "string" } },
					required: ["query"]
				},
				execute: ({ query }) => {
					const q = String(query ?? "");
					setQuery(q);
					return json(searchTree(q).map((n) => ({
						path: n.path,
						label: n.label,
						status: n.status,
						party: n.partyId
					})));
				}
			},
			{
				name: "expand_party",
				title: "Expand party in the UI",
				description: "Expand and select a party or avenue path in the visible tree.",
				inputSchema: {
					type: "object",
					properties: { path: { type: "string" } },
					required: ["path"]
				},
				execute: ({ path }) => {
					expandTo(String(path ?? ""));
					return json({
						ok: true,
						path
					});
				}
			},
			{
				name: "exhaustion_summary",
				title: "Exhaustion summary",
				description: "Counts remaining vs depleted, by sector, plus the next recommended actions before issuing proceedings.",
				inputSchema: {
					type: "object",
					properties: {}
				},
				execute: () => json(exhaustionSummary())
			}
		];
		window.__ENQUIRY_TOOLS = tools;
		const ctx = document.modelContext;
		if (ctx?.registerTool) Promise.all(tools.map((t) => ctx.registerTool({
			name: t.name,
			title: t.title,
			description: t.description,
			inputSchema: t.inputSchema,
			annotations: { readOnlyHint: t.name !== "expand_party" && t.name !== "search_correspondence" },
			execute: async (input) => t.execute(input ?? {})
		}))).catch(() => void 0);
	}, [expandTo, setQuery]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("script", {
		type: "application/json",
		id: "enquiry-webmcp",
		dangerouslySetInnerHTML: { __html: JSON.stringify({
			name: "enquiry",
			description: "FOI, GDPR and SAR enquiry tree for Great House Farm, Llandough / BP v Buckler 1987",
			apis: [
				"/api/tree.json",
				"/api/remaining.json",
				"/api/summary.json",
				"/api/parties/:id",
				"/llms.txt"
			],
			tools: [
				"list_parties",
				"get_party",
				"list_remaining",
				"get_avenue",
				"search_correspondence",
				"expand_party",
				"exhaustion_summary"
			]
		}) }
	});
}
var FILTERS = [
	{
		id: "all",
		label: "All"
	},
	{
		id: "remaining",
		label: "Remaining"
	},
	{
		id: "flight",
		label: "In flight"
	},
	{
		id: "depleted",
		label: "Depleted"
	}
];
var STATUSES = [
	"any",
	"open",
	"sent",
	"awaiting",
	"replied",
	"review",
	"complaint",
	"bounce",
	"exhausted"
];
function Home() {
	const tree = buildCaseTree();
	const summary = (0, import_react.useMemo)(() => exhaustionSummary(), []);
	const filter = useTreeStore((s) => s.filter);
	const setFilter = useTreeStore((s) => s.setFilter);
	const query = useTreeStore((s) => s.query);
	const setQuery = useTreeStore((s) => s.setQuery);
	const statusFilter = useTreeStore((s) => s.statusFilter);
	const setStatusFilter = useTreeStore((s) => s.setStatusFilter);
	const expandAll = useTreeStore((s) => s.expandAll);
	const pct = tree.remaining + tree.depleted ? Math.round(tree.depleted / (tree.remaining + tree.depleted) * 100) : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WebMcpTools, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("script", {
				type: "application/ld+json",
				dangerouslySetInnerHTML: { __html: JSON.stringify({
					"@context": "https://schema.org",
					"@type": "Dataset",
					name: "Enquiry — Great House Farm",
					description: "FOI, GDPR and SAR enquiry tree for every party in dialogue on BP Properties Ltd v Buckler / Great House Farm, Llandough.",
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
						"Great House Farm"
					]
				}) }
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "border-b border-line px-4 py-5 sm:px-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs tracking-[0.18em] text-muted",
						children: "TY MAWR · LLANDOUGH · 1667–1988"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-2 text-2xl font-medium tracking-tight text-accent sm:text-3xl",
						children: "Enquiry"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 hidden max-w-2xl text-pretty text-sm leading-6 text-muted sm:block",
						children: "Each party opens at enquiry. Expand that for foi, gdpr and sar. Expand each of those for internal review. Colour is the live email status. Legal action is held until remaining avenues are gone."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 max-w-2xl text-pretty text-sm leading-6 text-muted sm:hidden",
						children: "Tap enquiry → foi / gdpr / sar → internal review."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
						className: "mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Parties",
								value: String(tree.parties.length)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Remaining",
								value: String(tree.remaining),
								tone: "text-status-open"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "In flight",
								value: String(tree.inFlight),
								tone: "text-status-awaiting"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Depleted",
								value: `${tree.depleted}  ${pct}%`,
								tone: "text-status-exhausted"
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "flex flex-col gap-3 border-b border-line px-4 py-3 sm:px-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [
							FILTERS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setFilter(f.id),
								className: cn("min-h-11 rounded-full border px-4 text-sm", filter === f.id ? "border-accent bg-accent text-accent-fg" : "border-line bg-surface text-fg"),
								children: f.label
							}, f.id)),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => expandAll(true),
								className: "min-h-11 rounded-full border border-line bg-surface px-4 text-sm text-muted",
								children: "Expand"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => expandAll(false),
								className: "min-h-11 rounded-full border border-line bg-surface px-4 text-sm text-muted",
								children: "Collapse"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-2 sm:flex-row",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "sr-only",
								htmlFor: "q",
								children: "Search"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								id: "q",
								value: query,
								onChange: (e) => setQuery(e.target.value),
								placeholder: "Search parties, refs, subjects…",
								className: "min-h-11 flex-1 rounded-md border border-line bg-elevated px-3 text-sm text-fg outline-none placeholder:text-faint focus:border-accent"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "sr-only",
								htmlFor: "st",
								children: "Status"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								id: "st",
								value: statusFilter,
								onChange: (e) => setStatusFilter(e.target.value),
								className: "min-h-11 rounded-md border border-line bg-elevated px-3 text-sm text-fg",
								children: STATUSES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: s,
									children: s === "any" ? "Any status" : STATUS_LABEL[s]
								}, s))
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, {})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "grid gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)] lg:px-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "max-h-[70dvh] overflow-y-auto overscroll-contain lg:max-h-[calc(100dvh-8rem)]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AsciiTree, {})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DetailPanel, {})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "border-t border-line px-4 py-6 sm:px-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-medium text-accent",
						children: "Next remaining actions"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
						className: "mt-3 space-y-2 text-sm leading-6",
						children: summary.nextActions.map((a, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => useTreeStore.getState().expandTo(a.path),
							className: "text-left text-status-open underline-offset-4 hover:underline",
							children: [
								i + 1,
								". ",
								a.party,
								" — ",
								a.label
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "ml-2 text-xs text-faint",
							children: STATUS_LABEL[a.status]
						})] }, a.path))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-6 max-w-2xl text-pretty text-xs leading-5 text-muted",
						children: [
							"Snapshot ",
							tree.snapshotDate,
							" from Gmail correspondence on the Williams/Buckler · BP · Llandough matter. Agent endpoints: /api/tree.json · /api/remaining.json · /api/summary.json · /llms.txt. WebMCP tools register on this page as document.modelContext."
						]
					})
				]
			})
		]
	});
}
function Stat({ label, value, tone }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-md border border-line bg-surface px-3 py-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "text-[11px] tracking-wide text-muted",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: cn("mt-1 text-lg tabular-nums", tone ?? "text-fg"),
			children: value
		})]
	});
}
function Legend() {
	const items = [
		{
			s: "open",
			label: "remaining"
		},
		{
			s: "sent",
			label: "sent"
		},
		{
			s: "awaiting",
			label: "awaiting"
		},
		{
			s: "replied",
			label: "replied"
		},
		{
			s: "review",
			label: "review"
		},
		{
			s: "complaint",
			label: "complaint"
		},
		{
			s: "exhausted",
			label: "depleted"
		},
		{
			s: "bounce",
			label: "bounce"
		}
	];
	const cls = {
		open: "text-status-open",
		sent: "text-status-sent",
		awaiting: "text-status-awaiting",
		replied: "text-status-replied",
		review: "text-status-review",
		complaint: "text-status-complaint",
		exhausted: "text-status-exhausted",
		bounce: "text-status-bounce"
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "flex flex-wrap gap-x-4 gap-y-1 text-[11px]",
		children: items.map((it) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			className: cls[it.s],
			children: ["▢ ", it.label]
		}, it.s))
	});
}
//#endregion
export { Home as component };
