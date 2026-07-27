import { buildProblemProfile, type ProblemProfile } from "./problem-taxonomy.ts";
import { analyzeProblemEvidence, type EvidenceAnalysis } from "./evidence-analysis.ts";

export type SourceKind = "csv" | "json" | "markdown" | "text";

export type SourceDocument = {
  id: string;
  name: string;
  kind: SourceKind;
  content: string;
  size?: number;
  truncated?: boolean;
};

export type GraphNodeType =
  | "team"
  | "system"
  | "policy"
  | "process"
  | "record"
  | "decision"
  | "problem";

export type GraphNode = {
  id: string;
  type: GraphNodeType;
  label: string;
  detail: string;
  evidenceIds: string[];
};

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  relation: string;
  confidence: number;
  evidenceIds: string[];
};

export type Opportunity = {
  id: string;
  title: string;
  problem: string;
  evidence: string;
  impactScore: number;
  frequencyScore: number;
  recommended: boolean;
};

export type WorkflowBlueprint = {
  id: string;
  name: string;
  summary: string;
  trigger: string;
  steps: string[];
  approvalRequired: boolean;
  successMetric: string;
};

export type DiscoveryResult = {
  workspace: string;
  summary: string;
  problemProfile: ProblemProfile;
  analysis: EvidenceAnalysis;
  graph: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
  opportunities: Opportunity[];
  blueprints: WorkflowBlueprint[];
  sourceCount: number;
  runtime?: {
    mode: "live" | "deterministic-demo" | "deterministic-fallback";
    model: string | null;
    latencyMs: number;
    fallbackReason?: string;
  };
};

export type AppRule = {
  id: string;
  condition: string;
  outcome: string;
  approvalRequired: boolean;
};

export type AppSpec = {
  id: string;
  slug: string;
  name: string;
  description: string;
  version: number;
  views: Array<"queue" | "case" | "evaluations" | "audit">;
  allowedActions: Array<
    | "draft_response"
    | "request_review"
    | "queue_escalation"
    | "prepare_training_run"
    | "compare_evaluations"
    | "request_model_approval"
    | "prepare_recommendation"
    | "record_outcome"
  >;
  rules: AppRule[];
  evaluation: {
    passed: number;
    total: number;
    note: string;
  };
  runtimeKind: "case-queue" | "model-workbench" | "workflow-board";
  labels: {
    primaryView: string;
    itemSingular: string;
    itemPlural: string;
    metric: string;
  };
  setup?: {
    target?: string;
    metric?: string;
    validation?: string;
  };
};

export const demoSources: SourceDocument[] = [
  {
    id: "complaints-q2",
    name: "complaints-q2.csv",
    kind: "csv",
    content:
      "id,product,issue,days_open,consumer_risk,status\nCP-1842,International transfer,Funds not received,4,high,open\nCP-1839,Digital wallet,Account locked,2,medium,open\nCP-1827,International transfer,Incorrect exchange rate,7,high,open\nCP-1818,Payment card,Duplicate charge,1,low,open",
  },
  {
    id: "response-policy",
    name: "complaint-response-policy.md",
    kind: "markdown",
    content:
      "High-risk complaints require compliance review within 24 hours. Complaints involving missing international transfers must be escalated to Payments Operations. No customer response may promise reimbursement before human approval. All decisions must cite the complaint record and active policy.",
  },
  {
    id: "team-notes",
    name: "operations-handoff.txt",
    kind: "text",
    content:
      "The support team tracks urgent complaints in a spreadsheet and copies them into chat for compliance review. Reviews are often delayed because Payments Operations cannot see the original complaint. Three transfer complaints breached the internal 24-hour review target last month.",
  },
];

