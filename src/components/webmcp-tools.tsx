import { useEffect } from "react";
import {
  buildCaseTree,
  exhaustionSummary,
  findNode,
  listRemaining,
  partyById,
  searchTree,
} from "@/lib/case/tree";
import { useTreeStore } from "@/lib/case/store";

type ToolDef = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (input: Record<string, unknown>) => Promise<unknown> | unknown;
};

declare global {
  interface Document {
    modelContext?: {
      registerTool: (tool: {
        name: string;
        title?: string;
        description: string;
        inputSchema: object;
        execute: (input: object) => Promise<unknown> | unknown;
        annotations?: { readOnlyHint?: boolean };
      }) => Promise<void>;
    };
  }
  interface Window {
    __ENQUIRY_TOOLS?: ToolDef[];
  }
}

function json(data: unknown) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

export function WebMcpTools() {
  const expandTo = useTreeStore((s) => s.expandTo);
  const setQuery = useTreeStore((s) => s.setQuery);

  useEffect(() => {
    const tools: ToolDef[] = [
      {
        name: "list_parties",
        title: "List parties",
        description:
          "List every party in the Great House Farm / BP v Buckler 1987 exhaustion tree, with remaining vs depleted avenue counts.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        execute: () => {
          const tree = buildCaseTree();
          return json(
            tree.partyNodes.map((n) => ({
              id: n.id,
              name: partyById(n.id)?.name,
              sector: n.sector,
              remaining: n.remaining,
              depleted: n.depleted,
              status: n.status,
            })),
          );
        },
      },
      {
        name: "get_party",
        title: "Get party",
        description: "Full procedure tree, policies, contacts and correspondence for one party.",
        inputSchema: {
          type: "object",
          properties: { id: { type: "string", description: "Party id, e.g. cadw, vog, swp, hmlr" } },
          required: ["id"],
        },
        execute: ({ id }) => {
          const party = partyById(String(id ?? ""));
          if (!party) return json({ error: "unknown party" });
          return json(party);
        },
      },
      {
        name: "list_remaining",
        title: "List remaining avenues",
        description:
          "Every procedure step not yet depleted. Optional partyId or sector filter. Use this to see what is left before legal action.",
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
                "archive",
              ],
            },
          },
        },
        execute: (input) =>
          json(
            listRemaining({
              partyId: input.partyId ? String(input.partyId) : undefined,
              sector: input.sector ? String(input.sector) : undefined,
            }).map((n) => ({
              path: n.path,
              party: partyById(n.partyId ?? "")?.shortName,
              label: n.label,
              status: n.status,
              how: n.how,
              contact: n.contact,
              policyUrl: n.policyUrl,
            })),
          ),
      },
      {
        name: "get_avenue",
        title: "Get avenue",
        description: "One tree node by path (partyId/avenue/step), including emails.",
        inputSchema: {
          type: "object",
          properties: { path: { type: "string", description: "e.g. cadw/enquiry/foi/foi.review" } },
          required: ["path"],
        },
        execute: ({ path }) => json(findNode(String(path ?? "")) ?? { error: "not found" }),
      },
      {
        name: "search_correspondence",
        title: "Search correspondence",
        description: "Search party names, avenue labels, email subjects and previews.",
        inputSchema: {
          type: "object",
          properties: { query: { type: "string" } },
          required: ["query"],
        },
        execute: ({ query }) => {
          const q = String(query ?? "");
          setQuery(q);
          return json(
            searchTree(q).map((n) => ({
              path: n.path,
              label: n.label,
              status: n.status,
              party: n.partyId,
            })),
          );
        },
      },
      {
        name: "expand_party",
        title: "Expand party in the UI",
        description: "Expand and select a party or avenue path in the visible tree.",
        inputSchema: {
          type: "object",
          properties: { path: { type: "string" } },
          required: ["path"],
        },
        execute: ({ path }) => {
          expandTo(String(path ?? ""));
          return json({ ok: true, path });
        },
      },
      {
        name: "exhaustion_summary",
        title: "Exhaustion summary",
        description:
          "Counts remaining vs depleted, by sector, plus the next recommended actions before issuing proceedings.",
        inputSchema: { type: "object", properties: {} },
        execute: () => json(exhaustionSummary()),
      },
    ];

    window.__ENQUIRY_TOOLS = tools;

    const ctx = document.modelContext;
    if (ctx?.registerTool) {
      void Promise.all(
        tools.map((t) =>
          ctx.registerTool({
            name: t.name,
            title: t.title,
            description: t.description,
            inputSchema: t.inputSchema,
            annotations: { readOnlyHint: t.name !== "expand_party" && t.name !== "search_correspondence" },
            execute: async (input) => t.execute((input ?? {}) as Record<string, unknown>),
          }),
        ),
      ).catch(() => undefined);
    }
  }, [expandTo, setQuery]);

  return (
    <script
      type="application/json"
      id="enquiry-webmcp"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          name: "enquiry",
          description:
            "FOI, GDPR and SAR enquiry tree for Great House Farm, Llandough / BP v Buckler 1987",
          apis: [
            "/api/tree.json",
            "/api/remaining.json",
            "/api/summary.json",
            "/api/parties/:id",
            "/llms.txt",
          ],
          tools: [
            "list_parties",
            "get_party",
            "list_remaining",
            "get_avenue",
            "search_correspondence",
            "expand_party",
            "exhaustion_summary",
          ],
        }),
      }}
    />
  );
}
