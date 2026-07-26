import { z } from "zod";

const nodeTypes = ["team", "system", "policy", "process", "record", "decision", "problem"] as const;

export const discoveryPayloadSchema = z.object({
  summary: z.string().min(20),
  graph: z.object({
    nodes: z.array(
      z.object({
        id: z.string().min(1),
        type: z.enum(nodeTypes),
        label: z.string().min(2),
        detail: z.string().min(8),
        evidenceIds: z.array(z.string()).min(1),
      }),
    ).min(6).max(12),
    edges: z.array(
      z.object({
        id: z.string().min(1),
        source: z.string().min(1),
        target: z.string().min(1),
        relation: z.string().min(2),
        confidence: z.number().min(0).max(1),
        evidenceIds: z.array(z.string()).min(1),
      }),
    ).min(5).max(16),
  }),
  opportunities: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string().min(4),
      problem: z.string().min(15),
      evidence: z.string().min(15),
      impactScore: z.number().int().min(1).max(100),
      frequencyScore: z.number().int().min(1).max(100),
      recommended: z.boolean(),
    }),
  ).length(3),
  blueprints: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(4),
      summary: z.string().min(15),
      trigger: z.string().min(8),
      steps: z.array(z.string().min(2)).min(3).max(5),
      approvalRequired: z.boolean(),
      successMetric: z.string().min(8),
    }),
  ).length(3),
});

export const appSpecPayloadSchema = z.object({
  name: z.string().min(4),
  description: z.string().min(15),
  rules: z.array(
    z.object({
      id: z.string().min(1),
      condition: z.string().min(5),
      outcome: z.string().min(8),
      approvalRequired: z.boolean(),
    }),
  ).length(3),
});

const stringArray = { type: "array", items: { type: "string" } };

export const discoveryJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "graph", "opportunities", "blueprints"],
  properties: {
    summary: { type: "string" },
    graph: {
      type: "object",
      additionalProperties: false,
      required: ["nodes", "edges"],
      properties: {
        nodes: {
          type: "array",
          minItems: 6,
          maxItems: 12,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["id", "type", "label", "detail", "evidenceIds"],
            properties: {
              id: { type: "string" },
              type: { type: "string", enum: nodeTypes },
              label: { type: "string" },
              detail: { type: "string" },
              evidenceIds: stringArray,
            },
          },
        },
        edges: {
          type: "array",
          minItems: 5,
          maxItems: 16,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["id", "source", "target", "relation", "confidence", "evidenceIds"],
            properties: {
              id: { type: "string" },
              source: { type: "string" },
              target: { type: "string" },
              relation: { type: "string" },
              confidence: { type: "number", minimum: 0, maximum: 1 },
              evidenceIds: stringArray,
            },
          },
        },
      },
    },
    opportunities: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "id",
          "title",
          "problem",
          "evidence",
          "impactScore",
          "frequencyScore",
          "recommended",
        ],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          problem: { type: "string" },
          evidence: { type: "string" },
          impactScore: { type: "integer", minimum: 1, maximum: 100 },
          frequencyScore: { type: "integer", minimum: 1, maximum: 100 },
          recommended: { type: "boolean" },
        },
      },
    },
    blueprints: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "id",
          "name",
          "summary",
          "trigger",
          "steps",
          "approvalRequired",
          "successMetric",
        ],
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          summary: { type: "string" },
          trigger: { type: "string" },
          steps: { type: "array", minItems: 3, maxItems: 5, items: { type: "string" } },
          approvalRequired: { type: "boolean" },
          successMetric: { type: "string" },
        },
      },
    },
  },
} satisfies Record<string, unknown>;

export const appSpecJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["name", "description", "rules"],
  properties: {
    name: { type: "string" },
    description: { type: "string" },
    rules: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "condition", "outcome", "approvalRequired"],
        properties: {
          id: { type: "string" },
          condition: { type: "string" },
          outcome: { type: "string" },
          approvalRequired: { type: "boolean" },
        },
      },
    },
  },
} satisfies Record<string, unknown>;
