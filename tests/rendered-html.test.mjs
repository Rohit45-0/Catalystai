import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("exposes the interactive FulfillGuard command center", async () => {
  const [page, css, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /"use client"/);
  assert.match(page, /Operations command center/);
  assert.match(page, /New workflow/);
  assert.match(page, /Analyze conversation/);
  assert.match(page, /Analyze evidence/);
  assert.match(page, /Run Shopify \+ Slack agent/);
  assert.match(page, /Approve Slack escalation/);
  assert.match(page, /api\/evidence/);
  assert.match(page, /api\/agent\/fulfillment-risk/);
  assert.match(page, /openConnector/);
  assert.match(page, /approveCase/);
  assert.match(page, /setWorkflowDialog\(true\)/);
  assert.match(packageJson, /"dev":\s*"next dev"/);
  assert.doesNotMatch(packageJson, /"dev":\s*"vinext dev"/);
  assert.match(css, /@media \(max-width: 700px\)/);
  assert.match(css, /prefers-reduced-motion/);
});

test("stores connector evidence for webhook-style imports", async () => {
  const route = await import("../app/api/evidence/route.ts");
  const response = await route.POST(
    new Request("http://localhost/api/evidence", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        source: "Shopify",
        connectorId: "shopify",
        payload: { order_id: 5841, fulfillment_status: "unfulfilled" },
      }),
    }),
  );

  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.ok, true);
  assert.equal(result.event.source, "Shopify");

  const list = await route.GET();
  const body = await list.json();
  assert.ok(body.events.some((event) => event.connectorId === "shopify"));
});

test("runs the Shopify and Slack tool chain with demo fallback", async () => {
  const connectors = await import("../app/lib/real-connectors.ts");
  const [orders, messages] = await Promise.all([
    connectors.listUnfulfilledShopifyOrders(),
    connectors.readSlackMessages(),
  ]);
  const result = connectors.buildFulfillmentCase(orders, messages);

  assert.equal(connectors.connectorHealth().length, 2);
  assert.ok(orders.length > 0);
  assert.ok(messages.length > 0);
  assert.match(result.title, /unfulfilled/i);
  assert.match(result.draftSlackMessage, /FulfillGuard escalation/);
});

test("returns deterministic analysis when no API key is configured", async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  try {
    const route = await import("../app/api/analyze/route.ts");
    const response = await route.POST(
      new Request("http://localhost/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          problem: "Check the invoice",
          conversation: ["The rate changed", "There is no signed amendment"],
        }),
      }),
    );

    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.mode, "demo");
    assert.equal(result.caseId, "FG-1042");
    assert.equal(result.category, "billing_compliance");
  } finally {
    if (previousKey) process.env.OPENAI_API_KEY = previousKey;
  }
});
