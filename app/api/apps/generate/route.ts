import { generateAppSpec } from "../../../lib/neural-knights.ts";

type GenerateRequest = {
  blueprintId?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as GenerateRequest;
  const appSpec = generateAppSpec(body.blueprintId || "complaint-desk");

  return Response.json({
    appSpec,
    deployment: {
      id: `deploy_${appSpec.id}_v${appSpec.version}`,
      slug: appSpec.slug,
      status: "ready",
      createdAt: new Date().toISOString(),
    },
  });
}