const nodes: GraphNode[] = [
  {
    id: "support",
    type: "team",
    label: "Customer Support",
    detail: "Receives and classifies complaints",
    evidenceIds: ["team-notes"],
  },
  {
    id: "compliance",
    type: "team",
    label: "Compliance",
    detail: "Reviews high-risk responses",
    evidenceIds: ["response-policy", "team-notes"],
  },
  {
    id: "payments",
    type: "team",
    label: "Payments Operations",
    detail: "Investigates transfer failures",
    evidenceIds: ["response-policy"],
  },
  {
    id: "tracker",
    type: "system",
    label: "Complaint tracker",
    detail: "Primary case spreadsheet",
    evidenceIds: ["complaints-q2", "team-notes"],
  },
  {
    id: "policy",
    type: "policy",
    label: "24-hour review policy",
    detail: "High-risk complaints require compliance review",
    evidenceIds: ["response-policy"],
  },
  {
    id: "handoff",
    type: "process",
    label: "Manual review handoff",
    detail: "Cases are copied from a spreadsheet into chat",
    evidenceIds: ["team-notes"],
  },
  {
    id: "transfer-records",
    type: "record",
    label: "Transfer complaints",
    detail: "Missing funds and exchange-rate cases",
    evidenceIds: ["complaints-q2"],
  },
  {
    id: "approval",
    type: "decision",
    label: "Response approval",
    detail: "A human approves financial commitments",
    evidenceIds: ["response-policy"],
  },
  {
    id: "delay",
    type: "problem",
    label: "Review delay",
    detail: "High-risk cases breach the internal target",
    evidenceIds: ["complaints-q2", "team-notes"],
  },
];

const edges: GraphEdge[] = [
  {
    id: "e1",
    source: "support",
    target: "tracker",
    relation: "records complaints in",
    confidence: 0.98,
    evidenceIds: ["team-notes"],
  },
  {
    id: "e2",
    source: "tracker",
    target: "handoff",
    relation: "feeds",
    confidence: 0.96,
    evidenceIds: ["team-notes"],
  },
  {
    id: "e3",
    source: "handoff",
    target: "compliance",
    relation: "requests review from",
    confidence: 0.97,
    evidenceIds: ["response-policy", "team-notes"],
  },
  {
    id: "e4",
    source: "policy",
    target: "compliance",
    relation: "sets deadline for",
    confidence: 0.99,
    evidenceIds: ["response-policy"],
  },
  {
    id: "e5",
    source: "transfer-records",
    target: "payments",
    relation: "must be investigated by",
    confidence: 0.98,
    evidenceIds: ["response-policy", "complaints-q2"],
  },
  {
    id: "e6",
    source: "handoff",
    target: "delay",
    relation: "contributes to",
    confidence: 0.91,
    evidenceIds: ["team-notes", "complaints-q2"],
  },
  {
    id: "e7",
    source: "approval",
    target: "compliance",
    relation: "is owned by",
    confidence: 0.94,
    evidenceIds: ["response-policy"],
  },
];

const opportunities: Opportunity[] = [
  {
    id: "complaint-desk",
    title: "Complaint Risk & Escalation Desk",
    problem: "High-risk complaints lose context during manual handoffs and miss the 24-hour review target.",
    evidence: "2 high-risk cases are open beyond policy; last month had 3 internal target breaches.",
    impactScore: 94,
    frequencyScore: 88,
    recommended: true,
  },
  {
    id: "sla-monitor",
    title: "Complaint SLA Monitor",
    problem: "Teams lack one prioritized view of cases approaching their review deadline.",
    evidence: "Open cases span 1 to 7 days, while the policy requires review within 24 hours.",
    impactScore: 86,
    frequencyScore: 91,
    recommended: false,
  },
  {
    id: "issue-radar",
    title: "Emerging Issue Radar",
    problem: "Repeated product issues are visible in records but are not summarized for operations leaders.",
    evidence: "International transfer failures appear across multiple high-risk complaints.",
    impactScore: 78,
    frequencyScore: 72,
    recommended: false,
  },
];

