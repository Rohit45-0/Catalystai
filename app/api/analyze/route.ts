type AnalyzeRequest = {
  problem?: string;
  conversation?: string[];
};

const demoResult = {
  mode: "demo",
  caseId: "FG-1042",
  category: "billing_compliance",
  severity: "critical",
  confidence: 0.98,
  finding: "The first-pick unit rate is $0.50 above the active contract rate.",
  recommendedAction: "Prepare an evidence-backed billing dispute for human approval.",
};

function demoAnalysis(body: AnalyzeRequest) {
  const text = `${body.problem ?? ""} ${(body.conversation ?? []).join(" ")}`.toLowerCase();

  if (text.includes("unfulfilled") || text.includes("priority") || text.includes("dispatch") || text.includes("sla")) {
    return {
      mode: "demo",
      caseId: "FG-2041",
      category: "dispatch_sla",
      severity: "high",
      confidence: 0.94,
      finding: "A priority order is still unfulfilled and should be escalated before the dispatch SLA is missed.",
      recommendedAction: "Escalate warehouse picking and prepare a proactive customer update for approval.",
    };
  }

  if (text.includes("inventory") || text.includes("cycle") || text.includes("stock") || text.includes("adjustment")) {
    return {
      mode: "demo",
      caseId: "FG-2039",
      category: "inventory_reconciliation",
      severity: "medium",
      confidence: 0.91,
      finding: "Inventory evidence shows an unexplained stock movement that needs reconciliation.",
      recommendedAction: "Open an inventory investigation and reserve affected orders until stock is confirmed.",
    };
  }

  return demoResult;
}

function outputText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const data = payload as { output_text?: unknown; output?: Array<{ content?: Array<{ text?: unknown }> }> };
  if (typeof data.output_text === "string") return data.output_text;
  return data.output
    ?.flatMap((item) => item.content ?? [])
    .map((item) => (typeof item.text === "string" ? item.text : ""))
    .join("") ?? "";
}

export async function POST(request: Request) {
  const body = (await request.json()) as AnalyzeRequest;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    await new Promise((resolve) => setTimeout(resolve, 900));
    return Response.json(demoAnalysis(body));
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5.6-terra",
      instructions:
        "You are the evidence agent in a governed ecommerce operations system. Analyze only the supplied evidence. Return concise JSON with keys category, severity, confidence, finding, and recommendedAction. Never claim an action was executed.",
      input: `Problem: ${body.problem ?? "Find operational risk"}\n\nConversation:\n${(body.conversation ?? []).join("\n")}`,
    }),
  });

  if (!response.ok) {
    return Response.json({ ...demoResult, mode: "demo", fallbackReason: "model_request_failed" });
  }

  const raw = await response.json();
  const text = outputText(raw);

  try {
    return Response.json({ mode: "live", caseId: "FG-1042", ...JSON.parse(text) });
  } catch {
    return Response.json({ ...demoResult, mode: "live", finding: text || demoResult.finding });
  }
}
