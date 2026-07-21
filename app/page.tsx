"use client";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  Boxes,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Database,
  FileText,
  GitBranch,
  LayoutDashboard,
  Mail,
  Menu,
  MessageSquare,
  Play,
  Plug,
  Plus,
  RefreshCcw,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  TestTube2,
  Webhook,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type View = "overview" | "cases" | "workflows" | "connections" | "activity";
type Severity = "critical" | "high" | "medium";
type CaseStatus = "open" | "approved" | "dismissed";

type OpsCase = {
  id: string;
  title: string;
  summary: string;
  type: string;
  severity: Severity;
  exposure: string;
  source: string;
  age: string;
  status: CaseStatus;
  confidence: number;
  evidence: string[];
  reasoning: string;
  action: string;
  draft: string;
};

export type EvidenceEvent = {
  id: string;
  source: string;
  connectorId: string;
  type: string;
  payload: string;
  receivedAt: string;
};

type AnalyzeResult = {
  mode?: string;
  caseId?: string;
  category?: string;
  severity?: string;
  confidence?: number;
  finding?: string;
  recommendedAction?: string;
};

export type RealAgentResult = {
  mode: "live_tools" | "demo_tools";
  toolTrace: string[];
  orders: Array<{ name: string; displayFulfillmentStatus?: string; tags?: string[]; total?: string }>;
  messages: Array<{ text: string; user?: string }>;
  case: {
    id: string;
    title: string;
    severity: Severity;
    confidence: number;
    evidence: string[];
    reasoning: string;
    recommendedAction: string;
    draftSlackMessage: string;
  };
  approvalRequired: boolean;
};

export type FulfillGuardDemoState = {
  activeView?: View;
  selectedCaseId?: string;
  approvedCaseIds?: string[];
  connectedConnectorIds?: string[];
  evidenceEvents?: EvidenceEvent[];
  connectorDialog?: string | null;
  workflowDialog?: boolean;
  buildStep?: number;
  maintenanceOpen?: boolean;
  changeReady?: boolean;
  changeDeployed?: boolean;
  inboxAnalyzing?: boolean;
  evidenceAnalyzing?: boolean;
  realAgentRunning?: boolean;
  realAgentResult?: RealAgentResult | null;
  slackSending?: boolean;
  toast?: string;
  problem?: string;
};

const initialCases: OpsCase[] = [
  {
    id: "FG-1042",
    title: "3PL charged above contracted pick rate",
    summary: "First-pick rate is $0.50 above contract across 964 June orders.",
    type: "Billing",
    severity: "critical",
    exposure: "$482.00",
    source: "Gmail + Rate card",
    age: "18 min",
    status: "open",
    confidence: 98,
    evidence: [
      "June invoice: FIRST_PICK = $2.30 x 964",
      "Contract section 4.2: first pick = $1.80",
      "Order export confirms 964 first-pick events",
    ],
    reasoning:
      "The invoice quantity matches order activity, but the unit rate does not match the active rate card. No fuel or peak-season clause applies to pick fees.",
    action: "Send evidence-backed billing dispute to Northstar 3PL",
    draft:
      "Hi Northstar team, we found a $482.00 variance on June first-pick charges. The invoice applies $2.30 to 964 orders, while section 4.2 of our active agreement specifies $1.80. Please review the attached reconciliation and issue a credit.",
  },
  {
    id: "FG-1041",
    title: "Priority order will miss dispatch SLA",
    summary: "Order #5841 has been paid for 18 hours and is still awaiting pick.",
    type: "Fulfillment",
    severity: "high",
    exposure: "$186 order",
    source: "Slack + Shopify",
    age: "32 min",
    status: "open",
    confidence: 94,
    evidence: [
      "Shopify: paid at 09:14 yesterday",
      "WMS: status remains Awaiting pick",
      "Slack #warehouse: SKU LUMA-04 moved to overflow bin",
    ],
    reasoning:
      "The order is within the 24-hour contractual SLA but cannot meet it at the current queue velocity. The warehouse message explains the likely picking delay.",
    action: "Escalate the pick and prepare a proactive customer update",
    draft:
      "Order #5841 is at risk of missing the priority dispatch SLA. Please move SKU LUMA-04 from overflow and confirm the pick within two hours. A customer update is ready if dispatch is not confirmed.",
  },
  {
    id: "FG-1039",
    title: "Eight units disappeared after cycle count",
    summary: "Warehouse stock fell from 143 to 135 without an order or damage event.",
    type: "Inventory",
    severity: "medium",
    exposure: "$344 cost",
    source: "ERP + 3PL WMS",
    age: "2 hr",
    status: "open",
    confidence: 91,
    evidence: [
      "ERP closing balance: 143 units",
      "WMS cycle-count result: 135 units",
      "No sale, return, damage, or transfer event explains -8",
    ],
    reasoning:
      "The adjustment is operationally unexplained and exceeds the 0.5% shrinkage review threshold. The 3PL did not send the required adjustment notice.",
    action: "Open an inventory investigation and reserve affected orders",
    draft:
      "Please investigate the unexplained eight-unit adjustment for SKU KIN-22. We have attached the ERP ledger, cycle count, and movement history. No matching outbound or damage event exists.",
  },
];

const connectorSeed = [
  { id: "gmail", name: "Gmail", detail: "Ops inbox and 3PL invoices", icon: Mail, connected: false, accent: "red" },
  { id: "slack", name: "Slack", detail: "#warehouse and #support", icon: MessageSquare, connected: false, accent: "violet" },
  { id: "shopify", name: "Shopify", detail: "Orders and fulfillment", icon: ShoppingBag, connected: false, accent: "green" },
  { id: "salesforce", name: "Salesforce", detail: "Accounts and escalations", icon: Database, connected: false, accent: "blue" },
  { id: "netsuite", name: "NetSuite", detail: "Inventory and invoices", icon: Boxes, connected: false, accent: "orange" },
  { id: "webhook", name: "Webhook", detail: "Any ERP or internal system", icon: Webhook, connected: false, accent: "gray" },
];

