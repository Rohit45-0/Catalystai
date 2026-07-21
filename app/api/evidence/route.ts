type EvidenceEvent = {
  id?: string;
  source?: string;
  connectorId?: string;
  type?: string;
  payload?: unknown;
  receivedAt?: string;
};

const store = globalThis as typeof globalThis & { __catalystAIEvidence?: Required<EvidenceEvent>[] };

function events() {
  store.__catalystAIEvidence ??= [];
  return store.__catalystAIEvidence;
}

export async function GET() {
  return Response.json({ events: events() });
}

export async function POST(request: Request) {
  const body = (await request.json()) as EvidenceEvent;
  const event = {
    id: body.id || `evt_${Date.now()}`,
    source: body.source || "Webhook",
    connectorId: body.connectorId || "webhook",
    type: body.type || "webhook_event",
    payload: typeof body.payload === "string" ? body.payload : JSON.stringify(body.payload ?? body),
    receivedAt: body.receivedAt || new Date().toISOString(),
  };

  events().push(event);
  store.__catalystAIEvidence = events().slice(-50);

  return Response.json({ ok: true, event });
}
