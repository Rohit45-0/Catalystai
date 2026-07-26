"use client";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  Database,
  Download,
  FileJson,
  FileText,
  GitBranch,
  LayoutDashboard,
  Link2,
  ListChecks,
  LoaderCircle,
  LockKeyhole,
  Menu,
  Network,
  RefreshCcw,
  Rocket,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Upload,
  Users,
  Workflow,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  demoSources,
  discoverWorkspace,
  generateAppSpec,
  type AppSpec,
  type DiscoveryResult,
  type GraphNodeType,
  type Opportunity,
  type SourceDocument,
} from "../lib/neural-knights";

type View = "discover" | "map" | "apps" | "audit";
type AppTab = "queue" | "evaluations" | "rules";
type ComplaintStatus = "open" | "approved" | "dismissed";

type Complaint = {
  id: string;
  title: string;
  product: string;
  severity: "critical" | "high" | "medium";
  age: string;
  deadline: string;
  status: ComplaintStatus;
  summary: string;
  evidence: string[];
  action: string;
  draft: string;
};

const complaints: Complaint[] = [
  {
    id: "CP-1827",
    title: "Incorrect exchange rate on international transfer",
    product: "International transfer",
    severity: "critical",
    age: "7 days",
    deadline: "Breached",
    status: "open",
    summary: "A high-risk complaint is still awaiting compliance review and has exceeded the internal target.",
    evidence: [
      "complaints-q2.csv: consumer_risk=high, days_open=7",
      "Response policy: high-risk complaints require review within 24 hours",
      "Operations notes: Payments Operations lacks direct access to original complaint context",
    ],
    action: "Queue a compliance escalation with the complete complaint and policy evidence.",
    draft:
      "Compliance review requested for CP-1827. The case concerns an international transfer exchange-rate dispute, is classified high risk, and is beyond the 24-hour internal review target. Payments Operations evidence is attached. No financial commitment has been made.",
  },
  {
    id: "CP-1842",
    title: "International transfer funds not received",
    product: "International transfer",
    severity: "high",
    age: "4 days",
    deadline: "Breached",
    status: "open",
    summary: "Missing transfer funds require Payments Operations investigation and compliance review.",
    evidence: [
      "complaints-q2.csv: consumer_risk=high, days_open=4",
      "Response policy: missing transfers route to Payments Operations",
      "Response policy: financial promises require human approval",
    ],
    action: "Request Payments Operations investigation and prepare a governed customer response.",
    draft:
      "Payments Operations investigation requested for CP-1842. Please confirm transfer status and return evidence to Compliance. The customer response remains approval-gated.",
  },
  {
    id: "CP-1839",
    title: "Digital wallet account remains locked",
    product: "Digital wallet",
    severity: "medium",
    age: "2 days",
    deadline: "8 hours",
    status: "open",
    summary: "The case is approaching its internal review deadline but has no assigned reviewer.",
    evidence: [
      "complaints-q2.csv: consumer_risk=medium, days_open=2",
      "Complaint tracker: no compliance owner is recorded",
    ],
    action: "Assign an owner and request review before the current working day ends.",
    draft:
      "Review requested for CP-1839. The digital wallet access complaint has no current owner and is approaching its internal review deadline.",
  },
];

const nodeIcons: Record<GraphNodeType, typeof Users> = {
  team: Users,
  system: Database,
  policy: BookOpenCheck,
  process: Workflow,
  record: FileText,
  decision: GitBranch,
  problem: AlertTriangle,
};

const navItems: Array<{ id: View; label: string; icon: typeof Sparkles }> = [
  { id: "discover", label: "Discover", icon: Sparkles },
  { id: "map", label: "Execution map", icon: Network },
  { id: "apps", label: "Generated apps", icon: LayoutDashboard },
  { id: "audit", label: "Audit log", icon: ListChecks },
];

const discoveryStages = [
  "Reading source structure",
  "Linking people, policies, and systems",
  "Testing bottleneck hypotheses",
  "Ranking application opportunities",
];

function kindFromName(name: string): SourceDocument["kind"] {
  const extension = name.split(".").pop()?.toLowerCase();
  if (extension === "csv") return "csv";
  if (extension === "json") return "json";
  if (extension === "md" || extension === "markdown") return "markdown";
  return "text";
}

function scoreTone(score: number) {
  if (score >= 90) return "score-critical";
  if (score >= 80) return "score-high";
  return "score-medium";
}