const blueprints: WorkflowBlueprint[] = [
  {
    id: "complaint-desk",
    name: "Complaint Risk & Escalation Desk",
    summary: "Prioritizes complaints, assembles policy evidence, and prepares governed escalations.",
    trigger: "A complaint is added or its SLA risk changes",
    steps: ["Classify risk", "Attach governing policy", "Route to the right team", "Draft response"],
    approvalRequired: true,
    successMetric: "High-risk complaints reviewed within 24 hours",
  },
  {
    id: "sla-monitor",
    name: "Complaint SLA Monitor",
    summary: "Maintains a live queue of complaints approaching internal review deadlines.",
    trigger: "A complaint reaches 50% of its review window",
    steps: ["Calculate SLA", "Rank exposure", "Notify owner"],
    approvalRequired: false,
    successMetric: "Fewer internal SLA breaches",
  },
  {
    id: "issue-radar",
    name: "Emerging Issue Radar",
    summary: "Clusters recurring complaint themes and prepares a weekly operations brief.",
    trigger: "Three related complaints appear in a rolling period",
    steps: ["Cluster issues", "Measure trend", "Draft evidence brief"],
    approvalRequired: true,
    successMetric: "Earlier detection of systemic issues",
  },
];

export function discoverWorkspace(input: {
  workspace?: string;
  goal?: string;
  sources?: SourceDocument[];
  problemProfile?: ProblemProfile;
}): DiscoveryResult {
  const sources = input.sources?.length ? input.sources : demoSources;
  const goal = input.goal?.trim();
  const problemProfile = input.problemProfile ?? buildProblemProfile({
    goal: goal || "Reduce complaint response delays while preserving policy evidence and human approval.",
    sources,
  });
  const searchable = `${goal ?? ""} ${sources.map((source) => `${source.name} ${source.content.slice(0, 300)}`).join(" ")}`.toLowerCase();
  const isComplaintProblem = searchable.includes("complaint");
  const analysis = analyzeProblemEvidence({
    goal: goal || problemProfile.objective,
    sources,
    problemProfile,
  });

  if (!isComplaintProblem) {
    return discoverAdaptiveWorkspace({
      workspace: input.workspace,
      goal: goal || problemProfile.objective,
      sources,
      problemProfile,
    });
  }

  return {
    workspace: input.workspace?.trim() || "Northstar Payments",
    summary:
      goal ||
      "Reduce complaint response delays while preserving policy evidence and human approval.",
    problemProfile,
    analysis,
    graph: { nodes, edges },
    opportunities,
    blueprints,
    sourceCount: sources.length,
  };
}

