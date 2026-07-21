# OpenAI Build Week submission pack

## Project

**Name:** FulfillGuard<br>
**Track:** Work and Productivity<br>
**Tagline:** An adaptive operations engineer for ecommerce teams, with evidence-backed actions and human approval.

## Devpost description

Fulfillment teams rarely have one clean system. Orders live in Shopify, warehouse context appears in Slack, invoices arrive by email, and the operating policy is often trapped in documents or someone’s memory. By the time those signals are connected manually, a customer promise or a billing deadline may already be missed.

I built FulfillGuard to turn those scattered signals into governed operational action. It connects evidence from order systems and conversations, ranks exceptions by business impact, explains its reasoning, and drafts the next action. External writes remain behind explicit human approval.

The proof of concept also shows what happens after the first workflow is deployed. A maintainer agent compares real operator behavior with the current policy, detects drift, proposes a versioned rule change, reruns historical checks, and asks for approval before deployment. A complete audit log preserves evidence reads, tool calls, model decisions, approvals, and workflow versions.

The judge demo works without credentials. It includes deterministic Shopify and Slack tool data, a real backend orchestration route, a plain-language four-agent application builder, approval gates, versioned maintenance, and functional tests. Optional environment variables enable live Shopify, Slack, and OpenAI API calls.

Codex implemented and debugged the product, backend tools, tests, and Remotion demo. GPT-5.6 Terra helped reason through the multi-agent decomposition, evidence model, approval boundaries, policy-drift workflow, and evaluator story. I chose the ecommerce fulfillment problem, constrained the scope, and made the final product and safety decisions.

## What was built during Build Week

Generic starter infrastructure and open-source packages pre-existed. During Build Week, the FulfillGuard product experience, API routes, Shopify and Slack tools, deterministic fallback path, multi-agent builder, maintainer workflow, tests, documentation, and submission video were created or meaningfully extended.

## Suggested YouTube metadata

**Title:** FulfillGuard - Adaptive Ecommerce Operations | OpenAI Build Week

**Description:**

FulfillGuard connects ecommerce order state, warehouse conversations, and business evidence to detect exceptions, explain risk, and propose governed actions. This working Build Week proof of concept includes Shopify and Slack agent tools, a four-agent application builder, human approval gates, policy-drift maintenance, versioned changes, historical tests, and an audit trail. Built with Codex and GPT-5.6 Terra.

## External submission fields

- **YouTube URL:** PENDING
- **Code repository URL:** PENDING
- **Codex `/feedback` Session ID:** PENDING
- **Live demo URL:** OPTIONAL / PENDING
- **Team invitations accepted:** CONFIRM IN DEVPOST

## Final checklist

- [x] Working project with credential-free judge mode
- [x] Production build, lint, and functional tests
- [x] Demo under three minutes with voiceover
- [x] README setup, sample data, judge path, Codex usage, and GPT-5.6 usage
- [x] Public-repo MIT license
- [x] No secrets in `.env.example`
- [ ] Push repository to GitHub
- [ ] If private, share with `testing@devpost.com` and `build-week-event@openai.com`
- [ ] Upload final MP4 to YouTube and verify it in an incognito window
- [ ] Paste the public or unlisted YouTube URL into Devpost
- [ ] Run `/feedback` from the slash-command menu in this primary Codex thread
- [ ] Add the Session ID to Devpost
- [ ] Add teammates and confirm they accepted
- [ ] Submit, then confirm the project shows **Submitted** in green on My Projects
