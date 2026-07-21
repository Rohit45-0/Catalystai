# Catalyst AI

Catalyst AI is an adaptive operations application for ecommerce teams. It connects order state, warehouse conversations, and business evidence; turns exceptions into explainable cases; and keeps every external write behind human approval.

**OpenAI Build Week track:** Work and Productivity<br>
**Judge mode:** Works without API keys or external accounts<br>
**Optional live tools:** Shopify Admin, Slack Web API, and OpenAI Responses API

## The problem

Small ecommerce teams coordinate fulfillment across storefronts, warehouse systems, email, Slack, spreadsheets, and third-party logistics providers. Important exceptions are discovered manually, context is scattered, and rigid automations become stale as the real process changes.

Catalyst AI demonstrates a different operating model:

1. Detect exceptions across connected systems.
2. Correlate evidence into a ranked, explainable case.
3. Recommend an action with confidence and business exposure.
4. Require human approval before an external write.
5. Detect policy drift and propose a tested, versioned update.
6. Preserve evidence reads, tool calls, decisions, and approvals in an audit log.

## Working capabilities

- Operations command center with ranked billing, fulfillment, and inventory cases.
- Connector workspace for Gmail, Slack, Shopify, Salesforce, NetSuite, ERP, and webhook evidence.
- Backend Shopify and Slack tool chain with deterministic demo fallbacks.
- Evidence analysis that works locally without an OpenAI API key.
- Plain-language application builder with four visible specialist-agent stages.
- Maintainer agent with policy-drift detection, versioned diffs, historical checks, and approval-gated deployment.
- Audit log covering agent activity and human decisions.
- Remotion demo video generated from the real React product states.

## Quick start

Prerequisites:

- Node.js 22.13 or newer
- npm

```bash
npm ci
npm run dev -- --port 3006
```

Open `http://localhost:3006/`. No environment variables are required for the judge demo.

To verify a fresh checkout:

```bash
npm run verify
```

This runs lint, a production build, and the functional route tests.

## Five-minute judge path

1. Open **Command center** and inspect the ranked cases and source evidence.
2. Open **Connections** and select **Run Shopify + Slack agent**. Without credentials, the backend runs the same tool trace against deterministic demo data.
3. Review the generated fulfillment case and approve the drafted Slack escalation. No message is sent in demo mode.
4. Select **New workflow** and keep the default priority-order requirement. Watch four agents build and validate the application.
5. Open **Workflows**, review the maintainer insight, inspect the `v1.6 -> v1.7` diff, and approve deployment.
6. Open **Audit log** to inspect the governed execution trace.

## Sample data

The UI is preloaded with deterministic cases, so sample files are optional. Additional judge-safe events are in [`samples/`](samples/README.md).

With the dev server running, ingest a Shopify event from PowerShell:

```powershell
$body = Get-Content .\samples\shopify-priority-order.json -Raw
Invoke-RestMethod -Uri http://localhost:3006/api/evidence -Method Post -ContentType "application/json" -Body $body
```

Then open **Connections**, select **Sync webhook**, and select **Analyze evidence**.

## Optional live connections

Copy `.env.example` to `.env.local` only when testing live services. Never commit `.env.local` or real credentials.

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.6-terra
SHOPIFY_SHOP_DOMAIN=your-store.myshopify.com
SHOPIFY_ADMIN_ACCESS_TOKEN=
SHOPIFY_API_VERSION=2026-07
SLACK_BOT_TOKEN=
SLACK_CHANNEL_ID=
```

### Shopify + Slack tool chain

`POST /api/agent/fulfillment-risk` performs this sequence:

1. Query open unfulfilled Shopify orders.
2. Read recent Slack warehouse messages.
3. Correlate order and warehouse evidence.
4. Build an explainable fulfillment-risk case.
5. Draft a Slack escalation.
6. Send only after an explicit approval request.

When credentials are absent, steps 1-5 use deterministic local data and step 6 remains disabled.

### OpenAI analysis

`POST /api/analyze` returns deterministic local analysis when `OPENAI_API_KEY` is empty. When a key and supported `OPENAI_MODEL` are configured, it uses the OpenAI Responses API and falls back safely if the model request fails. Runtime API usage is optional and was not required for the Build Week submission.

## Architecture

- **Product UI:** Next.js 16, React 19, TypeScript, and Lucide icons.
- **Agent routes:** Next.js route handlers for evidence ingestion, analysis, and fulfillment-risk orchestration.
- **Tool adapters:** Shopify Admin GraphQL and Slack Web API with demo-safe fallbacks.
- **Governance:** source evidence, confidence, approval gates, versioned changes, historical checks, and audit events.
- **Demo production:** Remotion composition importing the real `CatalystAIApp` component.

## How Codex and GPT-5.6 were used

Catalyst AI was built collaboratively in Codex during OpenAI Build Week.

**Codex accelerated implementation:**

- Inspected and stabilized the existing Next.js/Vinext scaffold.
- Built the complete command center, connectors, case workflow, application builder, maintainer flow, and audit experience.
- Implemented the Shopify and Slack backend tools, deterministic fallbacks, and approval-gated write path.
- Diagnosed browser and state-transition problems, added route tests, and repeatedly verified production builds.
- Created the Remotion composition, neural narration pipeline, product-state animations, and final submission video.

**GPT-5.6 Terra contributed reasoning and product decisions:**

- Decomposed the ecommerce-operations problem into discovery, evidence, builder, validator, and maintainer responsibilities.
- Helped design the safety model: explain before acting, source-ground recommendations, human approval for writes, versioned policy changes, and historical validation.
- Helped refine the product scope around a concrete priority-dispatch workflow instead of a generic automation platform.
- Reviewed the evaluator story so the problem statement, agent orchestration, generated output, and governance are visible and testable.

**Human decisions:** the builder selected ecommerce fulfillment as the vertical, prioritized small-team usability, required approval gates, chose the final scope, and directed the product and demo revisions.

The primary Codex `/feedback` Session ID is submitted separately in Devpost.

## Build Week provenance

The submitted Catalyst AI product was built during the July 13-21, 2026 submission period. Generic starter infrastructure and open-source packages pre-existed. The Catalyst AI product UX, API routes, connector tools, multi-agent workflow builder, maintainer flow, tests, documentation, and demo video were created or meaningfully extended during Build Week.

## Demo video

The submission video is rendered at 1920x1080, stays under three minutes, and includes a voiceover explaining the product and how Codex and GPT-5.6 Terra were used.

- Local output: `demo-output/catalyst-ai-build-week-demo.mp4`
- Narration: `video/narration-script.md`
- Composition: `video/CatalystAIDemo.tsx`

```bash
npm run video:audio
npm run video:studio
npm run video:render
```

The ambient bed and interface sounds are generated locally by `video/generate-music.mjs`; the narration is generated specifically for this project. No third-party music or copyrighted footage is included.

## License and third-party work

Catalyst AI is released under the [MIT License](LICENSE). It uses open-source libraries listed in `package.json`, including Next.js, React, Lucide, and Remotion. Shopify, Slack, Gmail, Salesforce, NetSuite, and OpenAI names identify optional integrations; no third-party logos, footage, or copied product assets are used in the submission video.