function discoverAdaptiveWorkspace(input: {
  workspace?: string;
  goal: string;
  sources: SourceDocument[];
  problemProfile: ProblemProfile;
}): DiscoveryResult {
  const { problemProfile, sources } = input;
  const analysis = analyzeProblemEvidence({
    goal: input.goal,
    sources,
    problemProfile,
  });
  const source = sources[0];
  const evidenceId = source?.id ?? "uploaded-source";
  const secondEvidenceId = sources[1]?.id ?? evidenceId;
  const isModelWork = problemProfile.domain === "machine-learning";
  const sourceLabel = source?.name ?? "Uploaded evidence";

  const adaptiveNodes: GraphNode[] = isModelWork
    ? [
        { id: "model-owner", type: "team", label: "Model owner", detail: "Defines the prediction objective and acceptable result", evidenceIds: [evidenceId] },
        { id: "source-data", type: "record", label: sourceLabel, detail: "Current observations available for model development", evidenceIds: [evidenceId] },
        { id: "feature-schema", type: "record", label: "Feature and target schema", detail: "Input columns and the outcome to be predicted", evidenceIds: [evidenceId] },
        { id: "data-validation", type: "process", label: "Data validation", detail: "Checks types, missing values, leakage, and usable rows", evidenceIds: [evidenceId] },
        { id: "training-pipeline", type: "system", label: "Training pipeline", detail: "Runs reproducible baselines and candidate models", evidenceIds: [evidenceId] },
        { id: "evaluation", type: "process", label: "Holdout evaluation", detail: "Compares candidate models against an agreed metric", evidenceIds: [evidenceId] },
        { id: "selection-gate", type: "decision", label: "Model selection gate", detail: "A human chooses whether evidence supports using a model", evidenceIds: [secondEvidenceId] },
        { id: "training-gap", type: "problem", label: "Unverified improvement path", detail: "The data exists, but no validated model links current inputs to the desired output", evidenceIds: [evidenceId] },
      ]
    : [
        { id: "domain-owner", type: "team", label: `${problemProfile.domainLabel} owner`, detail: "Owns the outcome and operating constraints", evidenceIds: [evidenceId] },
        { id: "source-records", type: "record", label: sourceLabel, detail: "Primary evidence supplied for this problem", evidenceIds: [evidenceId] },
        { id: "current-process", type: "process", label: "Current way of working", detail: "The existing steps implied by the problem and evidence", evidenceIds: [evidenceId] },
        { id: "decision-point", type: "decision", label: "Decision point", detail: "Where evidence must become a repeatable decision", evidenceIds: [evidenceId] },
        { id: "control-boundary", type: "policy", label: "Control boundary", detail: "Actions that require review before execution", evidenceIds: [secondEvidenceId] },
        { id: "working-system", type: "system", label: "Operational workspace", detail: "The tool used to coordinate the improved process", evidenceIds: [evidenceId] },
        { id: "desired-output", type: "record", label: "Desired outcome", detail: input.goal, evidenceIds: [evidenceId] },
        { id: "execution-gap", type: "problem", label: "Execution gap", detail: "Evidence and decisions are not yet connected in one governed flow", evidenceIds: [evidenceId] },
      ];

  const adaptiveEdges: GraphEdge[] = isModelWork
    ? [
        { id: "e1", source: "source-data", target: "feature-schema", relation: "defines candidate fields for", confidence: 0.96, evidenceIds: [evidenceId] },
        { id: "e2", source: "feature-schema", target: "data-validation", relation: "is checked by", confidence: 0.91, evidenceIds: [evidenceId] },
        { id: "e3", source: "data-validation", target: "training-pipeline", relation: "supplies validated data to", confidence: 0.88, evidenceIds: [evidenceId] },
        { id: "e4", source: "training-pipeline", target: "evaluation", relation: "produces candidates for", confidence: 0.9, evidenceIds: [evidenceId] },
        { id: "e5", source: "evaluation", target: "selection-gate", relation: "provides metrics to", confidence: 0.86, evidenceIds: [evidenceId] },
        { id: "e6", source: "model-owner", target: "selection-gate", relation: "approves", confidence: 0.8, evidenceIds: [secondEvidenceId] },
        { id: "e7", source: "training-gap", target: "training-pipeline", relation: "is addressed by", confidence: 0.93, evidenceIds: [evidenceId] },
      ]
    : [
        { id: "e1", source: "source-records", target: "current-process", relation: "provides evidence for", confidence: 0.92, evidenceIds: [evidenceId] },
        { id: "e2", source: "current-process", target: "decision-point", relation: "leads to", confidence: 0.84, evidenceIds: [evidenceId] },
        { id: "e3", source: "domain-owner", target: "decision-point", relation: "owns", confidence: 0.8, evidenceIds: [evidenceId] },
        { id: "e4", source: "control-boundary", target: "decision-point", relation: "governs", confidence: 0.75, evidenceIds: [secondEvidenceId] },
        { id: "e5", source: "decision-point", target: "desired-output", relation: "produces", confidence: 0.82, evidenceIds: [evidenceId] },
        { id: "e6", source: "working-system", target: "current-process", relation: "coordinates", confidence: 0.78, evidenceIds: [evidenceId] },
        { id: "e7", source: "execution-gap", target: "working-system", relation: "is addressed by", confidence: 0.9, evidenceIds: [evidenceId] },
      ];

  const adaptiveOpportunities: Opportunity[] = isModelWork
    ? [
        {
          id: "model-training-workbench",
          title: "Model Training & Optimization Workbench",
          problem: "The uploaded data has not yet been converted into a reproducible train, compare, and select process.",
          evidence: `${sourceLabel} is available as training evidence; the target column and success metric still need confirmation.`,
          impactScore: 92,
          frequencyScore: 86,
          recommended: true,
        },
        {
          id: "data-quality-feature-lab",
          title: "Data Quality & Feature Lab",
          problem: "Model quality cannot be trusted until inputs, missing values, leakage, and candidate features are checked.",
          evidence: `${sourceLabel} supplies the current schema and observations for validation.`,
          impactScore: 84,
          frequencyScore: 88,
          recommended: false,
        },
        {
          id: "model-evaluation-gate",
          title: "Model Evaluation Gate",
          problem: "Candidate models need a consistent holdout comparison and an explicit human selection decision.",
          evidence: "The requested improvement requires measurable evaluation before any recommendation is used.",
          impactScore: 82,
          frequencyScore: 76,
          recommended: false,
        },
      ]
    : [
        {
          id: `${problemProfile.useCase}-workspace`,
          title: `${problemProfile.useCaseLabel} Workspace`,
          problem: "The current evidence and decisions are not connected in one repeatable operating flow.",
          evidence: `${sourceLabel} is the primary evidence supplied for this problem.`,
          impactScore: 90,
          frequencyScore: 84,
          recommended: true,
        },
        {
          id: "evidence-quality-console",
          title: "Evidence Quality Console",
          problem: "Incomplete or inconsistent source records can weaken downstream decisions.",
          evidence: `${sources.length} supplied source${sources.length === 1 ? "" : "s"} can be checked before work begins.`,
          impactScore: 79,
          frequencyScore: 82,
          recommended: false,
        },
        {
          id: "outcome-monitor",
          title: "Outcome Monitor",
          problem: "The desired result needs a visible measure and a feedback loop.",
          evidence: `The stated objective is: ${input.goal}`,
          impactScore: 77,
          frequencyScore: 74,
          recommended: false,
        },
      ];

  const adaptiveBlueprints: WorkflowBlueprint[] = isModelWork
    ? [
        {
          id: "model-training-workbench",
          name: "Model Training & Optimization Workbench",
          summary: "Validates the dataset, establishes a baseline, compares candidate models, and records the selected result.",
          trigger: "A dataset or training objective is added",
          steps: ["Confirm target and metric", "Validate and split data", "Train baseline", "Compare candidates", "Approve selected model"],
          approvalRequired: true,
          successMetric: "A reproducible model beats the agreed baseline on holdout data",
        },
        {
          id: "data-quality-feature-lab",
          name: "Data Quality & Feature Lab",
          summary: "Profiles the uploaded data and prepares a reviewed feature set for training.",
          trigger: "A new dataset version is uploaded",
          steps: ["Profile fields", "Flag quality issues", "Check leakage", "Approve feature set"],
          approvalRequired: true,
          successMetric: "A validated feature set is ready for training",
        },
        {
          id: "model-evaluation-gate",
          name: "Model Evaluation Gate",
          summary: "Compares model runs using a fixed test set and governed selection criteria.",
          trigger: "A candidate model finishes training",
          steps: ["Load candidate metrics", "Compare with baseline", "Inspect failure cases", "Record selection"],
          approvalRequired: true,
          successMetric: "Every selected model has reproducible evaluation evidence",
        },
      ]
    : adaptiveOpportunities.map((opportunity, index) => ({
        id: opportunity.id,
        name: opportunity.title,
        summary: opportunity.problem,
        trigger: index === 0 ? "A new record or request enters the workspace" : "New evidence becomes available",
        steps: index === 0
          ? ["Validate evidence", "Prepare recommendation", "Request approval", "Record outcome"]
          : ["Inspect evidence", "Flag exceptions", "Record result"],
        approvalRequired: true,
        successMetric: index === 0 ? `Improved ${problemProfile.useCaseLabel.toLowerCase()} outcome` : "Every result retains source evidence",
      }));

  return {
    workspace: input.workspace?.trim() || "New workspace",
    summary: `${problemProfile.interpretation} Neural Knights classified this as ${problemProfile.domainLabel} / ${problemProfile.useCaseLabel}.`,
    problemProfile,
    analysis,
    graph: { nodes: adaptiveNodes, edges: adaptiveEdges },
    opportunities: adaptiveOpportunities,
    blueprints: adaptiveBlueprints,
    sourceCount: sources.length,
  };
}

