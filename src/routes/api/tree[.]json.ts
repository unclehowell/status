import { createFileRoute } from "@tanstack/react-router";
import { buildCaseTree } from "@/lib/case/tree";

export const Route = createFileRoute("/api/tree.json")({
  server: {
    handlers: {
      GET: async () => {
        const tree = buildCaseTree();
        return Response.json(
          {
            name: "Enquiry",
            snapshotDate: tree.snapshotDate,
            remaining: tree.remaining,
            depleted: tree.depleted,
            inFlight: tree.inFlight,
            parties: tree.parties,
            tree: tree.root,
          },
          { headers: { "cache-control": "public, max-age=60" } },
        );
      },
    },
  },
});
