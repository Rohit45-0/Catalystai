export type ProblemDomainId =
  | "machine-learning"
  | "operations"
  | "customer-support"
  | "sales-marketing"
  | "logistics-commerce"
  | "finance-back-office";

export type ProblemUseCase = {
  id: string;
  label: string;
  description: string;
};

export type ProblemDomain = {
  id: ProblemDomainId;
  label: string;
  description: string;
  useCases: ProblemUseCase[];
};

export type ProblemProfile = {
  domain: ProblemDomainId;
  domainLabel: string;
  useCase: string;
  useCaseLabel: string;
  interpretation: string;
  objective: string;
  evidenceSignals: string[];
  clarificationQuestions: string[];
  confidence: number;
};

type ClassifiableSource = {
  name: string;
  content: string;
};

export const problemTaxonomy: ProblemDomain[] = [
  {
    id: "machine-learning",
    label: "Machine learning & data",
    description: "Build, improve, evaluate, or operate models and datasets.",
    useCases: [
      {
        id: "model-training-optimization",
        label: "Model training & optimization",
        description: "Train a predictive model and use it to improve an outcome.",
      },
      {
        id: "data-preparation",
        label: "Data preparation & labeling",
        description: "Clean, transform, label, and validate training data.",
      },
      {
        id: "model-evaluation",
        label: "Model evaluation",
        description: "Compare models, metrics, test sets, and failure cases.",
      },
      {
        id: "model-deployment-monitoring",
        label: "Deployment & monitoring",
        description: "Serve a model and track quality, drift, latency, and cost.",
      },
    ],
  },
  {
    id: "operations",
    label: "Operations & compliance",
    description: "Improve internal handoffs, approvals, reviews, and deadlines.",
    useCases: [
      { id: "review-approvals", label: "Review & approval workflow", description: "Route evidence and governed decisions." },
      { id: "sla-exceptions", label: "SLA & exception management", description: "Prioritize delayed or risky work." },
      { id: "process-automation", label: "Process automation", description: "Remove repetitive manual steps." },
      { id: "compliance-controls", label: "Compliance controls", description: "Apply policies and preserve an audit trail." },
    ],
  },
  {
    id: "customer-support",
    label: "Customer support",
    description: "Triage requests, assist responses, and detect recurring issues.",
    useCases: [
      { id: "ticket-triage", label: "Ticket triage", description: "Classify, prioritize, and route incoming requests." },
      { id: "response-assistance", label: "Response assistance", description: "Draft grounded responses for human review." },
      { id: "escalation-management", label: "Escalation management", description: "Detect and coordinate high-risk cases." },
      { id: "voice-of-customer", label: "Voice of customer", description: "Find repeated themes and product signals." },
    ],
  },
  {
    id: "sales-marketing",
    label: "Sales & marketing",
    description: "Improve lead, campaign, content, and customer-research workflows.",
    useCases: [
      { id: "lead-qualification", label: "Lead qualification", description: "Score and route accounts or opportunities." },
      { id: "campaign-operations", label: "Campaign operations", description: "Plan, execute, and evaluate campaigns." },
      { id: "content-approval", label: "Content approval", description: "Generate and review governed content." },
      { id: "customer-research", label: "Customer research", description: "Synthesize interviews and market evidence." },
    ],
  },
  {
    id: "logistics-commerce",
    label: "Logistics & commerce",
    description: "Manage orders, inventory, shipments, returns, and exceptions.",
    useCases: [
      { id: "shipment-exceptions", label: "Shipment exceptions", description: "Detect delays and coordinate resolution." },
      { id: "inventory-planning", label: "Inventory planning", description: "Forecast stock and recommend replenishment." },
      { id: "returns-operations", label: "Returns operations", description: "Classify and govern return decisions." },
      { id: "order-operations", label: "Order operations", description: "Track and resolve order workflow issues." },
    ],
  },
  {
    id: "finance-back-office",
    label: "Finance & back office",
    description: "Improve reconciliation, invoicing, expenses, and document work.",
    useCases: [
      { id: "reconciliation", label: "Reconciliation", description: "Match records and investigate differences." },
      { id: "invoice-operations", label: "Invoice operations", description: "Extract, validate, and approve invoices." },
      { id: "expense-review", label: "Expense review", description: "Check policy and route exceptions." },
      { id: "document-processing", label: "Document processing", description: "Extract and validate structured information." },
    ],
  },
];

export function getProblemDomain(id: string | undefined) {
  return problemTaxonomy.find((domain) => domain.id === id);
}

export function getProblemUseCase(domainId: string | undefined, useCaseId: string | undefined) {
  return getProblemDomain(domainId)?.useCases.find((useCase) => useCase.id === useCaseId);
}