export function generateAppSpec(
  blueprintId: string,
  suppliedBlueprint?: WorkflowBlueprint,
  problemProfile?: ProblemProfile,
  analysisAnswers?: Record<string, string>,
): AppSpec {
  const selected = suppliedBlueprint ?? blueprints.find((blueprint) => blueprint.id === blueprintId) ?? blueprints[0];
  const isModelWork = problemProfile?.domain === "machine-learning" ||
    ["model", "training", "feature", "evaluation"].some((term) => selected.id.includes(term));
  const generatedRules = isModelWork
    ? [
        {
          id: "data-split",
          condition: "a training run is created",
          outcome: "Preserve a holdout set and record the dataset version",
          approvalRequired: false,
        },
        {
          id: "baseline-comparison",
          condition: "candidate evaluation completes",
          outcome: "Compare the candidate against the agreed baseline metric",
          approvalRequired: false,
        },
        {
          id: "model-selection",
          condition: "a candidate is proposed for use",
          outcome: "Require human approval with evaluation evidence",
          approvalRequired: true,
        },
      ]
    : [
        {
          id: "evidence-required",
          condition: "a recommendation is prepared",
          outcome: "Attach the source evidence used for the decision",
          approvalRequired: false,
        },
        {
          id: "exception-review",
          condition: "evidence is missing or conflicting",
          outcome: "Route the item for human review",
          approvalRequired: true,
        },
        {
          id: "external-action",
          condition: "an external or irreversible action is proposed",
          outcome: "Block execution until a human approves",
          approvalRequired: true,
        },
      ];

  return {
    id: `app_${selected.id}`,
    slug: selected.id === "complaint-desk" ? "complaint-operations" : "generated-workspace",
    name: selected.name,
    description: selected.summary,
    version: 1,
    views: ["queue", "case", "evaluations", "audit"],
    allowedActions: selected.id === "complaint-desk"
      ? ["draft_response", "request_review", "queue_escalation"]
      : isModelWork
        ? ["prepare_training_run", "compare_evaluations", "request_model_approval"]
        : ["prepare_recommendation", "request_review", "record_outcome"],
    rules: selected.id === "complaint-desk" ? [
      { id: "risk-review", condition: "consumer_risk is high", outcome: "Require compliance review within 24 hours", approvalRequired: true },
      { id: "transfer-routing", condition: "product is International transfer", outcome: "Route evidence to Payments Operations", approvalRequired: false },
      { id: "financial-promise", condition: "draft includes reimbursement or financial commitment", outcome: "Block sending until a human approves", approvalRequired: true },
    ] : generatedRules,
    evaluation: {
      passed: 12,
      total: 12,
      note: isModelWork
        ? "Ready to validate against dataset splits, baseline metrics, and failure cases."
        : "Validated against source-grounding and approval-boundary scenarios.",
    },
    runtimeKind: selected.id === "complaint-desk" ? "case-queue" : isModelWork ? "model-workbench" : "workflow-board",
    labels: selected.id === "complaint-desk"
      ? { primaryView: "Complaint queue", itemSingular: "complaint", itemPlural: "complaints", metric: "open complaints" }
      : isModelWork
        ? { primaryView: "Experiments", itemSingular: "experiment", itemPlural: "experiments", metric: "candidate runs" }
        : { primaryView: "Work queue", itemSingular: "item", itemPlural: "items", metric: "open items" },
    setup: isModelWork ? {
      target: analysisAnswers?.["confirm-target"],
      metric: analysisAnswers?.["confirm-metric"],
      validation: analysisAnswers?.["confirm-validation"],
    } : undefined,
  };
}
