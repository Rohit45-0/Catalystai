import { Audio } from "@remotion/media";
import {
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  FileCheck2,
  GitBranch,
  MessageSquare,
  MousePointer2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  CatalystAIApp,
  type EvidenceEvent,
  type CatalystAIDemoState,
  type RealAgentResult,
} from "../app/page";

const FPS = 30;

const scenes = [
  {
    id: "title",
    seconds: 5,
    label: "CATALYST AI",
    caption: "Adaptive operations for ecommerce teams",
  },
  {
    id: "overview",
    seconds: 9,
    label: "01 / DETECT",
    caption: "Rank exceptions by customer and financial impact.",
  },
  {
    id: "connections",
    seconds: 9,
    label: "02 / CONNECT",
    caption: "Read live context from Shopify, Slack, Gmail, ERP, and webhooks.",
  },
  {
    id: "agent",
    seconds: 11,
    label: "03 / INVESTIGATE",
    caption: "The agent runs backend tools and correlates evidence in real time.",
  },
  {
    id: "case",
    seconds: 11,
    label: "04 / EXPLAIN + APPROVE",
    caption: "Evidence and reasoning first. External writes stay behind human approval.",
  },
  {
    id: "problem",
    seconds: 12,
    label: "05 / INPUT",
    caption: "INPUT: Prevent priority orders from missing dispatch SLA using Shopify + Slack.",
  },
  {
    id: "build",
    seconds: 10.5,
    label: "06 / ORCHESTRATE",
    caption: "Four specialist agents map, compose, and validate the application.",
  },
  {
    id: "output",
    seconds: 8.5,
    label: "07 / OUTPUT",
    caption: "OUTPUT: 3 workflows | 11 governed actions | 24/24 tests passed",
  },
  {
    id: "maintain",
    seconds: 8.5,
    label: "08 / ADAPT",
    caption: "The maintainer detects when real operating behavior drifts from policy.",
  },
  {
    id: "change",
    seconds: 10,
    label: "09 / CHANGE SAFELY",
    caption: "Versioned diffs, impact checks, and historical tests precede deployment.",
  },
  {
    id: "audit",
    seconds: 9,
    label: "10 / GOVERN",
    caption: "Evidence reads, decisions, approvals, and versions stay inspectable.",
  },
  {
    id: "outro",
    seconds: 13,
    label: "BUILT FOR OPENAI BUILD WEEK",
    caption: "Codex implemented and tested the product. GPT-5.6 Terra shaped orchestration and safety.",
  },
] as const;

type Scene = (typeof scenes)[number];
type SceneId = Scene["id"];

const framesFor = (seconds: number) => seconds * FPS;
const startFor = (index: number) =>
  scenes.slice(0, index).reduce((total, scene) => total + framesFor(scene.seconds), 0);

export const TOTAL_FRAMES = scenes.reduce(
  (total, scene) => total + framesFor(scene.seconds),
  0
);

const demoEvidence: EvidenceEvent[] = [
  {
    id: "evt_shopify_5841",
    source: "Shopify",
    connectorId: "shopify",
    type: "order_updated",
    payload:
      'Order #5841 | paid | unfulfilled for 18 hours | priority | SKU LUMA-04 | value $186.00',
    receivedAt: "2026-07-20T10:40:00Z",
  },
  {
    id: "evt_slack_overflow",
    source: "Slack",
    connectorId: "slack",
    type: "warehouse_message",
    payload:
      "#warehouse: SKU LUMA-04 was moved to overflow bin B-17 and needs supervisor escalation.",
    receivedAt: "2026-07-20T10:41:00Z",
  },
];

