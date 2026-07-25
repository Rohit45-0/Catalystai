export type SourceKind = "csv" | "json" | "markdown" | "text";

export type SourceDocument = {
  id: string;
  name: string;
  kind: SourceKind;
  content: string;
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
  graph: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
  opportunities: Opportunity[];
  blueprints: WorkflowBlueprint[];
  sourceCount: number;
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
  allowedActions: Array<"draft_response" | "request_review" | "queue_escalation">;
  rules: AppRule[];
  evaluation: {
    passed: number;
    total: number;
    note: string;
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
}): DiscoveryResult {
  const sources = input.sources?.length ? input.sources : demoSources;
  const goal = input.goal?.trim();

  return {
    workspace: input.workspace?.trim() || "Northstar Payments",
    summary:
      goal ||
      "Reduce complaint response delays while preserving policy evidence and human approval.",
    graph: { nodes, edges },
    opportunities,
    blueprints,
    sourceCount: sources.length,
  };
}

export function generateAppSpec(blueprintId: string): AppSpec {
  const selected = blueprints.find((blueprint) => blueprint.id === blueprintId) ?? blueprints[0];

  return {
    id: `app_${selected.id}`,
    slug: "complaint-operations",
    name: selected.name,
    description: selected.summary,
    version: 1,
    views: ["queue", "case", "evaluations", "audit"],
    allowedActions: ["draft_response", "request_review", "queue_escalation"],
    rules: [
      {
        id: "risk-review",
        condition: "consumer_risk is high",
        outcome: "Require compliance review within 24 hours",
        approvalRequired: true,
      },
      {
        id: "transfer-routing",
        condition: "product is International transfer",
        outcome: "Route evidence to Payments Operations",
        approvalRequired: false,
      },
      {
        id: "financial-promise",
        condition: "draft includes reimbursement or financial commitment",
        outcome: "Block sending until a human approves",
        approvalRequired: true,
      },
    ],
    evaluation: {
      passed: 12,
      total: 12,
      note: "Validated against historical complaint and policy scenarios.",
    },
  };
}
