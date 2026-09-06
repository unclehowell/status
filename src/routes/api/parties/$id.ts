import { createFileRoute } from "@tanstack/react-router";
import { partyById } from "@/lib/case/tree";

export const Route = createFileRoute("/api/parties/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const party = partyById(params.id);
        if (!party) return new Response("Not found", { status: 404 });
        return Response.json(party, { headers: { "cache-control": "public, max-age=60" } });
      },
    },
  },
});
