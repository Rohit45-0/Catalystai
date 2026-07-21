# FulfillGuard Demo Narration

Target runtime: **1:56.5** at 30 frames per second.

Voice: **Andrew Multilingual Neural**, rate +6%, pitch -2 Hz.

| Time | Scene | Narration |
| --- | --- | --- |
| 00:00 | Title | Meet FulfillGuard: adaptive operations for ecommerce teams. |
| 00:05 | Command center | The command center ranks exceptions by impact. Every recommendation includes evidence, confidence, exposure, and a clear next action. |
| 00:14 | Connections | It reads Shopify order state, Slack warehouse context, and Gmail or ERP evidence from the tools merchants already use. |
| 00:23 | Agent tools | The fulfillment agent queries Shopify, reads warehouse messages, correlates both sources, and creates an evidence-backed case. No CSV upload is needed. |
| 00:34 | Case and approval | Order 5841 is still unfulfilled after 18 hours. Slack shows its SKU in overflow. FulfillGuard drafts an escalation, then waits for approval. |
| 00:45 | Problem input | Here is the new requirement: prevent priority orders from missing dispatch SLA by combining Shopify order state with Slack warehouse context. That sentence is the input. |
| 00:57 | Multi-agent build | Four specialist agents map the requirement, identify entities, compose triggers and actions, then validate against 24 historical tests. |
| 01:07.5 | Generated output | The output is a deployable application: three workflows, eleven governed actions, and all 24 historical tests passing. |
| 01:16 | Maintainer | The maintainer spots drift: operators escalate priority orders after 12 hours, while the deployed policy waits 24. |
| 01:24.5 | Safe change | It proposes a versioned diff, tests the impact, and keeps deployment behind explicit approval. One click safely deploys version 1.7. |
| 01:34.5 | Audit | Evidence reads, tool calls, decisions, approvals, and workflow versions stay in the audit log, making every run inspectable. |
| 01:43.5 | Build provenance | Codex implemented the product, connectors, tests, and demo. GPT-5.6 Terra helped reason through agent orchestration, workflow safety, and evidence-based decisions. |
