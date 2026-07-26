type ResponsePayload = {
  output_text?: unknown;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: unknown;
    }>;
  }>;
};

export class OpenAIResponseError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

function outputText(payload: ResponsePayload): string {
  if (typeof payload.output_text === "string") return payload.output_text;

  return (payload.output ?? [])
    .flatMap((item) => item.content ?? [])
    .filter((item) => item.type === "output_text" || typeof item.text === "string")
    .map((item) => (typeof item.text === "string" ? item.text : ""))
    .join("");
}

export async function createStructuredResponse<T>({
  name,
  schema,
  instructions,
  input,
}: {
  name: string;
  schema: Record<string, unknown>;
  instructions: string;
  input: string;
}): Promise<{ data: T; model: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new OpenAIResponseError("OPENAI_API_KEY is not configured.");

  const model = process.env.OPENAI_MODEL || "gpt-5.6-terra";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    signal: AbortSignal.timeout(45_000),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      store: false,
      reasoning: { effort: "low" },
      instructions,
      input,
      text: {
        format: {
          type: "json_schema",
          name,
          strict: true,
          schema,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;
    throw new OpenAIResponseError(
      errorBody?.error?.message || `OpenAI request failed with status ${response.status}.`,
      response.status,
    );
  }

  const raw = (await response.json()) as ResponsePayload;
  const text = outputText(raw);
  if (!text) throw new OpenAIResponseError("OpenAI returned no structured text.");

  try {
    return { data: JSON.parse(text) as T, model };
  } catch {
    throw new OpenAIResponseError("OpenAI returned invalid JSON.");
  }
}
