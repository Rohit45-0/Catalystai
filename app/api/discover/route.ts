import { discoverWorkspace, type SourceDocument } from "../../lib/neural-knights.ts";

type DiscoverRequest = {
  workspace?: string;
  goal?: string;
  sources?: SourceDocument[];
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as DiscoverRequest;

  if (body.sources && !Array.isArray(body.sources)) {
    return Response.json({ error: "Sources must be an array." }, { status: 400 });
  }

  if ((body.sources?.length ?? 0) > 6) {
    return Response.json({ error: "The MVP accepts up to six source files." }, { status: 400 });
  }

  return Response.json({
    mode: process.env.OPENAI_API_KEY ? "model-ready" : "deterministic-demo",
    ...discoverWorkspace(body),
  });
}
