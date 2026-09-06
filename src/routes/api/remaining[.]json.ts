import { createFileRoute } from "@tanstack/react-router";
import { listRemaining, partyById } from "@/lib/case/tree";

export const Route = createFileRoute("/api/remaining.json")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const partyId = url.searchParams.get("partyId") ?? undefined;
        const sector = url.searchParams.get("sector") ?? undefined;
        const rows = listRemaining({ partyId, sector }).map((n) => ({
          path: n.path,
          party: partyById(n.partyId ?? "")?.shortName,
          partyId: n.partyId,
          sector: n.sector,
          label: n.label,
          status: n.status,
          how: n.how,
          contact: n.contact,
          policyUrl: n.policyUrl,
          reference: n.reference,
        }));
        return Response.json(
          { count: rows.length, remaining: rows },
          { headers: { "cache-control": "public, max-age=60" } },
        );
      },
    },
  },
});
