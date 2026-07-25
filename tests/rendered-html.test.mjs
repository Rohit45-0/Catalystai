import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("exposes the Neural Knights discovery-to-deployment experience", async () => {
  const [page, app, css, metadata] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/neural-knights-app.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(page, /NeuralKnightsApp/);
  assert.match(app, /"use client"/);
  assert.match(app, /Turn company knowledge into a working internal app/);
  assert.match(app, /Load demo workspace/);
  assert.match(app, /Discover applications/);
  assert.match(app, /Company execution map/);
  assert.match(app, /Approve and queue escalation/);
  assert.match(app, /api\/discover/);
  assert.match(app, /api\/apps\/generate/);
  assert.match(metadata, /Neural Knights/);
  assert.match(css, /@media \(max-width: 600px\)/);
  assert.match(css, /prefers-reduced-motion/);
});

test("builds a deterministic execution map with source provenance", async () => {
  const { demoSources, discoverWorkspace } = await import("../app/lib/neural-knights.ts");
  const result = discoverWorkspace({
    workspace: "Northstar Payments",
    goal: "Reduce complaint delays",
    sources: demoSources,
  });

  assert.equal(result.workspace, "Northstar Payments");
  assert.equal(result.sourceCount, 3);
  assert.ok(result.graph.nodes.length >= 8);
  assert.ok(result.graph.edges.length >= 6);
  assert.ok(result.graph.edges.every((edge) => edge.evidenceIds.length > 0));
  assert.ok(result.graph.edges.every((edge) => edge.confidence >= 0.9));
  assert.equal(result.opportunities[0].id, "complaint-desk");
  assert.equal(result.opportunities[0].recommended, true);
});

test("generates a constrained application specification", async () => {
  const { generateAppSpec } = await import("../app/lib/neural-knights.ts");
  const spec = generateAppSpec("complaint-desk");

  assert.equal(spec.slug, "complaint-operations");
  assert.equal(spec.evaluation.passed, spec.evaluation.total);
  assert.ok(spec.views.includes("audit"));
  assert.ok(spec.rules.some((rule) => rule.approvalRequired));
  assert.deepEqual(spec.allowedActions, [
    "draft_response",
    "request_review",
    "queue_escalation",
  ]);
});

test("returns discovery and generated app API responses", async () => {
  const discoveryRoute = await import("../app/api/discover/route.ts");
  const generationRoute = await import("../app/api/apps/generate/route.ts");

  const discoveryResponse = await discoveryRoute.POST(
    new Request("http://localhost/api/discover", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ workspace: "Northstar Payments" }),
    }),
  );
  assert.equal(discoveryResponse.status, 200);
  const discovery = await discoveryResponse.json();
  assert.equal(discovery.opportunities[0].id, "complaint-desk");

  const generationResponse = await generationRoute.POST(
    new Request("http://localhost/api/apps/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ blueprintId: "complaint-desk" }),
    }),
  );
  assert.equal(generationResponse.status, 200);
  const generation = await generationResponse.json();
  assert.equal(generation.deployment.status, "ready");
  assert.equal(generation.appSpec.slug, "complaint-operations");
});
