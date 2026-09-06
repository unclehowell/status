import { createFileRoute } from "@tanstack/react-router";
import { exhaustionSummary } from "@/lib/case/tree";

export const Route = createFileRoute("/api/summary.json")({
  server: {
    handlers: {
      GET: async () =>
        Response.json(exhaustionSummary(), {
          headers: { "cache-control": "public, max-age=60" },
        }),
    },
  },
});