const connectorSamples: Record<string, string> = {
  gmail:
    "From: Maya at Northstar 3PL\nSubject: June invoice\nPick fees were billed at $2.30 per first pick across 964 orders. Arc Goods contract says first pick should be $1.80.",
  slack:
    "#warehouse: Priority order #5841 is still awaiting pick. SKU LUMA-04 was moved to overflow bin B-17 and needs supervisor escalation.",
  shopify:
    '{"order_id":"5841","paid_at":"2026-07-19T09:14:00Z","fulfillment_status":"unfulfilled","tags":["priority"],"sku":"LUMA-04"}',
  salesforce:
    "Account Arc Goods has a priority customer escalation open. Customer expects same-day dispatch confirmation.",
  netsuite:
    "SKU KIN-22 closing balance 143, WMS cycle count 135, no sale/return/damage transfer found.",
  webhook:
    '{"source":"3pl_wms","event":"inventory_adjustment","sku":"KIN-22","before":143,"after":135,"reason":null}',
};

function readSavedEvidence() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem("fulfillguard:evidence") || "[]") as EvidenceEvent[];
  } catch {
    return [];
  }
}

const workflows = [
  { name: "3PL invoice compliance", trigger: "New invoice email", actions: 5, health: "Healthy", lastRun: "18 min ago" },
  { name: "Dispatch SLA monitor", trigger: "Order paid", actions: 7, health: "Healthy", lastRun: "6 min ago" },
  { name: "Inventory drift investigator", trigger: "Stock changed", actions: 6, health: "Review", lastRun: "2 hr ago" },
];

const activities = [
  { time: "10:42", agent: "Operations agent", text: "Opened FG-1042 from a new Northstar invoice", tone: "red" },
  { time: "10:41", agent: "Evidence agent", text: "Matched 964 invoice rows to Shopify orders", tone: "blue" },
  { time: "10:40", agent: "Contract agent", text: "Located the active first-pick rate in section 4.2", tone: "green" },
  { time: "10:18", agent: "Maintainer agent", text: "Validated dispatch workflow against 24 historical cases", tone: "violet" },
  { time: "09:57", agent: "Connector monitor", text: "Slack and Shopify sync completed", tone: "gray" },
];

const navItems: { id: View; label: string; icon: typeof LayoutDashboard; count?: number }[] = [
  { id: "overview", label: "Command center", icon: LayoutDashboard },
  { id: "cases", label: "Cases", icon: AlertTriangle, count: 3 },
  { id: "workflows", label: "Workflows", icon: Workflow },
  { id: "connections", label: "Connections", icon: Plug },
  { id: "activity", label: "Audit log", icon: Activity },
];

function SeverityPill({ severity }: { severity: Severity }) {
  return <span className={`severity severity-${severity}`}>{severity}</span>;
}

function SourceIcon({ source }: { source: string }) {
  if (source.includes("Gmail")) return <Mail size={14} />;
  if (source.includes("Slack")) return <MessageSquare size={14} />;
  return <Database size={14} />;
}

