import {
  generateAppSpec,
  type AppSpec,
  type WorkflowBlueprint,
} from "../../../lib/neural-knights.ts";
import {
  appSpecJsonSchema,
  appSpecPayloadSchema,
} from "../../../lib/neural-knights-schemas.ts";
import { createStructuredResponse } from "../../../lib/openai-responses.ts";
import type { ProblemProfile } from "../../../lib/problem-taxonomy.ts";

type GenerateRequest = {
  blueprintId?: string;
  blueprint?: WorkflowBlueprint;
  workspace?: string;
  discoverySummary?: string;
  problemProfile?: ProblemProfile;
};

export async function POST(request: Request) {
  const startedAt = Date.now();
  const body = (await request.json().catch(() => ({}))) as GenerateRequest;
  const base = generateAppSpec(
    body.blueprintId || body.blueprint?.id || "complaint-desk",
    body.blueprint,
    body.problemProfile,
  );
  let appSpec: AppSpec = base;
  let mode: "live" | "deterministic-demo" | "deterministic-fallback" =
    process.env.OPENAI_API_KEY ? "deterministic-fallback" : "deterministic-demo";
  let model: string | null = null;

  if (process.env.OPENAI_API_KEY && body.blueprint) {
    try {
      const response = await createStructuredResponse<unknown>({
        name: "governed_internal_app",
        schema: appSpecJsonSchema,
        instructions:
          "You design small, governed internal operations applications. Create a concise product name, one-sentence description, and exactly three executable workflow rules from the selected blueprint. Rules must be concrete and testable. Require human approval for irreversible, financial, customer-facing, or external actions. Do not claim integrations or capabilities that are not present in the blueprint.",
        input: JSON.stringify({
          workspace: body.workspace || "New workspace",
          discoverySummary: body.discoverySummary || "",
          selectedBlueprint: body.blueprint,
          confirmedProblemClassification: body.problemProfile,
          runtimeConstraints: {
            allowedActions: base.allowedActions,
            views: base.views,
            arbitraryCodeExecution: false,
          },
        }),
      });
      const parsed = appSpecPayloadSchema.parse(response.data);
      appSpec = {
        ...base,
        name: parsed.name,
        description: parsed.description,
        rules: parsed.rules,
      };
      mode = "live";
      model = response.model;
    } catch {
      mode = "deterministic-fallback";
      model = process.env.OPENAI_MODEL || "gpt-5.6-terra";
    }
  }

  return Response.json({
    appSpec,
    runtime: {
      mode,
      model,
      latencyMs: Date.now() - startedAt,
    },
    deployment: {
      id: `deploy_${appSpec.id}_v${appSpec.version}`,
      slug: appSpec.slug,
      status: "ready",
      createdAt: new Date().toISOString(),
    },
  });
}