const agentResult: RealAgentResult = {
  mode: "demo_tools",
  toolTrace: [
    "tool.shopify.list_unfulfilled_orders",
    "tool.slack.read_recent_warehouse_messages",
    "tool.agent.build_fulfillment_case",
  ],
  orders: [
    {
      name: "#5841",
      displayFulfillmentStatus: "UNFULFILLED",
      tags: ["priority"],
      total: "$186.00",
    },
  ],
  messages: [
    {
      user: "warehouse-lead",
      text: "SKU LUMA-04 moved to overflow bin B-17 and needs supervisor escalation.",
    },
  ],
  case: {
    id: "FG-1041",
    title: "Priority order will miss dispatch SLA",
    severity: "high",
    confidence: 94,
    evidence: [
      "Shopify: order #5841 is paid and still unfulfilled after 18 hours",
      "Slack #warehouse: SKU LUMA-04 moved to overflow bin B-17",
      "Priority dispatch policy requires escalation after 12 hours",
    ],
    reasoning:
      "The order is still unfulfilled, and warehouse context identifies the blocked pick location. At current queue velocity, it will miss the dispatch promise.",
    recommendedAction:
      "Escalate the pick and prepare a proactive customer update",
    draftSlackMessage:
      "Priority order #5841 is at risk. Please move SKU LUMA-04 from overflow and confirm the pick within two hours.",
  },
  approvalRequired: true,
};

const connectedState: CatalystAIDemoState = {
  activeView: "connections",
  connectedConnectorIds: ["gmail", "slack", "shopify", "webhook"],
  evidenceEvents: demoEvidence,
};

