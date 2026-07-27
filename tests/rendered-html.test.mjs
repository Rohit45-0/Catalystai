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
  assert.match(app, /Build the missing tool from how your company actually operates/);
  assert.match(app, /Try the Northstar demo/);
  assert.match(app, /Understand the problem first/);
  assert.match(app, /Confirm and build the map/);
  assert.match(app, /Company execution map/);
  assert.match(app, /What Neural Knights learned/);
  assert.match(app, /Next required action/);
  assert.match(app, /Evidence knowledge graph/);
  assert.match(app, /Approve and queue/);
  assert.match(app, /Run checks again/);
  assert.match(app, /Export JSON/);
  assert.match(app, /api\/discover/);
  assert.match(app, /api\/apps\/generate/);
  assert.match(metadata, /Neural Knights/);
  assert.match(css, /@media \(max-width: 600px\)/);
  assert.match(css, /prefers-reduced-motion/);
});

test("classifies a biogas dataset as model training and builds an ML-specific path", async () => {
  const { buildProblemProfile } = await import("../app/lib/problem-taxonomy.ts");
  const { discoverWorkspace, generateAppSpec } = await import("../app/lib/neural-knights.ts");
  const sources = [{
    id: "biogas-data",
    name: "biogas_traditional_hourly.csv",
    kind: "csv",
    content: [
      "timestamp,temperature,ph,feed_rate,methane,biogas_output",
      "2026-01-01T01:00:00Z,35,7.1,20,62,145",
      "2026-01-01T02:00:00Z,36,7.0,21,64,152",
      "2026-01-01T03:00:00Z,37,6.9,22,65,158",
      "2026-01-01T04:00:00Z,38,7.2,23,67,164",
      "2026-01-01T05:00:00Z,39,7.1,24,68,171",
      "2026-01-01T06:00:00Z,40,7.0,25,70,178",
    ].join("\n"),
  }];
  const goal = "I want to generate more biogas with the current components by training a machine learning model.";
  const profile = buildProblemProfile({ goal, sources });
  const result = discoverWorkspace({ workspace: "Biogas", goal, sources, problemProfile: profile });
  const selected = result.blueprints.find((blueprint) => blueprint.id === "model-training-workbench");
  const app = generateAppSpec("model-training-workbench", selected, profile, {
    "confirm-target": "biogas_output",
    "confirm-metric": "MAE - average absolute error",
    "confirm-validation": "Chronological holdout",
  });

  assert.equal(profile.domain, "machine-learning");
  assert.equal(profile.useCase, "model-training-optimization");
  assert.match(profile.interpretation, /Train and evaluate a model/);
  assert.equal(result.problemProfile.domain, "machine-learning");
  assert.ok(result.graph.nodes.some((node) => node.id === "training-pipeline"));
  assert.ok(result.graph.nodes.some((node) => node.id === "evaluation"));
  assert.ok(result.graph.nodes.every((node) => !/complaint/i.test(`${node.label} ${node.detail}`)));
  assert.equal(result.opportunities[0].id, "model-training-workbench");
  assert.equal(result.analysis.dataset.rowsAnalyzed, 6);
  assert.equal(result.analysis.dataset.targetCandidates[0], "biogas_output");
  assert.ok(result.analysis.insights.some((insight) => /strongest simple relationship/.test(insight.title)));
  assert.equal(result.analysis.requiredActions[0].id, "confirm-target");
  assert.equal(app.runtimeKind, "model-workbench");
  assert.equal(app.slug, "generated-workspace");
  assert.equal(app.setup.target, "biogas_output");
  assert.equal(app.setup.validation, "Chronological holdout");
  assert.ok(app.rules.every((rule) => !/complaint/i.test(`${rule.condition} ${rule.outcome}`)));
});

test("returns a reviewable problem classification before discovery", async () => {
  const classificationRoute = await import("../app/api/classify/route.ts");
  const previousKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  try {
    const response = await classificationRoute.POST(
      new Request("http://localhost/api/classify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          goal: "Train a model to improve biogas yield using current sensor inputs",
          sources: [{
            id: "biogas",
            name: "biogas.csv",
            kind: "csv",
            content: "temperature,ph,feed_rate,biogas_output\n35,7.1,20,145",
          }],
        }),
      }),
    );
    const result = await response.json();
    assert.equal(response.status, 200);
    assert.equal(result.profile.domain, "machine-learning");
    assert.equal(result.profile.useCase, "model-training-optimization");
    assert.ok(result.profile.clarificationQuestions.length >= 1);
    assert.equal(result.runtime.mode, "deterministic");
  } finally {
    if (previousKey) process.env.OPENAI_API_KEY = previousKey;
  }
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
  const { demoSources } = await import("../app/lib/neural-knights.ts");
  const previousKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  try {
    const discoveryResponse = await discoveryRoute.POST(
      new Request("http://localhost/api/discover", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          workspace: "Northstar Payments",
          goal: "Reduce complaint review delays",
          sources: demoSources,
        }),
      }),
    );
    assert.equal(discoveryResponse.status, 200);
    const discovery = await discoveryResponse.json();
    assert.equal(discovery.opportunities[0].id, "complaint-desk");
    assert.equal(discovery.runtime.mode, "deterministic-demo");

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
  } finally {
    if (previousKey) process.env.OPENAI_API_KEY = previousKey;
  }
});

test("uses a validated structured model response when OpenAI is configured", async () => {
  const discoveryRoute = await import("../app/api/discover/route.ts");
  const { demoSources, discoverWorkspace } = await import("../app/lib/neural-knights.ts");
  const previousKey = process.env.OPENAI_API_KEY;
  const previousModel = process.env.OPENAI_MODEL;
  const previousFetch = globalThis.fetch;
  const fixture = discoverWorkspace({
    workspace: "Northstar Payments",
    goal: "Reduce complaint delays",
    sources: demoSources,
  });

  process.env.OPENAI_API_KEY = "test-key";
  process.env.OPENAI_MODEL = "gpt-test";
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        output_text: JSON.stringify({
          summary: "The uploaded evidence shows a manual review handoff that delays high-risk complaint decisions.",
          graph: fixture.graph,
          opportunities: fixture.opportunities,
          blueprints: fixture.blueprints,
        }),
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );

  try {
    const response = await discoveryRoute.POST(
      new Request("http://localhost/api/discover", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          workspace: "Northstar Payments",
          goal: "Reduce complaint delays",
          sources: demoSources,
        }),
      }),
    );
    const result = await response.json();
    assert.equal(result.runtime.mode, "live");
    assert.equal(result.runtime.model, "gpt-test");
    assert.equal(result.graph.nodes.length, fixture.graph.nodes.length);
    assert.ok(result.graph.edges.every((edge) => edge.evidenceIds.length > 0));
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey) process.env.OPENAI_API_KEY = previousKey;
    else delete process.env.OPENAI_API_KEY;
    if (previousModel) process.env.OPENAI_MODEL = previousModel;
    else delete process.env.OPENAI_MODEL;
  }
});
