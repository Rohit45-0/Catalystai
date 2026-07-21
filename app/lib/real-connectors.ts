export type ConnectorHealth = {
  id: "shopify" | "slack";
  name: string;
  configured: boolean;
  mode: "live" | "missing_env";
  requiredEnv: string[];
};

export type ShopifyOrder = {
  id: string;
  name: string;
  createdAt?: string;
  displayFinancialStatus?: string;
  displayFulfillmentStatus?: string;
  tags: string[];
  total?: string;
  lineItems: Array<{ sku?: string; title: string; quantity: number }>;
};

export type SlackMessage = {
  channel: string;
  text: string;
  user?: string;
  ts?: string;
};

export type AgentCase = {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium";
  confidence: number;
  evidence: string[];
  reasoning: string;
  recommendedAction: string;
  draftSlackMessage: string;
};

const SHOPIFY_VERSION = process.env.SHOPIFY_API_VERSION || "2026-07";

function shopifyDomain() {
  const raw = process.env.SHOPIFY_SHOP_DOMAIN || "";
  return raw.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export function connectorHealth(): ConnectorHealth[] {
  return [
    {
      id: "shopify",
      name: "Shopify Admin",
      configured: Boolean(shopifyDomain() && process.env.SHOPIFY_ADMIN_ACCESS_TOKEN),
      mode: shopifyDomain() && process.env.SHOPIFY_ADMIN_ACCESS_TOKEN ? "live" : "missing_env",
      requiredEnv: ["SHOPIFY_SHOP_DOMAIN", "SHOPIFY_ADMIN_ACCESS_TOKEN"],
    },
    {
      id: "slack",
      name: "Slack Web API",
      configured: Boolean(process.env.SLACK_BOT_TOKEN && process.env.SLACK_CHANNEL_ID),
      mode: process.env.SLACK_BOT_TOKEN && process.env.SLACK_CHANNEL_ID ? "live" : "missing_env",
      requiredEnv: ["SLACK_BOT_TOKEN", "SLACK_CHANNEL_ID"],
    },
  ];
}

export async function listUnfulfilledShopifyOrders(): Promise<ShopifyOrder[]> {
  const domain = shopifyDomain();
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

  if (!domain || !token) {
    return [
      {
        id: "demo-order-5841",
        name: "#5841",
        createdAt: "2026-07-19T09:14:00Z",
        displayFinancialStatus: "PAID",
        displayFulfillmentStatus: "UNFULFILLED",
        tags: ["priority"],
        total: "186.00 USD",
        lineItems: [{ sku: "LUMA-04", title: "Luma desk lamp", quantity: 1 }],
      },
    ];
  }

  const response = await fetch(`https://${domain}/admin/api/${SHOPIFY_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({
      query: `#graphql
        query CatalystAIUnfulfilledOrders($query: String!) {
          orders(first: 20, query: $query, sortKey: CREATED_AT, reverse: true) {
            edges {
              node {
                id
                name
                createdAt
                displayFinancialStatus
                displayFulfillmentStatus
                tags
                totalPriceSet { shopMoney { amount currencyCode } }
                lineItems(first: 5) {
                  edges { node { sku title quantity } }
                }
              }
            }
          }
        }
      `,
      variables: { query: "fulfillment_status:unfulfilled status:open" },
    }),
  });

  if (!response.ok) throw new Error(`Shopify request failed: ${response.status}`);
  const body = await response.json();
  const edges = body?.data?.orders?.edges ?? [];

  return edges.map((edge: { node: Record<string, unknown> }) => {
    const node = edge.node;
    const money = (node.totalPriceSet as { shopMoney?: { amount?: string; currencyCode?: string } })?.shopMoney;
    const lineItems = ((node.lineItems as { edges?: Array<{ node: { sku?: string; title: string; quantity: number } }> })?.edges ?? [])
      .map((item) => item.node);

    return {
      id: String(node.id),
      name: String(node.name),
      createdAt: String(node.createdAt ?? ""),
      displayFinancialStatus: String(node.displayFinancialStatus ?? ""),
      displayFulfillmentStatus: String(node.displayFulfillmentStatus ?? ""),
      tags: Array.isArray(node.tags) ? node.tags.map(String) : [],
      total: money ? `${money.amount} ${money.currencyCode}` : undefined,
      lineItems,
    };
  });
}

export async function readSlackMessages(): Promise<SlackMessage[]> {
  const token = process.env.SLACK_BOT_TOKEN;
  const channel = process.env.SLACK_CHANNEL_ID;

  if (!token || !channel) {
    return [
      {
        channel: "demo-warehouse",
        user: "warehouse-lead",
        ts: "demo",
        text: "Priority order #5841 is still awaiting pick. SKU LUMA-04 moved to overflow bin B-17.",
      },
    ];
  }

  const url = new URL("https://slack.com/api/conversations.history");
  url.searchParams.set("channel", channel);
  url.searchParams.set("limit", "20");

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await response.json();
  if (!body.ok) throw new Error(`Slack request failed: ${body.error ?? "unknown_error"}`);

  return (body.messages ?? []).map((message: { text?: string; user?: string; ts?: string }) => ({
    channel,
    text: message.text ?? "",
    user: message.user,
    ts: message.ts,
  }));
}

export async function postSlackMessage(text: string) {
  const token = process.env.SLACK_BOT_TOKEN;
  const channel = process.env.SLACK_CHANNEL_ID;
  if (!token || !channel) return { ok: false, mode: "missing_env" };

  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ channel, text }),
  });
  const body = await response.json();
  return { ok: Boolean(body.ok), mode: "live", response: body };
}

export function buildFulfillmentCase(orders: ShopifyOrder[], messages: SlackMessage[]): AgentCase {
  const priorityOrder =
    orders.find((order) => order.tags.some((tag) => tag.toLowerCase().includes("priority"))) ?? orders[0];
  const orderName = priorityOrder?.name ?? "#unknown";
  const sku = priorityOrder?.lineItems[0]?.sku || priorityOrder?.lineItems[0]?.title || "unknown SKU";
  const relatedSlack = messages.find((message) => message.text.includes(orderName.replace("#", "")) || message.text.includes(sku));

  return {
    id: `FG-${Math.floor(3000 + Math.random() * 6000)}`,
    title: `${orderName} is unfulfilled while warehouse context shows delay risk`,
    severity: priorityOrder?.tags.some((tag) => tag.toLowerCase().includes("priority")) ? "high" : "medium",
    confidence: relatedSlack ? 94 : 86,
    evidence: [
      `Shopify: ${orderName} is ${priorityOrder?.displayFulfillmentStatus ?? "unfulfilled"} with tags ${priorityOrder?.tags.join(", ") || "none"}`,
      `Shopify value: ${priorityOrder?.total ?? "unknown total"}`,
      `Shopify line item: ${sku}`,
      relatedSlack ? `Slack: ${relatedSlack.text}` : "Slack: no matching warehouse note found in recent channel history",
    ],
    reasoning:
      "The agent correlated a currently unfulfilled Shopify order with recent warehouse context. Because the order is priority-tagged, it should be escalated before the customer-facing dispatch SLA is missed.",
    recommendedAction: "Escalate the warehouse pick and prepare a proactive customer update for approval.",
    draftSlackMessage: `Catalyst AI escalation: ${orderName} is still unfulfilled. Please confirm pick status for ${sku} and reply with ETA. Customer message remains approval-gated.`,
  };
}