function fadeForScene(frame: number) {
  return interpolate(frame, [0, 5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

function SceneShell({
  children,
}: {
  children: ReactNode;
}) {
  const frame = useCurrentFrame();
  const opacity = fadeForScene(frame);

  return (
    <AbsoluteFill className="video-scene" style={{ opacity }}>
      {children}
    </AbsoluteFill>
  );
}

function SceneLabel({ children }: { children: ReactNode }) {
  return (
    <div className="scene-label">
      <span />
      {children}
    </div>
  );
}

function Caption({ children }: { children: ReactNode }) {
  const frame = useCurrentFrame();
  const rise = spring({ frame, fps: FPS, config: { damping: 18, stiffness: 130 } });

  return (
    <div
      className="demo-caption"
      style={{
        opacity: rise,
        transform: `translateY(${interpolate(rise, [0, 1], [16, 0])}px)`,
      }}
    >
      {children}
    </div>
  );
}

function BrowserFrame({
  state,
  panX = 0,
  panY = 0,
  zoom = 1,
  endPanX = panX,
  endPanY = panY,
  endZoom = zoom,
  detail = "standard",
  focus,
}: {
  state: CatalystAIDemoState;
  panX?: number;
  panY?: number;
  zoom?: number;
  endPanX?: number;
  endPanY?: number;
  endZoom?: number;
  detail?: "standard" | "problem" | "build" | "output" | "change";
  focus?: { x: number; y: number; width: number; height: number; label?: string };
}) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const camera = interpolate(frame, [0, Math.max(1, durationInFrames - 1)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const cameraX = interpolate(camera, [0, 1], [panX, endPanX]);
  const cameraY = interpolate(camera, [0, 1], [panY, endPanY]);
  const cameraZoom = interpolate(camera, [0, 1], [zoom, endZoom]);
  const appScale = 1.071 * cameraZoom;
  const demoStateKey = JSON.stringify(state);

  return (
    <div className="demo-browser">
      <div className="demo-browser-bar">
        <div className="window-controls"><i /><i /><i /></div>
        <div className="address-bar"><ShieldCheck size={14} /> localhost:3006 / command-center</div>
        <div className="working-badge"><span /> LIVE PRODUCT DEMO</div>
      </div>
      <div className={`demo-browser-body demo-detail-${detail}`}>
        <div
          className="demo-app-canvas"
          style={{ transform: `translate3d(${cameraX}px, ${cameraY}px, 0) scale(${appScale})` }}
        >
          <CatalystAIApp key={demoStateKey} demoState={state} />
        </div>
        {focus ? <FocusBox {...focus} /> : null}
      </div>
    </div>
  );
}

function FocusBox({
  x,
  y,
  width,
  height,
  label,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
}) {
  const frame = useCurrentFrame();
  const progress = spring({ frame: Math.max(0, frame - 18), fps: FPS, config: { damping: 16 } });

  return (
    <div
      className="focus-box"
      style={{
        left: x,
        top: y,
        width,
        height,
        opacity: progress,
        transform: `scale(${interpolate(progress, [0, 1], [1.025, 1])})`,
      }}
    >
      {label ? <span>{label}</span> : null}
    </div>
  );
}

function Cursor({
  from,
  to,
  moveAt,
  clickAt,
}: {
  from: [number, number];
  to: [number, number];
  moveAt: [number, number];
  clickAt: number;
}) {
  const frame = useCurrentFrame();
  const x = interpolate(frame, moveAt, [from[0], to[0]], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const y = interpolate(frame, moveAt, [from[1], to[1]], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const click = spring({
    frame: frame - clickAt,
    fps: FPS,
    config: { damping: 12, stiffness: 250, mass: 0.5 },
  });
  const cursorScale = interpolate(click, [0, 0.5, 1], [1, 0.82, 1]);

  return (
    <div className="demo-cursor" style={{ transform: `translate3d(${x}px, ${y}px, 0)` }}>
      <div
        className="click-ring"
        style={{
          opacity: interpolate(click, [0, 0.15, 1], [0, 0.8, 0]),
          transform: `scale(${interpolate(click, [0, 1], [0.4, 2.5])})`,
        }}
      />
      <MousePointer2 size={34} fill="#ffffff" strokeWidth={2.2} style={{ transform: `scale(${cursorScale})` }} />
    </div>
  );
}

function Callout({
  icon,
  title,
  detail,
  style,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
  style?: CSSProperties;
}) {
  const frame = useCurrentFrame();
  const enter = spring({ frame: Math.max(0, frame - 28), fps: FPS, config: { damping: 17 } });

  return (
    <div
      className="demo-callout"
      style={{
        ...style,
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [18, 0])}px)`,
      }}
    >
      <div className="callout-icon">{icon}</div>
      <div><strong>{title}</strong><span>{detail}</span></div>
    </div>
  );
}

function TitleScene() {
  const frame = useCurrentFrame();
  const mark = spring({ frame: frame - 4, fps: FPS, config: { damping: 16, stiffness: 120 } });
  const copy = spring({ frame: frame - 16, fps: FPS, config: { damping: 17, stiffness: 105 } });
  const flow = spring({ frame: frame - 54, fps: FPS, config: { damping: 20 } });

  return (
    <AbsoluteFill className="title-card">
      <div className="title-rule" />
      <div className="title-brand" style={{ opacity: mark, transform: `scale(${interpolate(mark, [0, 1], [0.7, 1])})` }}>
        <ShieldCheck size={54} />
      </div>
      <div className="title-copy" style={{ opacity: copy, transform: `translateY(${interpolate(copy, [0, 1], [28, 0])}px)` }}>
        <span>ADAPTIVE ECOMMERCE OPERATIONS</span>
        <h1>Catalyst AI</h1>
        <p>Turn disconnected operational signals into governed action.</p>
      </div>
      <div className="title-flow" style={{ opacity: flow, transform: `translateY(${interpolate(flow, [0, 1], [24, 0])}px)` }}>
        <FlowNode icon={<ShoppingBag size={26} />} label="Shopify" />
        <ArrowRight size={22} />
        <FlowNode icon={<MessageSquare size={26} />} label="Slack" />
        <ArrowRight size={22} />
        <FlowNode icon={<Bot size={26} />} label="Agents" emphasis />
        <ArrowRight size={22} />
        <FlowNode icon={<ShieldCheck size={26} />} label="Approval" />
      </div>
      <div className="title-footer">OPENAI BUILD WEEK / WORKING PROOF OF CONCEPT</div>
    </AbsoluteFill>
  );
}

function FlowNode({ icon, label, emphasis = false }: { icon: ReactNode; label: string; emphasis?: boolean }) {
  return <div className={`flow-node ${emphasis ? "flow-node-emphasis" : ""}`}>{icon}<span>{label}</span></div>;
}

function OverviewScene() {
  return (
    <>
      <BrowserFrame
        state={{ activeView: "overview", selectedCaseId: "FG-1042" }}
        endPanY={-28}
        endZoom={1.035}
        focus={{ x: 265, y: 190, width: 1435, height: 510, label: "EVIDENCE-BACKED EXCEPTIONS" }}
      />
      <Cursor from={[390, 350]} to={[1540, 460]} moveAt={[34, 210]} clickAt={1000} />
      <Callout
        icon={<Zap size={20} />}
        title="Ranked by impact"
        detail="$482 billing exposure surfaced before payment"
        style={{ right: 88, top: 104 }}
      />
    </>
  );
}

function ConnectionsScene() {
  return (
    <>
      <BrowserFrame
        state={connectedState}
        panY={-58}
        zoom={0.98}
        endPanY={-92}
        endZoom={1.025}
        focus={{ x: 260, y: 110, width: 1442, height: 390, label: "READ ACCESS + SOURCE EVIDENCE" }}
      />
      <Cursor from={[510, 410]} to={[1450, 410]} moveAt={[26, 205]} clickAt={1000} />
      <Callout
        icon={<CheckCircle2 size={20} />}
        title="Existing systems, one context layer"
        detail="Shopify, Slack, Gmail, ERP, and webhooks"
        style={{ right: 88, top: 103 }}
      />
    </>
  );
}

function AgentScene() {
  const frame = useCurrentFrame();
  const started = frame >= 70;
  const running = started && frame < 188;
  const complete = frame >= 188;
  const state: CatalystAIDemoState = {
    ...connectedState,
    realAgentRunning: running,
    realAgentResult: complete ? agentResult : null,
  };

  return (
    <>
      <BrowserFrame
        state={state}
        panY={-405}
        zoom={1.01}
        endPanY={-475}
        endZoom={1.055}
        focus={{
          x: 250,
          y: 120,
          width: 1450,
          height: 350,
          label: !started ? "RUN FULFILLMENT AGENT" : running ? "TOOLS RUNNING" : "CORRELATED RESULT",
        }}
      />
      <Cursor from={[1390, 205]} to={[1718, 367]} moveAt={[22, 60]} clickAt={68} />
      {complete ? (
        <Callout
          icon={<Bot size={20} />}
          title="3 tools completed"
          detail="Shopify order + Slack context -> FG-1041"
          style={{ right: 88, top: 102 }}
        />
      ) : null}
      <Sequence from={64} durationInFrames={24}>
        <Audio src={staticFile("demo/audio/click.wav")} volume={0.45} />
      </Sequence>
    </>
  );
}

function CaseScene() {
  const frame = useCurrentFrame();
  const approved = frame >= 242;

  return (
    <>
      <BrowserFrame
        state={{
          activeView: "cases",
          selectedCaseId: "FG-1041",
          approvedCaseIds: approved ? ["FG-1041"] : [],
          toast: approved ? "Action approved and recorded in the audit log" : "",
        }}
        endPanX={-25}
        endPanY={-22}
        endZoom={1.035}
        focus={{ x: 875, y: 145, width: 825, height: 620, label: "AGENT INVESTIGATION" }}
      />
      <Cursor from={[1320, 575]} to={[1538, 820]} moveAt={[138, 220]} clickAt={232} />
      <Callout
        icon={approved ? <CheckCircle2 size={20} /> : <FileCheck2 size={20} />}
        title={approved ? "Action approved" : "Explain before acting"}
        detail={approved ? "Human decision written to the audit log" : "94% confidence with source-level evidence"}
        style={{ right: 88, top: 103 }}
      />
      <Sequence from={228} durationInFrames={24}>
        <Audio src={staticFile("demo/audio/click.wav")} volume={0.5} />
      </Sequence>
      {approved ? (
        <Sequence from={242} durationInFrames={84}>
          <Audio src={staticFile("demo/audio/success.wav")} volume={0.42} />
        </Sequence>
      ) : null}
    </>
  );
}

function ProblemScene() {
  return (
    <>
      <BrowserFrame
        state={{
          activeView: "overview",
          workflowDialog: true,
          buildStep: -1,
          problem: "Prevent priority orders from missing dispatch SLA by combining Shopify order state with Slack warehouse context.",
        }}
        panX={-72}
        panY={-178}
        zoom={1.075}
        endPanX={-108}
        endPanY={-220}
        endZoom={1.115}
        detail="problem"
        focus={{ x: 390, y: 105, width: 1020, height: 650, label: "INPUT / OPERATIONAL REQUIREMENT" }}
      />
      <Callout
        icon={<Sparkles size={20} />}
        title="Plain-language input"
        detail="Shopify order state + Slack warehouse context"
        style={{ right: 88, top: 104 }}
      />
    </>
  );
}

function BuildScene() {
  const frame = useCurrentFrame();
  const step = Math.min(3, Math.floor(frame / 80));

  return (
    <>
      <BrowserFrame
        state={{
          activeView: "overview",
          workflowDialog: true,
          buildStep: step,
          problem: "Prevent priority orders from missing dispatch SLA by combining Shopify order state with Slack warehouse context.",
        }}
        panX={-58}
        panY={-192}
        zoom={1.045}
        endPanX={-108}
        endPanY={-238}
        endZoom={1.095}
        detail="build"
        focus={{ x: 390, y: 72, width: 1020, height: 700, label: `AGENT ${step + 1} OF 4` }}
      />
      <Cursor from={[675, 390]} to={[675, 665]} moveAt={[36, 318]} clickAt={1000} />
    </>
  );
}

function OutputScene() {
  return (
    <>
      <BrowserFrame
        state={{
          activeView: "overview",
          workflowDialog: true,
          buildStep: 4,
          problem: "Prevent priority orders from missing dispatch SLA by combining Shopify order state with Slack warehouse context.",
        }}
        panX={-62}
        panY={-170}
        zoom={1.065}
        endPanX={-98}
        endPanY={-205}
        endZoom={1.11}
        detail="output"
        focus={{ x: 355, y: 82, width: 1090, height: 690, label: "GENERATED APPLICATION / OUTPUT" }}
      />
      <Callout
        icon={<CheckCircle2 size={20} />}
        title="24 / 24 tests passed"
        detail="3 workflows and 11 approval-gated actions"
        style={{ right: 88, top: 103 }}
      />
      <Cursor from={[1220, 570]} to={[1195, 742]} moveAt={[105, 240]} clickAt={1000} />
      <Sequence from={12} durationInFrames={90}>
        <Audio src={staticFile("demo/audio/success.wav")} volume={0.36} />
      </Sequence>
    </>
  );
}

function MaintainScene() {
  return (
    <>
      <BrowserFrame
        state={{ activeView: "workflows" }}
        panY={-8}
        zoom={1.005}
        endPanY={-72}
        endZoom={1.055}
        focus={{ x: 260, y: 130, width: 1440, height: 300, label: "MAINTAINER INSIGHT" }}
      />
      <Callout
        icon={<GitBranch size={20} />}
        title="Behavior drift detected"
        detail="Operators intervene at 12 hours; policy waits 24"
        style={{ right: 88, top: 103 }}
      />
    </>
  );
}

function ChangeScene() {
  const frame = useCurrentFrame();
  const diffReady = frame >= 82;
  const deployed = frame >= 262;

  return (
    <>
      <BrowserFrame
        state={{
          activeView: "workflows",
          maintenanceOpen: true,
          changeReady: diffReady,
          changeDeployed: deployed,
          toast: deployed ? "Workflow v1.7 deployed with full audit history" : "",
        }}
        panX={-42}
        panY={-132}
        zoom={1.025}
        endPanX={-82}
        endPanY={-185}
        endZoom={1.075}
        detail="change"
        focus={{ x: 365, y: 95, width: 1070, height: 675, label: diffReady ? "TESTED VERSION DIFF" : "DESCRIBE THE POLICY CHANGE" }}
      />
      <Cursor
        from={[1195, 764]}
        to={diffReady ? [1218, 804] : [1195, 764]}
        moveAt={[24, diffReady ? 220 : 58]}
        clickAt={diffReady ? 250 : 68}
      />
      <Sequence from={64} durationInFrames={22}>
        <Audio src={staticFile("demo/audio/click.wav")} volume={0.42} />
      </Sequence>
      <Sequence from={246} durationInFrames={22}>
        <Audio src={staticFile("demo/audio/click.wav")} volume={0.42} />
      </Sequence>
      {deployed ? (
        <Sequence from={262} durationInFrames={38}>
          <Audio src={staticFile("demo/audio/success.wav")} volume={0.4} />
        </Sequence>
      ) : null}
    </>
  );
}

function AuditScene() {
  return (
    <>
      <BrowserFrame
        state={{ activeView: "activity" }}
        panY={-10}
        zoom={1.005}
        endPanY={-62}
        endZoom={1.045}
        focus={{ x: 260, y: 165, width: 1440, height: 545, label: "GOVERNED EXECUTION TRACE" }}
      />
      <Cursor from={[480, 315]} to={[1510, 690]} moveAt={[30, 210]} clickAt={1000} />
      <Callout
        icon={<ShieldCheck size={20} />}
        title="No unapproved writes"
        detail="Every run and human decision stays inspectable"
        style={{ right: 88, top: 103 }}
      />
    </>
  );
}

function OutroScene() {
  const frame = useCurrentFrame();
  const reveal = spring({ frame: frame - 8, fps: FPS, config: { damping: 18, stiffness: 110 } });
  const rows = [
    { icon: <Bot size={22} />, text: "Codex: product, connectors, tests, and submission demo" },
    { icon: <Workflow size={22} />, text: "GPT-5.6 Terra: orchestration, safety gates, and workflow reasoning" },
    { icon: <ShieldCheck size={22} />, text: "Human direction: vertical, scope, approvals, and final product decisions" },
  ];

  return (
    <AbsoluteFill className="outro-card">
      <div className="outro-mark" style={{ opacity: reveal }}><ShieldCheck size={58} /></div>
      <div className="outro-copy" style={{ opacity: reveal, transform: `translateY(${interpolate(reveal, [0, 1], [24, 0])}px)` }}>
        <span>CATALYST AI</span>
        <h2>Operations that can explain<br />and improve themselves.</h2>
      </div>
      <div className="outro-proof">
        {rows.map((row, index) => {
          const item = spring({ frame: frame - 42 - index * 14, fps: FPS, config: { damping: 18 } });
          return (
            <div key={row.text} style={{ opacity: item, transform: `translateX(${interpolate(item, [0, 1], [24, 0])}px)` }}>
              {row.icon}<span>{row.text}</span><Check size={18} />
            </div>
          );
        })}
      </div>
      <div className="outro-built"><Sparkles size={18} /> Built with Codex + GPT-5.6 Terra</div>
    </AbsoluteFill>
  );
}

function SceneVisual({ id }: { id: SceneId }) {
  if (id === "title") return <TitleScene />;
  if (id === "overview") return <OverviewScene />;
  if (id === "connections") return <ConnectionsScene />;
  if (id === "agent") return <AgentScene />;
  if (id === "case") return <CaseScene />;
  if (id === "problem") return <ProblemScene />;
  if (id === "build") return <BuildScene />;
  if (id === "output") return <OutputScene />;
  if (id === "maintain") return <MaintainScene />;
  if (id === "change") return <ChangeScene />;
  if (id === "audit") return <AuditScene />;
  return <OutroScene />;
}

function SceneContent({ scene }: { scene: Scene }) {
  const isGraphicCard = scene.id === "title" || scene.id === "outro";

  return (
    <SceneShell>
      <SceneVisual id={scene.id} />
      {!isGraphicCard ? <SceneLabel>{scene.label}</SceneLabel> : null}
      <Caption>{scene.caption}</Caption>
      <Sequence from={2}>
        <Audio src={staticFile(`demo/narration/${scene.id}.mp3`)} volume={1} />
      </Sequence>
    </SceneShell>
  );
}

export function CatalystAIDemo() {
  return (
    <AbsoluteFill className="video-root">
      <Audio
        src={staticFile("demo/audio/ambient.wav")}
        volume={(frame) =>
          interpolate(frame, [0, 45, TOTAL_FRAMES - 90, TOTAL_FRAMES], [0, 0.075, 0.075, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
      {scenes.map((scene, index) => (
        <Sequence
          key={scene.id}
          from={startFor(index)}
          durationInFrames={framesFor(scene.seconds)}
          name={scene.label}
        >
          <SceneContent scene={scene} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