function csvColumns(sources: ClassifiableSource[]) {
  const csv = sources.find((source) => source.name.toLowerCase().endsWith(".csv"));
  if (!csv) return [];
  return csv.content.split(/\r?\n/, 1)[0]
    ?.split(",")
    .map((column) => column.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean)
    .slice(0, 8) ?? [];
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function detectDomain(text: string): ProblemDomainId {
  const scores: Record<ProblemDomainId, number> = {
    "machine-learning": 0,
    operations: 0,
    "customer-support": 0,
    "sales-marketing": 0,
    "logistics-commerce": 0,
    "finance-back-office": 0,
  };

  const keywordGroups: Array<[ProblemDomainId, string[]]> = [
    ["machine-learning", ["model", "training", "train ", "predict", "dataset", "feature", "target variable", "accuracy", "regression", "classification", "optimi", "yield", "biogas", "machine learning"]],
    ["operations", ["approval", "review", "handoff", "compliance", "policy", "sla", "process", "workflow", "manual", "operations"]],
    ["customer-support", ["support", "ticket", "complaint", "customer response", "escalation", "helpdesk"]],
    ["sales-marketing", ["lead", "campaign", "marketing", "content", "conversion", "sales", "advertis"]],
    ["logistics-commerce", ["shipment", "inventory", "warehouse", "delivery", "order", "return", "logistics", "fulfillment"]],
    ["finance-back-office", ["invoice", "reconcil", "expense", "billing", "payment record", "accounts payable", "finance"]],
  ];

  for (const [domain, keywords] of keywordGroups) {
    scores[domain] = keywords.reduce((score, keyword) => score + (text.includes(keyword) ? 1 : 0), 0);
  }

  const strongest = (Object.entries(scores) as Array<[ProblemDomainId, number]>)
    .sort((a, b) => b[1] - a[1])[0];
  return strongest && strongest[1] > 0 ? strongest[0] : "operations";
}

function detectUseCase(domain: ProblemDomainId, text: string) {
  if (domain === "machine-learning") {
    if (includesAny(text, ["clean", "missing value", "label", "prepare data", "preprocess"])) return "data-preparation";
    if (includesAny(text, ["deploy", "serve", "latency", "drift", "monitor model"])) return "model-deployment-monitoring";
    if (includesAny(text, ["evaluate", "compare model", "benchmark", "test set", "accuracy"])) return "model-evaluation";
    return "model-training-optimization";
  }
  if (domain === "operations") {
    if (includesAny(text, ["sla", "deadline", "delay", "exception"])) return "sla-exceptions";
    if (includesAny(text, ["compliance", "policy", "audit", "control"])) return "compliance-controls";
    if (includesAny(text, ["approval", "review"])) return "review-approvals";
    return "process-automation";
  }
  if (domain === "customer-support") {
    if (includesAny(text, ["response", "reply", "draft"])) return "response-assistance";
    if (includesAny(text, ["escalat", "urgent", "risk"])) return "escalation-management";
    if (includesAny(text, ["theme", "trend", "feedback", "insight"])) return "voice-of-customer";
    return "ticket-triage";
  }
  if (domain === "sales-marketing") {
    if (includesAny(text, ["lead", "account", "prospect"])) return "lead-qualification";
    if (includesAny(text, ["content", "copy", "approval"])) return "content-approval";
    if (includesAny(text, ["research", "interview", "market"])) return "customer-research";
    return "campaign-operations";
  }
  if (domain === "logistics-commerce") {
    if (includesAny(text, ["inventory", "stock", "reorder"])) return "inventory-planning";
    if (includesAny(text, ["return", "refund"])) return "returns-operations";
    if (includesAny(text, ["shipment", "delivery", "delay"])) return "shipment-exceptions";
    return "order-operations";
  }
  if (includesAny(text, ["reconcil", "match", "difference"])) return "reconciliation";
  if (includesAny(text, ["invoice", "accounts payable"])) return "invoice-operations";
  if (includesAny(text, ["expense", "receipt"])) return "expense-review";
  return "document-processing";
}

function interpretationFor(
  domain: ProblemDomain,
  useCase: ProblemUseCase,
  goal: string,
) {
  const normalizedGoal = goal.trim().replace(/\s+/g, " ");
  if (domain.id === "machine-learning" && useCase.id === "model-training-optimization") {
    const subject = /biogas/i.test(normalizedGoal) ? "biogas output" : "the target outcome";
    return `Train and evaluate a model from the uploaded data to predict and improve ${subject} using the inputs already available.`;
  }
  return `${useCase.label}: use the supplied evidence to address "${normalizedGoal}" within ${domain.label.toLowerCase()}.`;
}

export function buildProblemProfile(input: {
  goal: string;
  sources: ClassifiableSource[];
  domainHint?: string;
  useCaseHint?: string;
}): ProblemProfile {
  const columns = csvColumns(input.sources);
  const searchable = [
    input.goal,
    ...input.sources.map((source) => `${source.name} ${source.content.slice(0, 1_500)}`),
  ].join(" ").toLowerCase();
  const detectedDomain = detectDomain(searchable);
  const domain = getProblemDomain(input.domainHint) ?? getProblemDomain(detectedDomain) ?? problemTaxonomy[0];
  const detectedUseCase = detectUseCase(domain.id, searchable);
  const useCase = getProblemUseCase(domain.id, input.useCaseHint) ??
    getProblemUseCase(domain.id, detectedUseCase) ??
    domain.useCases[0];
  const evidenceSignals = [
    `${input.sources.length} source${input.sources.length === 1 ? "" : "s"} supplied`,
    ...(columns.length ? [`CSV fields: ${columns.slice(0, 5).join(", ")}`] : []),
    ...(domain.id === "machine-learning" && includesAny(searchable, ["more ", "increase", "maximi", "optimi", "yield"])
      ? ["An optimization objective is present"]
      : []),
  ];

  return {
    domain: domain.id,
    domainLabel: domain.label,
    useCase: useCase.id,
    useCaseLabel: useCase.label,
    interpretation: interpretationFor(domain, useCase, input.goal),
    objective: input.goal.trim().replace(/\s+/g, " "),
    evidenceSignals,
    clarificationQuestions: domain.id === "machine-learning"
      ? [
          "Which column is the outcome the model should predict?",
          "How will a better model be measured: error, yield, cost, or another metric?",
        ]
      : ["Which outcome should improve first?", "Which actions must remain human-approved?"],
    confidence: domain.id === detectedDomain ? (columns.length ? 0.94 : 0.86) : 1,
  };
}