export function FulfillGuardApp({ demoState }: { demoState?: FulfillGuardDemoState }) {
  const [activeView, setActiveView] = useState<View>(demoState?.activeView ?? "overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cases, setCases] = useState(() =>
    initialCases.map((item) =>
      demoState?.approvedCaseIds?.includes(item.id) ? { ...item, status: "approved" as const } : item
    )
  );
  const [selectedCaseId, setSelectedCaseId] = useState(demoState?.selectedCaseId ?? initialCases[0].id);
  const [query, setQuery] = useState("");
  const [evidenceEvents, setEvidenceEvents] = useState<EvidenceEvent[]>(() =>
    demoState?.evidenceEvents ?? readSavedEvidence()
  );
  const [connectors, setConnectors] = useState(() => {
    const saved = demoState?.evidenceEvents ?? readSavedEvidence();
    return connectorSeed.map((item) => ({
      ...item,
      connected:
        demoState?.connectedConnectorIds?.includes(item.id) ||
        saved.some((event) => event.connectorId === item.id),
    }));
  });
  const [connectorDialog, setConnectorDialog] = useState<string | null>(demoState?.connectorDialog ?? null);
  const [connectorPayload, setConnectorPayload] = useState("");
  const [toast, setToast] = useState(demoState?.toast ?? "");
  const [workflowDialog, setWorkflowDialog] = useState(demoState?.workflowDialog ?? false);
  const [problem, setProblem] = useState(
    demoState?.problem ?? "Detect 3PL billing errors and fulfillment failures before they cost us money or customers."
  );
  const [buildStep, setBuildStep] = useState(demoState?.buildStep ?? -1);
  const [maintenanceOpen, setMaintenanceOpen] = useState(demoState?.maintenanceOpen ?? false);
  const [changeReady, setChangeReady] = useState(demoState?.changeReady ?? false);
  const [changeDeployed, setChangeDeployed] = useState(demoState?.changeDeployed ?? false);
  const [inboxAnalyzing, setInboxAnalyzing] = useState(demoState?.inboxAnalyzing ?? false);
  const [evidenceAnalyzing, setEvidenceAnalyzing] = useState(demoState?.evidenceAnalyzing ?? false);
  const [realAgentRunning, setRealAgentRunning] = useState(demoState?.realAgentRunning ?? false);
  const [realAgentResult, setRealAgentResult] = useState<RealAgentResult | null>(
    demoState?.realAgentResult ?? null
  );
  const [slackSending, setSlackSending] = useState(demoState?.slackSending ?? false);

  const selectedCase = cases.find((item) => item.id === selectedCaseId) ?? cases[0];
  const openCases = cases.filter((item) => item.status === "open");
  const filteredCases = useMemo(
    () =>
      cases.filter((item) =>
        `${item.id} ${item.title} ${item.summary} ${item.type}`.toLowerCase().includes(query.toLowerCase())
      ),
    [cases, query]
  );

  useEffect(() => {
    if (demoState) return;
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [demoState, toast]);

  useEffect(() => {
    if (demoState) return;
    window.localStorage.setItem("fulfillguard:evidence", JSON.stringify(evidenceEvents));
  }, [demoState, evidenceEvents]);

  useEffect(() => {
    if (demoState) return;
    if (buildStep < 0 || buildStep >= 4) return;
    const timeout = window.setTimeout(() => setBuildStep((step) => step + 1), 850);
    return () => window.clearTimeout(timeout);
  }, [buildStep, demoState]);

  const workflowBuilt = buildStep === 4;

  function approveCase(id: string) {
    setCases((items) => items.map((item) => (item.id === id ? { ...item, status: "approved" } : item)));
    setToast("Action approved and recorded in the audit log");
  }

  function dismissCase(id: string) {
    setCases((items) => items.map((item) => (item.id === id ? { ...item, status: "dismissed" } : item)));
    setToast("Case dismissed with evidence retained");
  }

  function openConnector(id: string) {
    setConnectorDialog(id);
    setConnectorPayload(connectorSamples[id] ?? "");
  }

  function mergeEvidence(events: EvidenceEvent[]) {
    setEvidenceEvents((items) => {
      const seen = new Set(items.map((item) => item.id));
      return [...items, ...events.filter((event) => !seen.has(event.id))].slice(-25);
    });
  }

  async function saveConnectorEvidence() {
    if (!connectorDialog || !connectorPayload.trim()) return;
    const connector = connectors.find((item) => item.id === connectorDialog);
    const event: EvidenceEvent = {
      id: `evt_${Date.now()}`,
      source: connector?.name ?? "External source",
      connectorId: connectorDialog,
      type: connectorDialog === "webhook" ? "webhook_event" : "manual_import",
      payload: connectorPayload.trim(),
      receivedAt: new Date().toISOString(),
    };

    mergeEvidence([event]);
    setConnectors((items) =>
      items.map((item) => (item.id === connectorDialog ? { ...item, connected: true } : item))
    );
    setConnectorDialog(null);
    setConnectorPayload("");
    setToast(`${event.source} evidence imported and ready for analysis`);

    await fetch("/api/evidence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    }).catch(() => undefined);
  }

  async function syncWebhookEvents() {
    const response = await fetch("/api/evidence");
    const result = (await response.json()) as { events?: EvidenceEvent[] };
    mergeEvidence(result.events ?? []);
    setToast(`Synced ${(result.events ?? []).length} webhook/import events`);
  }

  function caseFromAnalysis(result: AnalyzeResult): OpsCase {
    const id = `FG-${Math.floor(2000 + Math.random() * 7000)}`;
    const severity = result.severity === "critical" || result.severity === "high" ? result.severity : "medium";
    const evidence = evidenceEvents.slice(-4).map((event) => `${event.source}: ${event.payload.slice(0, 120)}`);
    const confidence = result.confidence && result.confidence > 1 ? result.confidence : (result.confidence ?? 0.86) * 100;
    return {
      id,
      title: result.finding?.slice(0, 72) || "Connected evidence requires operations review",
      summary: result.finding || "Agents found a risk in connected operational evidence.",
      type: result.category?.replace(/_/g, " ") || "Connected evidence",
      severity,
      exposure: "Review",
      source: evidenceEvents.map((event) => event.source).filter((value, index, array) => array.indexOf(value) === index).join(" + ") || "Connected sources",
      age: "now",
      status: "open",
      confidence: Math.round(confidence),
      evidence: evidence.length ? evidence : ["Imported connector evidence was analyzed"],
      reasoning: result.finding || "The agent compared the imported evidence against the operating problem statement.",
      action: result.recommendedAction || "Create an operations task and require human approval before external action",
      draft: result.recommendedAction || "A connected-source issue was detected. Review the evidence before approving the next action.",
    };
  }

  async function analyzeEvidence() {
    if (!evidenceEvents.length) {
      setToast("Import connector evidence first");
      return;
    }
    setEvidenceAnalyzing(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem: "Detect ecommerce fulfillment, billing, inventory, or SLA risk from connected app evidence.",
          conversation: evidenceEvents.map((event) => `[${event.source}] ${event.payload}`),
        }),
      });
      const result = (await response.json()) as AnalyzeResult;
      const nextCase = caseFromAnalysis(result);
      setCases((items) => [nextCase, ...items]);
      setSelectedCaseId(nextCase.id);
      setActiveView("cases");
      setToast(`${result.mode === "live" ? "Live" : "Demo"} agent created ${nextCase.id} from connected evidence`);
    } finally {
      setEvidenceAnalyzing(false);
    }
  }

  function addAgentCase(result: RealAgentResult) {
    const nextCase: OpsCase = {
      id: result.case.id,
      title: result.case.title,
      summary: result.case.reasoning,
      type: "Fulfillment",
      severity: result.case.severity,
      exposure: result.orders[0]?.total ?? "SLA risk",
      source: "Shopify + Slack",
      age: "now",
      status: "open",
      confidence: result.case.confidence,
      evidence: result.case.evidence,
      reasoning: result.case.reasoning,
      action: result.case.recommendedAction,
      draft: result.case.draftSlackMessage,
    };

    setCases((items) => [nextCase, ...items.filter((item) => item.id !== nextCase.id)]);
    setSelectedCaseId(nextCase.id);
    setActiveView("cases");
  }

  async function runRealAgent() {
    setRealAgentRunning(true);
    try {
      const response = await fetch("/api/agent/fulfillment-risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const result = (await response.json()) as RealAgentResult;
      setRealAgentResult(result);
      addAgentCase(result);
      setToast(`${result.mode === "live_tools" ? "Live" : "Demo"} tools created ${result.case.id}`);
    } finally {
      setRealAgentRunning(false);
    }
  }

  async function sendSlackEscalation() {
    if (!realAgentResult) return;
    setSlackSending(true);
    try {
      const response = await fetch("/api/agent/fulfillment-risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approveSlackSend: true,
          draftSlackMessage: realAgentResult.case.draftSlackMessage,
        }),
      });
      const result = (await response.json()) as { delivery?: { ok?: boolean; mode?: string } };
      setToast(result.delivery?.ok ? "Slack escalation sent" : "Slack send needs SLACK_BOT_TOKEN and SLACK_CHANNEL_ID");
    } finally {
      setSlackSending(false);
    }
  }

  async function analyzeInbox() {
    setInboxAnalyzing(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem: "Check this 3PL invoice conversation for contract or operational risk.",
          conversation: [
            "Northstar: Pick-and-pack pricing reflects the updated service schedule.",
            "Arc Goods: We cannot find an updated schedule in the signed agreement.",
          ],
        }),
      });
      const result = (await response.json()) as { mode?: string };
      setInboxAnalyzing(false);
      setSelectedCaseId("FG-1042");
      setActiveView("cases");
      setToast(`${result.mode === "live" ? "Live" : "Demo"} agents analyzed the thread and built case FG-1042`);
    } catch {
      setInboxAnalyzing(false);
      setSelectedCaseId("FG-1042");
      setActiveView("cases");
      setToast("Demo agents analyzed the thread and built case FG-1042");
    }
  }

  function startWorkflowBuild() {
    setBuildStep(0);
  }

  const recovered = cases.some((item) => item.id === "FG-1042" && item.status === "approved") ? "$482" : "$0";

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand-row">
          <div className="brand-mark"><ShieldCheck size={19} /></div>
          <div>
            <div className="brand-name">FulfillGuard</div>
            <div className="brand-caption">Adaptive operations</div>
          </div>
          <button className="icon-button mobile-close" aria-label="Close navigation" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="workspace-switcher">
          <div className="workspace-avatar">AG</div>
          <div className="workspace-copy">
            <strong>Arc Goods</strong>
            <span>Production workspace</span>
          </div>
          <ChevronDown size={14} />
        </div>

        <nav className="side-nav" aria-label="Primary navigation">
          <div className="nav-label">Workspace</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={`nav-item ${activeView === item.id ? "nav-item-active" : ""}`}
                key={item.id}
                onClick={() => { setActiveView(item.id); setSidebarOpen(false); }}
              >
                <Icon size={17} />
                <span>{item.label}</span>
                {item.count ? <span className="nav-count">{openCases.length}</span> : null}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="runtime-box">
            <div className="runtime-top"><span className="status-dot" /> Agent runtime</div>
            <div className="runtime-value">4 agents healthy</div>
            <div className="runtime-meta">Last check 26 sec ago</div>
          </div>
          <button className="nav-item"><Settings size={17} /><span>Settings</span></button>
          <div className="user-row">
            <div className="user-avatar">AK</div>
            <div><strong>Akshay</strong><span>Workspace owner</span></div>
            <ChevronDown size={14} />
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button menu-button" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}>
            <Menu size={19} />
          </button>
          <div className="topbar-title">
            <span>{navItems.find((item) => item.id === activeView)?.label}</span>
            <div className="live-indicator"><span /> Live</div>
          </div>
          <div className="topbar-actions">
            <button className="icon-button" aria-label="Search cases" onClick={() => setActiveView("cases")}><Search size={18} /></button>
            <button className="secondary-button" onClick={() => setActiveView("connections")}><Plug size={16} /> Connect</button>
            <button className="primary-button" onClick={() => setWorkflowDialog(true)}><Plus size={16} /> New workflow</button>
          </div>
        </header>

        <div className="page-content">
          {activeView === "overview" && (
            <Overview
              cases={cases}
              selectedCase={selectedCase}
              setSelectedCaseId={setSelectedCaseId}
              setActiveView={setActiveView}
              approveCase={approveCase}
              recovered={recovered}
            />
          )}

          {activeView === "cases" && (
            <CasesView
              cases={filteredCases}
              selectedCase={selectedCase}
              query={query}
              setQuery={setQuery}
              selectCase={setSelectedCaseId}
              approveCase={approveCase}
              dismissCase={dismissCase}
            />
          )}

          {activeView === "workflows" && (
            <WorkflowsView
              openMaintenance={() => { setMaintenanceOpen(true); setChangeReady(false); setChangeDeployed(false); }}
              openBuilder={() => setWorkflowDialog(true)}
            />
          )}

          {activeView === "connections" && (
            <ConnectionsView
              connectors={connectors}
              openConnector={openConnector}
              analyzeInbox={analyzeInbox}
              inboxAnalyzing={inboxAnalyzing}
              evidenceEvents={evidenceEvents}
              analyzeEvidence={analyzeEvidence}
              syncWebhookEvents={syncWebhookEvents}
              evidenceAnalyzing={evidenceAnalyzing}
              realAgentRunning={realAgentRunning}
              realAgentResult={realAgentResult}
              runRealAgent={runRealAgent}
              sendSlackEscalation={sendSlackEscalation}
              slackSending={slackSending}
            />
          )}

          {activeView === "activity" && <ActivityView />}
        </div>
      </main>

      {workflowDialog && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setWorkflowDialog(false)}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="workflow-title" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div><span className="eyebrow">Application builder</span><h2 id="workflow-title">Describe the operational problem</h2></div>
              <button className="icon-button" aria-label="Close" onClick={() => setWorkflowDialog(false)}><X size={18} /></button>
            </div>

            {!workflowBuilt ? (
              <>
                <label className="field-label" htmlFor="problem">What should the agents watch and resolve?</label>
                <textarea id="problem" value={problem} onChange={(e) => setProblem(e.target.value)} />
                <div className="attached-sources">
                  <span><Mail size={14} /> Gmail</span>
                  <span><MessageSquare size={14} /> Slack</span>
                  <span><ShoppingBag size={14} /> Shopify</span>
                  <button><Plus size={13} /> Add source</button>
                </div>

                {buildStep >= 0 && (
                  <div className="agent-build-list">
                    {["Discovery agent is mapping the problem", "Data agent is identifying business entities", "Builder agent is composing triggers and actions", "Validator agent is running 24 historical tests"].map((label, index) => (
                      <div className={`build-step ${buildStep > index ? "done" : buildStep === index ? "running" : ""}`} key={label}>
                        <span>{buildStep > index ? <Check size={14} /> : buildStep === index ? <RefreshCcw size={14} /> : index + 1}</span>
                        {label}
                      </div>
                    ))}
                  </div>
                )}

                <div className="modal-footer">
                  <button className="secondary-button" onClick={() => setWorkflowDialog(false)}>Cancel</button>
                  <button className="primary-button" disabled={!problem.trim() || (buildStep >= 0 && buildStep < 4)} onClick={startWorkflowBuild}>
                    <Sparkles size={16} /> {buildStep >= 0 && buildStep < 4 ? "Agents building..." : "Build application"}
                  </button>
                </div>
              </>
            ) : (
              <div className="build-result">
                <div className="success-mark"><CheckCircle2 size={28} /></div>
                <span className="eyebrow">Application ready</span>
                <h3>Priority dispatch control</h3>
                <p>Four agents converted the requirement and connected Shopify and Slack context into a governed application.</p>
                <div className="generated-output-list">
                  <div><Check size={14} /><span><strong>Detect</strong> paid priority orders approaching the dispatch SLA</span></div>
                  <div><Check size={14} /><span><strong>Correlate</strong> warehouse blockers from Slack with Shopify order state</span></div>
                  <div><Check size={14} /><span><strong>Resolve</strong> with an approval-gated escalation and customer update</span></div>
                </div>
                <div className="result-grid">
                  <div><strong>3</strong><span>Workflows</span></div>
                  <div><strong>11</strong><span>Actions</span></div>
                  <div><strong>24/24</strong><span>Tests passed</span></div>
                </div>
                <div className="modal-footer">
                  <button className="secondary-button" onClick={() => setBuildStep(-1)}>Edit requirement</button>
                  <button className="primary-button" onClick={() => { setWorkflowDialog(false); setActiveView("workflows"); setToast("Generated application deployed in demo mode"); }}>
                    Deploy application <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {maintenanceOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setMaintenanceOpen(false)}>
          <section className="modal modal-wide" role="dialog" aria-modal="true" aria-labelledby="maintenance-title" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div><span className="eyebrow">Maintainer agent</span><h2 id="maintenance-title">Update dispatch policy</h2></div>
              <button className="icon-button" aria-label="Close" onClick={() => setMaintenanceOpen(false)}><X size={18} /></button>
            </div>
            {!changeReady ? (
              <>
                <div className="change-context"><GitBranch size={17} /><span>Current version <strong>v1.6</strong> is running in production.</span></div>
                <label className="field-label" htmlFor="change">Describe what changed</label>
                <textarea id="change" defaultValue="Priority customers must be escalated after 12 hours. Keep the 24-hour threshold for all other orders." />
                <div className="modal-footer">
                  <button className="secondary-button" onClick={() => setMaintenanceOpen(false)}>Cancel</button>
                  <button className="primary-button" onClick={() => setChangeReady(true)}><Sparkles size={16} /> Propose safe update</button>
                </div>
              </>
            ) : (
              <>
                <div className="diff-header">
                  <div><strong>v1.6 {"->"} v1.7</strong><span>One rule changed, no connector changes</span></div>
                  <span className="test-pass"><TestTube2 size={15} /> 24/24 tests passed</span>
                </div>
                <div className="diff-block">
                  <div className="diff-line diff-remove">- Escalate every order when elapsed_hours &gt;= 24</div>
                  <div className="diff-line diff-add">+ Escalate priority orders when elapsed_hours &gt;= 12</div>
                  <div className="diff-line diff-add">+ Escalate standard orders when elapsed_hours &gt;= 24</div>
                </div>
                <div className="impact-list">
                  <div><CheckCircle2 size={16} /><span>6 historical priority orders would have been detected earlier</span></div>
                  <div><CheckCircle2 size={16} /><span>No increase in false positives across the last 30 days</span></div>
                  <div><ShieldCheck size={16} /><span>Customer messages still require human approval</span></div>
                </div>
                <div className="modal-footer">
                  <button className="secondary-button" onClick={() => setChangeReady(false)}>Revise</button>
                  <button className="primary-button" disabled={changeDeployed} onClick={() => { setChangeDeployed(true); setToast("Workflow v1.7 deployed with full audit history"); window.setTimeout(() => setMaintenanceOpen(false), 700); }}>
                    {changeDeployed ? <><Check size={16} /> Deployed</> : <><Play size={16} /> Approve and deploy</>}
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {connectorDialog && (
        <ConnectorModal
          connector={connectors.find((item) => item.id === connectorDialog) ?? connectors[0]}
          payload={connectorPayload}
          setPayload={setConnectorPayload}
          save={saveConnectorEvidence}
          close={() => setConnectorDialog(null)}
        />
      )}

      {toast && <div className="toast"><CheckCircle2 size={17} />{toast}</div>}
    </div>
  );
}

export default function Home() {
  return <FulfillGuardApp />;
}

function Overview({
  cases,
  selectedCase,
  setSelectedCaseId,
  setActiveView,
  approveCase,
  recovered,
}: {
  cases: OpsCase[];
  selectedCase: OpsCase;
  setSelectedCaseId: (id: string) => void;
  setActiveView: (view: View) => void;
  approveCase: (id: string) => void;
  recovered: string;
}) {
  return (
    <>
      <div className="page-heading">
        <div><span className="eyebrow">Monday, July 20</span><h1>Operations command center</h1><p>Agents are monitoring every fulfillment handoff and contract rule.</p></div>
        <div className="heading-status"><span className="status-dot" /><div><strong>All systems operational</strong><span>1,284 events checked today</span></div></div>
      </div>

      <section className="metrics-grid" aria-label="Operations summary">
        <Metric icon={CircleDollarSign} label="Recovered this month" value={recovered} detail={recovered === "$0" ? "$482 awaiting approval" : "+$482 from last action"} tone="green" />
        <Metric icon={AlertTriangle} label="Open cases" value={`${cases.filter((item) => item.status === "open").length}`} detail="1 requires attention" tone="red" />
        <Metric icon={Clock3} label="Orders at risk" value="7" detail="2 priority customers" tone="amber" />
        <Metric icon={Workflow} label="Active workflows" value="3" detail="24/24 checks passing" tone="blue" />
      </section>

      <div className="overview-grid">
        <section className="panel cases-panel">
          <div className="panel-header"><div><h2>Priority cases</h2><p>Ranked by financial and customer impact</p></div><button className="text-button" onClick={() => setActiveView("cases")}>View all <ArrowRight size={14} /></button></div>
          <div className="case-list">
            {cases.map((item) => (
              <button className={`case-row ${item.id === selectedCase.id ? "case-row-active" : ""}`} key={item.id} onClick={() => setSelectedCaseId(item.id)}>
                <div className={`case-signal signal-${item.severity}`} />
                <div className="case-main"><div className="case-topline"><strong>{item.title}</strong><SeverityPill severity={item.severity} /></div><p>{item.summary}</p><div className="case-meta"><span>{item.id}</span><span><SourceIcon source={item.source} /> {item.source}</span><span><Clock3 size={13} /> {item.age}</span></div></div>
                <div className="case-exposure"><span>Exposure</span><strong>{item.exposure}</strong><ArrowRight size={15} /></div>
              </button>
            ))}
          </div>
        </section>

        <CaseInspector item={selectedCase} approveCase={approveCase} compact />
      </div>

      <div className="bottom-grid">
        <section className="panel workflow-panel">
          <div className="panel-header"><div><h2>Generated workflows</h2><p>Built from your contracts, systems, and operating policies</p></div><button className="icon-button" aria-label="More workflow options"><ChevronDown size={17} /></button></div>
          <div className="workflow-table">
            <div className="table-head"><span>Workflow</span><span>Trigger</span><span>Steps</span><span>Health</span><span>Last run</span></div>
            {workflows.map((item) => (
              <div className="table-row" key={item.name}><span><Workflow size={15} /> <strong>{item.name}</strong></span><span>{item.trigger}</span><span>{item.actions}</span><span className={item.health === "Healthy" ? "health-good" : "health-review"}><i />{item.health}</span><span>{item.lastRun}</span></div>
            ))}
          </div>
        </section>

        <section className="panel activity-panel">
          <div className="panel-header"><div><h2>Agent activity</h2><p>Live orchestration trace</p></div><span className="live-label"><i />Live</span></div>
          <div className="activity-list">
            {activities.slice(0, 4).map((item) => <ActivityItem key={`${item.time}-${item.agent}`} {...item} />)}
          </div>
        </section>
      </div>
    </>
  );
}

function Metric({ icon: Icon, label, value, detail, tone }: { icon: typeof Activity; label: string; value: string; detail: string; tone: string }) {
  return <div className="metric"><div className={`metric-icon metric-${tone}`}><Icon size={18} /></div><div className="metric-copy"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></div>;
}

function CaseInspector({ item, approveCase, dismissCase, compact = false }: { item: OpsCase; approveCase: (id: string) => void; dismissCase?: (id: string) => void; compact?: boolean }) {
  return (
    <aside className={`panel inspector ${compact ? "inspector-compact" : ""}`}>
      <div className="inspector-header">
        <div><span className="eyebrow">Agent investigation</span><h2>{item.id}</h2></div>
        <div className="confidence"><Bot size={14} /> {item.confidence}% confidence</div>
      </div>
      <h3>{item.title}</h3>
      <div className="inspector-section"><div className="section-label">Evidence</div><div className="evidence-list">{item.evidence.map((line) => <div key={line}><Check size={14} /><span>{line}</span></div>)}</div></div>
      <div className="inspector-section"><div className="section-label">Agent reasoning</div><p className="reasoning">{item.reasoning}</p></div>
      <div className="proposed-action"><div className="proposed-icon"><Zap size={16} /></div><div><span>Recommended action</span><strong>{item.action}</strong></div></div>
      {!compact && <div className="draft-box"><div className="section-label">Prepared message</div><p>{item.draft}</p><button className="text-button"><FileText size={14} /> Edit draft</button></div>}
      {item.status === "open" ? (
        <div className="inspector-actions">
          {dismissCase && <button className="secondary-button" onClick={() => dismissCase(item.id)}>Dismiss</button>}
          <button className="primary-button grow" onClick={() => approveCase(item.id)}><Check size={16} /> Approve action</button>
        </div>
      ) : <div className={`case-state state-${item.status}`}><CheckCircle2 size={16} /> Case {item.status}</div>}
    </aside>
  );
}

function CasesView({ cases, selectedCase, query, setQuery, selectCase, approveCase, dismissCase }: { cases: OpsCase[]; selectedCase: OpsCase; query: string; setQuery: (value: string) => void; selectCase: (id: string) => void; approveCase: (id: string) => void; dismissCase: (id: string) => void }) {
  return (
    <>
      <div className="page-heading compact-heading"><div><span className="eyebrow">Exception operations</span><h1>Cases</h1><p>Every case includes source evidence, reasoning, and a governed next action.</p></div></div>
      <div className="case-workspace">
        <section className="panel case-browser">
          <div className="browser-tools"><div className="search-box"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search cases" /></div><button className="secondary-button"><AlertTriangle size={15} /> Open</button></div>
          <div className="browser-list">
            {cases.map((item) => (
              <button className={`browser-case ${item.id === selectedCase.id ? "browser-case-active" : ""}`} key={item.id} onClick={() => selectCase(item.id)}>
                <div><div className="case-topline"><strong>{item.title}</strong><SeverityPill severity={item.severity} /></div><p>{item.summary}</p></div>
                <div className="browser-case-bottom"><span>{item.id} / {item.type}</span><strong>{item.exposure}</strong></div>
              </button>
            ))}
          </div>
        </section>
        <CaseInspector item={selectedCase} approveCase={approveCase} dismissCase={dismissCase} />
      </div>
    </>
  );
}

function WorkflowsView({ openMaintenance, openBuilder }: { openMaintenance: () => void; openBuilder: () => void }) {
  return (
    <>
      <div className="page-heading compact-heading"><div><span className="eyebrow">Adaptive applications</span><h1>Workflows</h1><p>Agents build the process, run it, test changes, and preserve every version.</p></div><button className="primary-button" onClick={openBuilder}><Plus size={16} /> Generate workflow</button></div>
      <section className="workflow-hero">
        <div className="workflow-hero-copy"><div className="agent-orb"><Sparkles size={21} /></div><span className="eyebrow">Maintainer insight</span><h2>Your priority-customer policy may be out of date</h2><p>Three Slack escalations show the team now intervenes after 12 hours, while the deployed workflow waits 24 hours.</p><button className="primary-button" onClick={openMaintenance}><GitBranch size={16} /> Review proposed change</button></div>
        <div className="workflow-hero-stats"><div><strong>3</strong><span>Potential misses</span></div><div><strong>6.2 hr</strong><span>Earlier intervention</span></div><div><strong>Low</strong><span>Change risk</span></div></div>
      </section>
      <section className="panel workflow-list-panel">
        <div className="panel-header"><div><h2>Production workflows</h2><p>Versioned and continuously evaluated</p></div><button className="secondary-button"><RefreshCcw size={15} /> Run checks</button></div>
        <div className="workflow-cards">
          {workflows.map((item, index) => (
            <article className="workflow-card" key={item.name}>
              <div className="workflow-card-top"><div className={`workflow-card-icon workflow-tone-${index}`}><Workflow size={18} /></div><span className={item.health === "Healthy" ? "health-good" : "health-review"}><i />{item.health}</span></div>
              <h3>{item.name}</h3><p>Triggered by <strong>{item.trigger.toLowerCase()}</strong> and coordinated across connected systems.</p>
              <div className="workflow-path"><span>Trigger</span><ArrowRight size={13} /><span>{item.actions} agent steps</span><ArrowRight size={13} /><span>Approval</span></div>
              <div className="workflow-card-footer"><span>v1.{6 - index}</span><span>Last run {item.lastRun}</span><button className="icon-button" aria-label={`Open ${item.name}`}><ArrowRight size={16} /></button></div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function ConnectionsView({
  connectors,
  openConnector,
  analyzeInbox,
  inboxAnalyzing,
  evidenceEvents,
  analyzeEvidence,
  syncWebhookEvents,
  evidenceAnalyzing,
  realAgentRunning,
  realAgentResult,
  runRealAgent,
  sendSlackEscalation,
  slackSending,
}: {
  connectors: typeof connectorSeed;
  openConnector: (id: string) => void;
  analyzeInbox: () => void;
  inboxAnalyzing: boolean;
  evidenceEvents: EvidenceEvent[];
  analyzeEvidence: () => void;
  syncWebhookEvents: () => void;
  evidenceAnalyzing: boolean;
  realAgentRunning: boolean;
  realAgentResult: RealAgentResult | null;
  runRealAgent: () => void;
  sendSlackEscalation: () => void;
  slackSending: boolean;
}) {
  return (
    <>
      <div className="page-heading compact-heading"><div><span className="eyebrow">Business context</span><h1>Connections</h1><p>Give agents read access first. Every write action remains behind approval.</p></div><div className="secure-label"><ShieldCheck size={16} /> Approval-gated writes</div></div>
      <div className="connections-grid">
        {connectors.map((item) => {
          const Icon = item.icon;
          return (
            <article className="connector-card" key={item.id}>
              <div className={`connector-icon connector-${item.accent}`}><Icon size={21} /></div>
              <div className="connector-copy"><h3>{item.name}</h3><p>{item.detail}</p><span className={item.connected ? "connector-state connected" : "connector-state"}><i />{item.connected ? "Connected" : "Not connected"}</span></div>
              <button className={item.connected ? "secondary-button" : "primary-button"} onClick={() => openConnector(item.id)}>{item.connected ? "Manage" : "Connect"}</button>
            </article>
          );
        })}
      </div>

      <section className="panel evidence-panel">
        <div className="panel-header">
          <div><h2>Imported evidence</h2><p>Paste exports, forward app events, or send POST requests into the webhook.</p></div>
          <div className="panel-actions">
            <button className="secondary-button" onClick={syncWebhookEvents}><RefreshCcw size={15} /> Sync webhook</button>
            <button className="primary-button" onClick={analyzeEvidence} disabled={evidenceAnalyzing || !evidenceEvents.length}>
              {evidenceAnalyzing ? <><RefreshCcw className="spin" size={16} /> Analyzing...</> : <><Sparkles size={16} /> Analyze evidence</>}
            </button>
          </div>
        </div>
        {evidenceEvents.length ? (
          <div className="evidence-feed">
            {evidenceEvents.slice(-5).reverse().map((event) => (
              <article className="evidence-item" key={event.id}>
                <div><strong>{event.source}</strong><span>{event.type} / {new Date(event.receivedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></div>
                <p>{event.payload}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-evidence">
            <Webhook size={20} />
            <div><strong>No connected evidence yet</strong><span>Open any connector, import sample data, then analyze it into a real case.</span></div>
          </div>
        )}
      </section>

      <section className="panel real-agent-panel">
        <div className="panel-header">
          <div><h2>Real agent tools</h2><p>Calls Shopify Admin and Slack Web API from the backend, then creates a governed case.</p></div>
          <button className="primary-button" onClick={runRealAgent} disabled={realAgentRunning}>
            {realAgentRunning ? <><RefreshCcw className="spin" size={16} /> Running tools...</> : <><Bot size={16} /> Run Shopify + Slack agent</>}
          </button>
        </div>
        <div className="agent-tool-grid">
          <div className="tool-card">
            <div className="section-label">Tool chain</div>
            {(realAgentResult?.toolTrace ?? [
              "tool.shopify.list_unfulfilled_orders",
              "tool.slack.read_recent_warehouse_messages",
              "tool.agent.build_fulfillment_case",
            ]).map((tool) => <span key={tool}><Check size={13} /> {tool}</span>)}
          </div>
          <div className="tool-card">
            <div className="section-label">Latest result</div>
            {realAgentResult ? (
              <>
                <strong>{realAgentResult.case.title}</strong>
                <p>{realAgentResult.case.reasoning}</p>
                <button className="secondary-button" onClick={sendSlackEscalation} disabled={slackSending}>
                  {slackSending ? <><RefreshCcw className="spin" size={15} /> Sending...</> : <><MessageSquare size={15} /> Approve Slack escalation</>}
                </button>
              </>
            ) : (
              <p>Configure `SHOPIFY_SHOP_DOMAIN`, `SHOPIFY_ADMIN_ACCESS_TOKEN`, `SLACK_BOT_TOKEN`, and `SLACK_CHANNEL_ID` for live mode. Without them, the same tool chain runs on demo data.</p>
            )}
          </div>
        </div>
      </section>

      <section className="panel inbox-panel">
        <div className="panel-header"><div><h2>Connected conversation</h2><p>Gmail / Northstar 3PL / June invoice discrepancy</p></div><span className="demo-label">Demo inbox</span></div>
        <div className="conversation">
          <div className="email-item"><div className="email-avatar">NS</div><div><div className="email-head"><strong>Maya Chen, Northstar 3PL</strong><span>Today, 9:36 AM</span></div><p>Hi team, attaching the June fulfillment invoice. Pick-and-pack pricing reflects the updated service schedule from this quarter.</p><div className="attachment"><FileText size={16} /><span><strong>Northstar_June_Invoice.pdf</strong><small>218 KB</small></span><CheckCircle2 size={15} /></div></div></div>
          <div className="email-item"><div className="email-avatar email-avatar-us">AG</div><div><div className="email-head"><strong>Nina, Operations</strong><span>Today, 9:51 AM</span></div><p>I cannot find an updated schedule in the signed agreement. Can someone compare this invoice against our active rate card before Finance pays it?</p></div></div>
        </div>
        <div className="conversation-action"><div><Bot size={18} /><span><strong>Agents can investigate this thread</strong><small>Contract, invoice, and order evidence are available.</small></span></div><button className="primary-button" onClick={analyzeInbox} disabled={inboxAnalyzing}>{inboxAnalyzing ? <><RefreshCcw className="spin" size={16} /> Analyzing...</> : <><Sparkles size={16} /> Analyze conversation</>}</button></div>
      </section>
    </>
  );
}

function ConnectorModal({
  connector,
  payload,
  setPayload,
  save,
  close,
}: {
  connector: (typeof connectorSeed)[number];
  payload: string;
  setPayload: (value: string) => void;
  save: () => void;
  close: () => void;
}) {
  const Icon = connector.icon;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={close}>
      <section className="modal modal-wide" role="dialog" aria-modal="true" aria-labelledby="connector-title" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="connector-modal-title">
            <div className={`connector-icon connector-${connector.accent}`}><Icon size={21} /></div>
            <div><span className="eyebrow">Connector setup</span><h2 id="connector-title">{connector.name}</h2></div>
          </div>
          <button className="icon-button" aria-label="Close" onClick={close}><X size={18} /></button>
        </div>

        <div className="connector-steps">
          <div><strong>1</strong><span>Export or paste data from {connector.name}</span></div>
          <div><strong>2</strong><span>FulfillGuard stores it as source evidence</span></div>
          <div><strong>3</strong><span>The agent analyzes evidence and creates a case</span></div>
        </div>

        {connector.id === "webhook" && (
          <div className="webhook-box">
            <div className="section-label">Webhook endpoint</div>
            <code>POST http://localhost:3006/api/evidence</code>
            <p>Use this with Zapier, Make, n8n, Shopify webhooks, or a warehouse script.</p>
          </div>
        )}

        <label className="field-label" htmlFor="connector-payload">Evidence payload</label>
        <textarea id="connector-payload" value={payload} onChange={(event) => setPayload(event.target.value)} />

        <div className="modal-footer">
          <button className="secondary-button" onClick={close}>Cancel</button>
          <button className="primary-button" disabled={!payload.trim()} onClick={save}><Plug size={16} /> Import and connect</button>
        </div>
      </section>
    </div>
  );
}

function ActivityView() {
  return (
    <>
      <div className="page-heading compact-heading"><div><span className="eyebrow">Governance</span><h1>Audit log</h1><p>A complete trace of agent reasoning, evidence access, approvals, and workflow changes.</p></div><button className="secondary-button"><FileText size={15} /> Export log</button></div>
      <section className="panel audit-panel">
        <div className="audit-summary"><div><ShieldCheck size={18} /><span><strong>No unapproved writes</strong><small>All connected systems remain protected by the workspace policy.</small></span></div><span>Last 24 hours</span></div>
        <div className="audit-list">
          {activities.map((item, index) => (
            <div className="audit-row" key={`${item.time}-${item.agent}`}><div className={`audit-dot audit-${item.tone}`} /><span className="audit-time">{item.time}</span><div><strong>{item.agent}</strong><p>{item.text}</p></div><span className="audit-hash">run_{1042 - index}a</span><button className="icon-button" aria-label="View trace"><ArrowRight size={15} /></button></div>
          ))}
          <div className="audit-row"><div className="audit-dot audit-green" /><span className="audit-time">09:21</span><div><strong>Human approval</strong><p>Nina approved a proactive delay message for order #5829</p></div><span className="audit-hash">usr_nina</span><button className="icon-button" aria-label="View trace"><ArrowRight size={15} /></button></div>
        </div>
      </section>
    </>
  );
}

function ActivityItem({ time, agent, text, tone }: { time: string; agent: string; text: string; tone: string }) {
  return <div className="activity-item"><div className={`activity-icon activity-${tone}`}><Bot size={14} /></div><div><div><strong>{agent}</strong><span>{time}</span></div><p>{text}</p></div></div>;
}
