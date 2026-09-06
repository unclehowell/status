import { createFileRoute } from "@tanstack/react-router";
import { buildCaseTree, exhaustionSummary } from "@/lib/case/tree";

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: async () => {
        const tree = buildCaseTree();
        const sum = exhaustionSummary();
        const body = `# Enquiry

FOI / GDPR / SAR enquiry tree for Great House Farm (Ty Mawr), Llandough — BP Properties Ltd v Buckler 1987.

Snapshot: ${tree.snapshotDate}
Parties: ${tree.parties.length}
Remaining avenues: ${tree.remaining}
Depleted: ${tree.depleted}
In flight: ${tree.inFlight}

## What this is
Each party opens at enquiry. Expand enquiry for foi, gdpr and sar. Expand each of those for internal review. Colour is live email status. Remaining steps should be depleted before legal action.

## Agent APIs
- GET /api/tree.json — full tree + parties
- GET /api/remaining.json?partyId=&sector= — undepleted leaves
- GET /api/summary.json — counts and next actions
- GET /api/parties/{id} — one party
- GET /llms.txt — this file

## WebMCP
This page registers document.modelContext tools: list_parties, get_party, list_remaining, get_avenue, search_correspondence, expand_party, exhaustion_summary. Fallback: window.__ENQUIRY_TOOLS and #enquiry-webmcp JSON.

## Status values
open (remaining), sent, awaiting, replied, review, complaint, bounce, exhausted (depleted)

## Parties
${tree.partyNodes.map((n) => `- ${n.id}  ${n.label}  rem=${n.remaining} dep=${n.depleted}  ${n.status}`).join("\n")}

## Next actions
${sum.nextActions.map((a, i) => `${i + 1}. ${a.party} — ${a.label} [${a.status}] ${a.path}`).join("\n")}
`;
        return new Response(body, {
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "cache-control": "public, max-age=60",
          },
        });
      },
    },
  },
});
