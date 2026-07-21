import {
  buildFulfillmentCase,
  connectorHealth,
  listUnfulfilledShopifyOrders,
  postSlackMessage,
  readSlackMessages,
} from "../../../lib/real-connectors";

type RequestBody = {
  approveSlackSend?: boolean;
  draftSlackMessage?: string;
};

export async function GET() {
  return Response.json({ connectors: connectorHealth() });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as RequestBody;
  const connectors = connectorHealth();

  if (body.approveSlackSend && body.draftSlackMessage) {
    const delivery = await postSlackMessage(body.draftSlackMessage);
    return Response.json({
      mode: delivery.mode,
      action: "slack_message",
      delivery,
      connectors,
    });
  }

  const toolTrace = [
    "tool.shopify.list_unfulfilled_orders",
    "tool.slack.read_recent_warehouse_messages",
    "tool.agent.build_fulfillment_case",
  ];

  const [orders, messages] = await Promise.all([listUnfulfilledShopifyOrders(), readSlackMessages()]);
  const agentCase = buildFulfillmentCase(orders, messages);
  const live = connectors.some((connector) => connector.configured);

  return Response.json({
    mode: live ? "live_tools" : "demo_tools",
    connectors,
    toolTrace,
    orders,
    messages,
    case: agentCase,
    approvalRequired: true,
  });
}