export function NeuralKnightsApp({ initialMode = "builder" }: { initialMode?: "builder" | "deployed" }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const seeded = initialMode === "deployed";
  const [activeView, setActiveView] = useState<View>(seeded ? "apps" : "discover");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [workspace, setWorkspace] = useState(seeded ? "Northstar Payments" : "");
  const [goal, setGoal] = useState(
    seeded ? "Reduce complaint response delays while preserving policy evidence and human approval." : "",
  );
  const [sources, setSources] = useState<SourceDocument[]>(seeded ? demoSources : []);
  const [discovery, setDiscovery] = useState<DiscoveryResult | null>(
    seeded ? discoverWorkspace({ workspace: "Northstar Payments", sources: demoSources }) : null,
  );
  const [selectedOpportunity, setSelectedOpportunity] = useState("complaint-desk");
  const [appSpec, setAppSpec] = useState<AppSpec | null>(seeded ? generateAppSpec("complaint-desk") : null);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryStage, setDiscoveryStage] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [appTab, setAppTab] = useState<AppTab>("queue");
  const [caseList, setCaseList] = useState(complaints);
  const [selectedCaseId, setSelectedCaseId] = useState(complaints[0].id);
  const [caseQuery, setCaseQuery] = useState("");
  const [showResolved, setShowResolved] = useState(false);
  const [audit, setAudit] = useState([
    "App v1 passed 12 historical evaluations",
    "Complaint response policy linked to three workflow rules",
    "Workspace evidence indexed with source-level provenance",
  ]);
  const [toast, setToast] = useState("");

  const selectedCase = caseList.find((item) => item.id === selectedCaseId) ?? caseList[0];
  const openCount = caseList.filter((item) => item.status === "open").length;
  const visibleCases = useMemo(
    () =>
      caseList.filter((item) => {
        const matchesQuery = `${item.id} ${item.title} ${item.product}`.toLowerCase().includes(caseQuery.toLowerCase());
        return matchesQuery && (showResolved || item.status === "open");
      }),
    [caseList, caseQuery, showResolved],
  );

  const sourceCharacters = useMemo(
    () => sources.reduce((total, source) => total + source.content.length, 0),
    [sources],
  );

  useEffect(() => {
    if (!seeded) return;
    const saved = window.localStorage.getItem("neural-knights-app-spec");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as AppSpec;
      const timeout = window.setTimeout(() => setAppSpec(parsed), 0);
      return () => window.clearTimeout(timeout);
    } catch {
      window.localStorage.removeItem("neural-knights-app-spec");
    }
  }, [seeded]);

  useEffect(() => {
    if (!isDiscovering) return;
    const interval = window.setInterval(
      () => setDiscoveryStage((current) => Math.min(current + 1, discoveryStages.length - 1)),
      1150,
    );
    return () => window.clearInterval(interval);
  }, [isDiscovering]);

  function navigate(view: View) {
    if (view === "discover" && seeded) {
      router.push("/");
      return;
    }
    setActiveView(view);
    setMobileOpen(false);
  }

  function loadDemoWorkspace() {
    setWorkspace("Northstar Payments");
    setGoal("Reduce complaint response delays while preserving policy evidence and human approval.");
    setSources(demoSources);
    setToast("Demo workspace loaded");
  }

  async function addFiles(files: FileList | null) {
    if (!files) return;
    const accepted = Array.from(files).slice(0, Math.max(0, 6 - sources.length));
    const next = await Promise.all(
      accepted.map(async (file, index) => ({
        id: `upload-${Date.now()}-${index}`,
        name: file.name,
        kind: kindFromName(file.name),
        content: (await file.text()).slice(0, 50_000),
      })),
    );
    setSources((current) => [...current, ...next].slice(0, 6));
  }

  async function runDiscovery() {
    if (!goal.trim() || sources.length === 0) {
      setToast("Add a problem statement and at least one source");
      return;
    }
    setDiscoveryStage(0);
    setIsDiscovering(true);
    try {
      const response = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace, goal, sources }),
      });
      if (!response.ok) throw new Error("Discovery failed");
      const result = (await response.json()) as DiscoveryResult;
      setDiscovery(result);
      setSelectedOpportunity(result.opportunities.find((item) => item.recommended)?.id ?? result.opportunities[0].id);
      setActiveView("map");
      setAudit((items) => [`Execution map created from ${result.sourceCount} sources`, ...items]);
      setToast(
        result.runtime?.mode === "live"
          ? `Live analysis completed with ${result.runtime.model}`
          : "Execution map created with the safe demo engine",
      );
    } catch {
      setToast("Discovery could not finish. Please try again.");
    } finally {
      setIsDiscovering(false);
    }
  }

  async function generateApplication(opportunity?: Opportunity) {
    const blueprintId = opportunity?.id ?? selectedOpportunity;
    setSelectedOpportunity(blueprintId);
    setIsGenerating(true);
    try {
      const blueprint = discovery?.blueprints.find((item) => item.id === blueprintId);
      const response = await fetch("/api/apps/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blueprintId,
          blueprint,
          workspace: discovery?.workspace,
          discoverySummary: discovery?.summary,
        }),
      });
      if (!response.ok) throw new Error("Generation failed");
      const result = (await response.json()) as { appSpec: AppSpec };
      setAppSpec(result.appSpec);
      setAudit((items) => [`${result.appSpec.name} generated with ${result.appSpec.rules.length} governed rules`, ...items]);
      setToast("Application generated and validated");
    } catch {
      setToast("Application generation could not finish.");
    } finally {
      setIsGenerating(false);
    }
  }

  function chooseOpportunity(id: string) {
    setSelectedOpportunity(id);
    setAppSpec(null);
  }

  function deployApplication() {
    if (!appSpec) return;
    window.localStorage.setItem("neural-knights-app-spec", JSON.stringify(appSpec));
    router.push(`/apps/${appSpec.slug}`);
  }

  function approveCase(id: string) {
    const item = caseList.find((complaint) => complaint.id === id);
    if (!item || item.status === "approved") return;
    setCaseList((current) =>
      current.map((complaint) => (complaint.id === id ? { ...complaint, status: "approved" } : complaint)),
    );
    setAudit((items) => [`Human approved the governed escalation for ${id}`, ...items]);
    setToast(`${id} approved and queued`);
  }

  function dismissCase(id: string) {
    const item = caseList.find((complaint) => complaint.id === id);
    if (!item || item.status !== "open") return;
    setCaseList((current) =>
      current.map((complaint) => (complaint.id === id ? { ...complaint, status: "dismissed" } : complaint)),
    );
    setAudit((items) => [`Human dismissed the proposed escalation for ${id}`, ...items]);
    setToast(`${id} dismissed with an audit record`);
  }

  function runEvaluations() {
    if (isEvaluating) return;
    setIsEvaluating(true);
    window.setTimeout(() => {
      setIsEvaluating(false);
      setAudit((items) => [`App v${appSpec?.version ?? 1} passed 12 historical evaluations`, ...items]);
      setToast("All historical checks passed");
    }, 1200);
  }

  function exportAudit() {
    const blob = new Blob([JSON.stringify({ workspace, events: audit }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "neural-knights-audit.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="nk-shell">
      <aside className={`nk-sidebar ${mobileOpen ? "nk-sidebar-open" : ""}`}>
        <div className="nk-brand">
          <span className="nk-brand-mark"><BrainCircuit size={19} /></span>
          <span><strong>Neural Knights</strong><small>Company intelligence</small></span>
          <button className="icon-button mobile-only" onClick={() => setMobileOpen(false)} aria-label="Close navigation">
            <X size={17} />
          </button>
        </div>

        <div className="workspace-card">
          <span className="workspace-avatar">NP</span>
          <span><strong>{workspace || "New workspace"}</strong><small>{sources.length} knowledge sources</small></span>
          <ChevronRight size={14} />
        </div>

        <nav className="nk-nav" aria-label="Product navigation">
          <span className="nav-section-label">Build</span>
          {navItems.map((item) => {
            const Icon = item.icon;
            const disabled = (item.id === "map" && !discovery) || (item.id === "apps" && !appSpec);
            return (
              <button
                key={item.id}
                className={activeView === item.id ? "nav-active" : ""}
                onClick={() => navigate(item.id)}
                disabled={disabled}
              >
                <Icon size={16} /><span>{item.label}</span>
                {item.id === "apps" && appSpec ? <span className="nav-status" /> : null}
              </button>
            );
          })}
        </nav>

        <div className="nk-sidebar-bottom">
          <div className="safety-status">
            <ShieldCheck size={16} />
            <span><strong>Governed runtime</strong><small>Allowlisted actions only</small></span>
          </div>
          <div className="founder-row">
            <span>NK</span>
            <div><strong>Founder workspace</strong><small>Demo environment</small></div>
          </div>
        </div>
      </aside>

      <div className="nk-main">
        <header className="nk-topbar">
          <button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
            <Menu size={18} />
          </button>
          <div className="topbar-title">
            <span>{navItems.find((item) => item.id === activeView)?.label}</span>
            <small><i /> {discovery?.runtime?.mode === "live" ? `Live model / ${discovery.runtime.model}` : "Workspace ready"}</small>
          </div>
          <div className="topbar-actions">
            <span className="privacy-label"><ShieldCheck size={14} /> Evidence access logged</span>
            {appSpec && activeView !== "apps" ? (
              <button className="secondary-button" onClick={() => setActiveView("apps")}>
                <LayoutDashboard size={15} /> Open generated app
              </button>
            ) : null}
          </div>
        </header>

        <main className="nk-content">
          <JourneyProgress
            activeView={activeView}
            hasDiscovery={Boolean(discovery)}
            hasApp={Boolean(appSpec)}
            navigate={navigate}
          />
          {activeView === "discover" ? (
            <DiscoverView
              workspace={workspace}
              goal={goal}
              sources={sources}
              sourceCharacters={sourceCharacters}
              loading={isDiscovering}
              discoveryStage={discoveryStage}
              setWorkspace={setWorkspace}
              setGoal={setGoal}
              loadDemo={loadDemoWorkspace}
              addFiles={addFiles}
              removeSource={(id) => setSources((current) => current.filter((source) => source.id !== id))}
              runDiscovery={runDiscovery}
              fileInput={fileInput}
            />
          ) : null}

          {activeView === "map" && discovery ? (
            <MapView
              discovery={discovery}
              selectedOpportunity={selectedOpportunity}
              selectOpportunity={chooseOpportunity}
              generateApplication={generateApplication}
              isGenerating={isGenerating}
              appSpec={appSpec}
              deployApplication={deployApplication}
            />
          ) : null}

          {activeView === "apps" && appSpec ? (
            <GeneratedAppView
              appSpec={appSpec}
              appTab={appTab}
              setAppTab={setAppTab}
              cases={visibleCases}
              selectedCase={selectedCase}
              selectCase={setSelectedCaseId}
              approveCase={approveCase}
              dismissCase={dismissCase}
              openCount={openCount}
              audit={audit}
              query={caseQuery}
              setQuery={setCaseQuery}
              showResolved={showResolved}
              setShowResolved={setShowResolved}
              isEvaluating={isEvaluating}
              runEvaluations={runEvaluations}
              deployed={seeded}
              deployApplication={deployApplication}
            />
          ) : null}

          {activeView === "audit" ? <AuditView items={audit} exportAudit={exportAudit} /> : null}
        </main>
      </div>

      {toast ? (
        <div className="nk-toast" role="status">
          <CheckCircle2 size={16} /> {toast}
          <button aria-label="Dismiss notification" onClick={() => setToast("")}><X size={14} /></button>
        </div>
      ) : null}
    </div>
  );
}

function JourneyProgress({
  activeView,
  hasDiscovery,
  hasApp,
  navigate,
}: {
  activeView: View;
  hasDiscovery: boolean;
  hasApp: boolean;
  navigate: (view: View) => void;
}) {
  const steps: Array<{ view: View; number: string; label: string; detail: string; enabled: boolean }> = [
    { view: "discover", number: "01", label: "Add context", detail: "Problem and evidence", enabled: true },
    { view: "map", number: "02", label: "Find the gap", detail: "Map and opportunities", enabled: hasDiscovery },
    { view: "apps", number: "03", label: "Run the app", detail: "Test and approve", enabled: hasApp },
  ];
  const activeIndex = activeView === "discover" ? 0 : activeView === "map" ? 1 : 2;

  return (
    <div className="journey-progress" aria-label="Build progress">
      {steps.map((step, index) => (
        <button
          key={step.view}
          className={`${index === activeIndex ? "journey-active" : ""} ${index < activeIndex ? "journey-complete" : ""}`}
          disabled={!step.enabled}
          onClick={() => navigate(step.view)}
        >
          <span>{index < activeIndex ? <Check size={13} /> : step.number}</span>
          <div><strong>{step.label}</strong><small>{step.detail}</small></div>
        </button>
      ))}
    </div>
  );
}

function DiscoverView({
  workspace,
  goal,
  sources,
  sourceCharacters,
  loading,
  discoveryStage,
  setWorkspace,
  setGoal,
  loadDemo,
  addFiles,
  removeSource,
  runDiscovery,
  fileInput,
}: {
  workspace: string;
  goal: string;
  sources: SourceDocument[];
  sourceCharacters: number;
  loading: boolean;
  discoveryStage: number;
  setWorkspace: (value: string) => void;
  setGoal: (value: string) => void;
  loadDemo: () => void;
  addFiles: (files: FileList | null) => void;
  removeSource: (id: string) => void;
  runDiscovery: () => void;
  fileInput: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <>
      <div className="product-heading">
        <div>
          <span className="eyebrow">Start with the work, not a blank canvas</span>
          <h1>Build the missing tool from how your company actually operates.</h1>
          <p>Give Neural Knights a problem and the evidence around it. You get a source-backed map, three useful app options, and a safe working application.</p>
        </div>
        <button className="secondary-button" onClick={loadDemo}>
          <Sparkles size={15} /> Try the Northstar demo
        </button>
      </div>

      <div className="discover-layout">
        <section className="surface problem-surface">
          <div className="surface-header">
            <span className="step-number">1</span>
            <div><h2>Describe the operation</h2><p>Start with the delay, repeated task, or decision you want to improve.</p></div>
          </div>
          <label className="field-label" htmlFor="workspace-name">Workspace</label>
          <input
            id="workspace-name"
            className="text-input"
            value={workspace}
            onChange={(event) => setWorkspace(event.target.value)}
            placeholder="Acme Operations"
          />
          <label className="field-label" htmlFor="problem-goal">Operational problem</label>
          <textarea
            id="problem-goal"
            className="problem-input"
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            placeholder="Our compliance reviews are delayed because the team moves cases between spreadsheets and chat..."
          />
          <div className="prompt-hints">
            <span>What breaks?</span><span>Who owns it?</span><span>What must stay controlled?</span>
          </div>
        </section>

        <section className="surface sources-surface">
          <div className="surface-header">
            <span className="step-number">2</span>
            <div><h2>Add knowledge sources</h2><p>For this MVP: CSV, JSON, Markdown, and plain text.</p></div>
          </div>

          <input
            ref={fileInput}
            type="file"
            hidden
            multiple
            accept=".csv,.json,.md,.markdown,.txt"
            onChange={(event) => addFiles(event.target.files)}
          />
          <button className="upload-zone" onClick={() => fileInput.current?.click()}>
            <span><Upload size={19} /></span>
            <strong>Choose source files</strong>
            <small>Up to 6 files, processed only for this workspace</small>
          </button>

          <div className="source-list">
            {sources.length ? sources.map((source) => (
              <div className="source-row" key={source.id}>
                <span className="source-file-icon">{source.kind === "json" ? <FileJson size={16} /> : <FileText size={16} />}</span>
                <div><strong>{source.name}</strong><small>{source.kind} / {source.content.length.toLocaleString()} characters</small></div>
                <button className="icon-button" onClick={() => removeSource(source.id)} aria-label={`Remove ${source.name}`}>
                  <X size={14} />
                </button>
              </div>
            )) : (
              <div className="empty-sources">No sources added yet.</div>
            )}
          </div>
          <div className="source-summary">
            <span>{sources.length}/6 sources</span><span>{sourceCharacters.toLocaleString()} characters</span>
          </div>
        </section>

        <aside className="intelligence-preview surface">
          <div className="preview-top">
            <span className="preview-mark"><BrainCircuit size={20} /></span>
            <div><span className="eyebrow">Workspace signal</span><h2>{loading ? "Understanding the operation" : "Ready to discover"}</h2></div>
            <span className="live-model-pill"><i /> {loading ? "Working" : "Live AI"}</span>
          </div>

          <div className="signal-canvas">
            <div className="signal-inputs">
              <span className={goal.trim() ? "signal-ready" : ""}><FileText size={14} /> Problem brief <Check size={12} /></span>
              <span className={sources.length ? "signal-ready" : ""}><Database size={14} /> {sources.length || 0} sources <Check size={12} /></span>
              <span className={sourceCharacters > 500 ? "signal-ready" : ""}><Link2 size={14} /> Evidence depth <Check size={12} /></span>
            </div>
            <div className="signal-flow">
              <span /><i /><span /><i /><span />
            </div>
            <div className="signal-output">
              <Network size={17} />
              <div><strong>Execution map</strong><small>Grounded in your sources</small></div>
              <ArrowRight size={14} />
              <LayoutDashboard size={17} />
            </div>
          </div>

          {loading ? (
            <div className="discovery-progress" aria-live="polite">
              <div className="progress-track"><span style={{ width: `${((discoveryStage + 1) / discoveryStages.length) * 100}%` }} /></div>
              {discoveryStages.map((stage, index) => (
                <div className={index <= discoveryStage ? "stage-active" : ""} key={stage}>
                  <span>{index < discoveryStage ? <Check size={11} /> : index === discoveryStage ? <LoaderCircle className="spin" size={11} /> : index + 1}</span>
                  {stage}
                </div>
              ))}
            </div>
          ) : (
            <div className="preview-outcomes">
              <div><strong>3</strong><span>ranked app options</span></div>
              <div><strong>1</strong><span>governed runtime</span></div>
              <div><strong>0</strong><span>arbitrary code paths</span></div>
            </div>
          )}

          <div className="safety-note"><ShieldCheck size={16} /><span>Source content is treated as evidence, never as instructions. External actions remain approval-gated.</span></div>
          <button className="primary-button discover-button" onClick={runDiscovery} disabled={loading}>
            {loading ? <><LoaderCircle className="spin" size={16} /> {discoveryStages[discoveryStage]}</> : <><Sparkles size={16} /> Discover what to build <ArrowRight size={16} /></>}
          </button>
        </aside>
      </div>
    </>
  );
}

function MapView({
  discovery,
  selectedOpportunity,
  selectOpportunity,
  generateApplication,
  isGenerating,
  appSpec,
  deployApplication,
}: {
  discovery: DiscoveryResult;
  selectedOpportunity: string;
  selectOpportunity: (id: string) => void;
  generateApplication: (opportunity?: Opportunity) => void;
  isGenerating: boolean;
  appSpec: AppSpec | null;
  deployApplication: () => void;
}) {
  const selected = discovery.blueprints.find((item) => item.id === selectedOpportunity);
  const initialNode = discovery.graph.nodes.find((node) => node.type === "problem") ?? discovery.graph.nodes[0];
  const [selectedNodeId, setSelectedNodeId] = useState(initialNode?.id ?? "");
  const selectedNode = discovery.graph.nodes.find((node) => node.id === selectedNodeId) ?? initialNode;
  const connections = discovery.graph.edges.filter(
    (edge) => edge.source === selectedNode?.id || edge.target === selectedNode?.id,
  );
  const averageConfidence = Math.round(
    (discovery.graph.edges.reduce((total, edge) => total + edge.confidence, 0) /
      Math.max(1, discovery.graph.edges.length)) *
      100,
  );
  const primaryOpportunity = discovery.opportunities.find((item) => item.recommended) ?? discovery.opportunities[0];

  return (
    <>
      <div className="page-heading">
        <div><span className="eyebrow">Company execution map</span><h1>{discovery.workspace}</h1><p>{discovery.summary}</p></div>
        <div className="map-heading-badges">
          {discovery.runtime ? (
            <span className={`runtime-badge runtime-${discovery.runtime.mode}`}>
              <i /> {discovery.runtime.mode === "live" ? `${discovery.runtime.model} / ${discovery.runtime.latencyMs} ms` : "Safe fallback"}
            </span>
          ) : null}
          <span className="evidence-badge"><BadgeCheck size={15} /> {discovery.sourceCount} sources mapped</span>
        </div>
      </div>

      {discovery.runtime?.fallbackReason ? (
        <div className="runtime-notice" role="status">
          <AlertTriangle size={15} />
          <span><strong>Deterministic fallback active.</strong> {discovery.runtime.fallbackReason}</span>
        </div>
      ) : null}

      <div className="metric-strip">
        <Metric value={`${discovery.graph.nodes.length}`} label="entities mapped" icon={Network} />
        <Metric value={`${discovery.graph.edges.length}`} label="evidence links" icon={Link2} />
        <Metric value={`${discovery.opportunities.length}`} label="apps recommended" icon={LayoutDashboard} />
        <Metric value="1" label="approval boundary" icon={ShieldCheck} />
      </div>

      <div className="map-layout">
        <section className="surface graph-surface">
          <div className="panel-heading"><div><h2>How work happens today</h2><p>Select any entity to inspect the evidence behind it.</p></div><span className="confidence-key"><i /> {averageConfidence}% avg. confidence</span></div>
          <div className="graph-board">
            {discovery.graph.nodes.map((node) => {
              const Icon = nodeIcons[node.type];
              return (
                <button
                  className={`graph-node node-${node.type} ${selectedNode?.id === node.id ? "graph-node-active" : ""}`}
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                >
                  <span><Icon size={15} /></span>
                  <div><small>{node.type}</small><strong>{node.label}</strong><p>{node.detail}</p></div>
                </button>
              );
            })}
          </div>
          <div className="relationship-list">
            {discovery.graph.edges.slice(0, 4).map((edge) => {
              const source = discovery.graph.nodes.find((node) => node.id === edge.source);
              const target = discovery.graph.nodes.find((node) => node.id === edge.target);
              return (
                <div key={edge.id}>
                  <strong>{source?.label}</strong><span>{edge.relation}</span><strong>{target?.label}</strong>
                  <small>{Math.round(edge.confidence * 100)}%</small>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="surface diagnosis-surface">
          <div className="panel-heading"><div><h2>Evidence inspector</h2><p>Why this entity exists in the map</p></div><FileText size={18} /></div>
          <span className="diagnosis-label">{selectedNode?.type || "entity"}</span>
          <h3>{selectedNode?.label}</h3>
          <p>{selectedNode?.detail}</p>
          <div className="diagnosis-evidence">
            {(selectedNode?.evidenceIds ?? []).map((evidenceId) => (
              <span key={evidenceId}><FileText size={14} /> Source: {evidenceId}</span>
            ))}
            <span><Link2 size={14} /> {connections.length} mapped relationship{connections.length === 1 ? "" : "s"}</span>
          </div>
          <div className="primary-opportunity-note">
            <span><Sparkles size={13} /> Strongest opportunity</span>
            <strong>{primaryOpportunity?.title}</strong>
            <p>{primaryOpportunity?.evidence}</p>
          </div>
        </aside>
      </div>

      <section className="opportunity-section">
        <div className="section-heading"><div><span className="eyebrow">Recommended applications</span><h2>Choose what Neural Knights should build</h2></div><p>Ranked by impact, frequency, and available evidence.</p></div>
        <div className="opportunity-grid">
          {discovery.opportunities.map((opportunity) => (
            <button
              className={`opportunity-card ${selectedOpportunity === opportunity.id ? "opportunity-selected" : ""}`}
              key={opportunity.id}
              onClick={() => selectOpportunity(opportunity.id)}
            >
              <div className="opportunity-top">
                <span className="app-icon"><LayoutDashboard size={17} /></span>
                {opportunity.recommended ? <span className="recommended-label"><Sparkles size={12} /> Recommended</span> : null}
                <span className={`impact-score ${scoreTone(opportunity.impactScore)}`}>{opportunity.impactScore}</span>
              </div>
              <h3>{opportunity.title}</h3>
              <p>{opportunity.problem}</p>
              <div className="opportunity-evidence"><FileText size={14} /><span>{opportunity.evidence}</span></div>
              <div className="opportunity-footer"><span>Impact {opportunity.impactScore}</span><span>Frequency {opportunity.frequencyScore}</span><CircleDot size={15} /></div>
            </button>
          ))}
        </div>
      </section>

      {selected ? (
        <section className="blueprint-bar">
          <div className="blueprint-icon"><Workflow size={20} /></div>
          <div className="blueprint-copy"><span className="eyebrow">Selected blueprint</span><h3>{selected.name}</h3><p>{selected.summary}</p></div>
          <div className="blueprint-path">
            {selected.steps.map((step, index) => <span key={step}>{step}{index < selected.steps.length - 1 ? <ChevronRight size={13} /> : null}</span>)}
          </div>
          {appSpec ? (
            <button className="primary-button" onClick={deployApplication}><Rocket size={15} /> Deploy app</button>
          ) : (
            <button className="primary-button" onClick={() => generateApplication()} disabled={isGenerating}>
              {isGenerating ? <><LoaderCircle className="spin" size={15} /> Generating</> : <><Sparkles size={15} /> Generate app</>}
            </button>
          )}
        </section>
      ) : null}
    </>
  );
}

function Metric({ value, label, icon: Icon }: { value: string; label: string; icon: typeof Network }) {
  return <div className="map-metric"><span><Icon size={16} /></span><strong>{value}</strong><small>{label}</small></div>;
}

function GeneratedAppView({
  appSpec,
  appTab,
  setAppTab,
  cases,
  selectedCase,
  selectCase,
  approveCase,
  dismissCase,
  openCount,
  audit,
  query,
  setQuery,
  showResolved,
  setShowResolved,
  isEvaluating,
  runEvaluations,
  deployed,
  deployApplication,
}: {
  appSpec: AppSpec;
  appTab: AppTab;
  setAppTab: (tab: AppTab) => void;
  cases: Complaint[];
  selectedCase: Complaint;
  selectCase: (id: string) => void;
  approveCase: (id: string) => void;
  dismissCase: (id: string) => void;
  openCount: number;
  audit: string[];
  query: string;
  setQuery: (value: string) => void;
  showResolved: boolean;
  setShowResolved: (value: boolean) => void;
  isEvaluating: boolean;
  runEvaluations: () => void;
  deployed: boolean;
  deployApplication: () => void;
}) {
  const displayedCase = cases.find((item) => item.id === selectedCase.id) ?? cases[0];

  return (
    <>
      <div className="app-heading">
        <div className="generated-app-title">
          <span className="generated-mark"><LayoutDashboard size={20} /></span>
          <div><span className="eyebrow">Generated application</span><h1>{appSpec.name}</h1><p>{appSpec.description}</p></div>
        </div>
        <div className="app-heading-actions">
          <span className="version-badge"><i /> v{appSpec.version} healthy</span>
          {!deployed ? <button className="primary-button" onClick={deployApplication}><Rocket size={15} /> Deploy app</button> : null}
        </div>
      </div>

      <div className="app-tabs" role="tablist" aria-label="Generated app views">
        <button className={appTab === "queue" ? "tab-active" : ""} onClick={() => setAppTab("queue")}>Complaint queue <span>{openCount}</span></button>
        <button className={appTab === "evaluations" ? "tab-active" : ""} onClick={() => setAppTab("evaluations")}>Evaluations</button>
        <button className={appTab === "rules" ? "tab-active" : ""} onClick={() => setAppTab("rules")}>Rules & safety</button>
      </div>

      {appTab === "queue" ? (
        <>
          <div className="queue-metrics">
            <Metric value={`${openCount}`} label="open complaints" icon={AlertTriangle} />
            <Metric value="2" label="outside policy" icon={Clock3} />
            <Metric value="12/12" label="checks passing" icon={BadgeCheck} />
            <Metric value="100%" label="actions approval-gated" icon={LockKeyhole} />
          </div>
          <div className="case-layout">
            <section className="surface case-browser">
              <div className="case-tools">
                <label><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search complaints" /></label>
                <button
                  className={`secondary-button ${showResolved ? "filter-active" : ""}`}
                  onClick={() => setShowResolved(!showResolved)}
                >
                  <SlidersHorizontal size={14} /> {showResolved ? "All cases" : "Open only"}
                </button>
              </div>
              <div className="case-list">
                {cases.length ? cases.map((item) => (
                  <button
                    className={selectedCase.id === item.id ? "case-selected" : ""}
                    key={item.id}
                    onClick={() => selectCase(item.id)}
                  >
                    <span className={`severity-dot severity-${item.severity}`} />
                    <div><span><strong>{item.title}</strong><small className={`case-status-${item.status}`}>{item.status === "open" ? item.severity : item.status}</small></span><p>{item.summary}</p><em>{item.id} / {item.product}</em></div>
                    <aside><strong>{item.status === "open" ? item.deadline : item.status}</strong><small>{item.age} open</small><ChevronRight size={15} /></aside>
                  </button>
                )) : <div className="empty-case-list"><Search size={18} /><strong>No matching cases</strong><span>Clear the search or include resolved cases.</span></div>}
              </div>
            </section>
            {displayedCase ? <CaseInspector item={displayedCase} approveCase={approveCase} dismissCase={dismissCase} /> : (
              <aside className="surface case-inspector empty-inspector"><CheckCircle2 size={24} /><strong>Queue is clear</strong><span>No cases match the current view.</span></aside>
            )}
          </div>
        </>
      ) : null}

      {appTab === "evaluations" ? (
        <section className="surface evaluation-panel">
          <div className="evaluation-score">
            {isEvaluating ? <LoaderCircle className="spin" size={25} /> : <CheckCircle2 size={25} />}
            <strong>{isEvaluating ? "Running" : `${appSpec.evaluation.passed}/${appSpec.evaluation.total}`}</strong>
            <span>{isEvaluating ? "replaying historical scenarios" : "historical scenarios passed"}</span>
            <button className="secondary-button" onClick={runEvaluations} disabled={isEvaluating}><RefreshCcw size={14} /> Run checks again</button>
          </div>
          <div className="evaluation-list">
            {["High-risk complaint requires compliance review", "Transfer failure routes to Payments Operations", "Financial commitment remains approval-gated", "Every decision includes source evidence"].map((item) => (
              <div key={item}><Check size={15} /><span><strong>{item}</strong><small>Expected and actual decisions matched</small></span><em>Passed</em></div>
            ))}
          </div>
        </section>
      ) : null}

      {appTab === "rules" ? (
        <div className="rules-layout">
          <section className="surface rule-list">
            <div className="panel-heading"><div><h2>Generated workflow rules</h2><p>Versioned rules derived from policy evidence.</p></div><GitBranch size={18} /></div>
            {appSpec.rules.map((rule) => (
              <article key={rule.id}>
                <span className="rule-icon"><Workflow size={15} /></span>
                <div><strong>If {rule.condition}</strong><p>Then {rule.outcome}</p></div>
                {rule.approvalRequired ? <span className="approval-pill"><LockKeyhole size={12} /> Approval</span> : <span className="automatic-pill">Automatic</span>}
              </article>
            ))}
          </section>
          <section className="surface safety-panel">
            <ShieldCheck size={23} />
            <h2>Constrained by design</h2>
            <p>This app can draft responses, request review, and queue escalations. It cannot send financial commitments or execute arbitrary code.</p>
            <div>{appSpec.allowedActions.map((action) => <span key={action}><Check size={13} /> {action.replaceAll("_", " ")}</span>)}</div>
          </section>
        </div>
      ) : null}

      <section className="runtime-audit">
        <div><Activity size={16} /><strong>Latest runtime activity</strong></div>
        <span>{audit[0]}</span>
        <small>Recorded with actor, evidence, and app version</small>
      </section>
    </>
  );
}

function CaseInspector({
  item,
  approveCase,
  dismissCase,
}: {
  item: Complaint;
  approveCase: (id: string) => void;
  dismissCase: (id: string) => void;
}) {
  return (
    <aside className="surface case-inspector">
      <div className="inspector-top"><div><span className="eyebrow">Evidence-backed case</span><h2>{item.id}</h2></div><span className="confidence-badge">96% confidence</span></div>
      <h3>{item.title}</h3>
      <section><span className="section-label">Source evidence</span><div className="inspector-evidence">
        {item.evidence.map((evidence) => <div key={evidence}><FileText size={14} /><span>{evidence}</span></div>)}
      </div></section>
      <section><span className="section-label">Reasoning</span><p className="reasoning-copy">{item.summary} The active policy and complaint attributes support the proposed route.</p></section>
      <section>
        <span className="section-label">Proposed governed action</span>
        <div className="proposed-action"><ShieldCheck size={17} /><strong>{item.action}</strong></div>
        <div className="draft-response"><span>Prepared escalation</span><p>{item.draft}</p></div>
      </section>
      {item.status !== "open" ? (
        <div className={`approved-state state-${item.status}`}>
          <CheckCircle2 size={16} /> {item.status === "approved" ? "Approved and queued by a human" : "Dismissed by a human"}
        </div>
      ) : (
        <div className="inspector-actions">
          <button className="secondary-button" onClick={() => dismissCase(item.id)}><X size={15} /> Dismiss</button>
          <button className="primary-button inspector-approve" onClick={() => approveCase(item.id)}>
            <Check size={16} /> Approve and queue
          </button>
        </div>
      )}
    </aside>
  );
}

function AuditView({ items, exportAudit }: { items: string[]; exportAudit: () => void }) {
  return (
    <>
      <div className="page-heading"><div><span className="eyebrow">Governance</span><h1>Audit log</h1><p>Evidence access, generated rules, evaluations, and human decisions.</p></div><button className="secondary-button" onClick={exportAudit}><Download size={14} /> Export JSON</button></div>
      <section className="surface audit-panel">
        {items.map((item, index) => (
          <article key={`${item}-${index}`}>
            <span className="audit-icon">{index === 0 ? <Activity size={15} /> : <CheckCircle2 size={15} />}</span>
            <div><strong>{item}</strong><p>Recorded in the Northstar Payments workspace with source provenance.</p></div>
            <small>{index === 0 ? "Just now" : `${index * 4 + 2} min ago`}</small>
          </article>
        ))}
      </section>
    </>
  );
}
