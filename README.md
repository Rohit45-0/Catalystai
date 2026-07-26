# Neural Knights

Neural Knights turns company knowledge into governed internal applications.

A user describes an operational problem and adds source documents. Neural Knights maps the people, systems, policies, records, decisions, and bottlenecks involved; recommends evidence-backed applications; and deploys the selected workflow on a constrained runtime.

## Current MVP

The first complete workflow is complaint operations for a regulated fintech team:

1. Load complaint records, a response policy, and operations notes.
2. Build a source-linked company execution map.
3. Diagnose the manual compliance-review handoff.
4. Choose from three ranked application blueprints.
5. Generate a Complaint Risk & Escalation Desk.
6. Validate its rules against historical scenarios.
7. Approve a governed escalation and inspect the audit history.

No API key or external account is required for the deterministic demo. When an OpenAI API key is configured, discovery and application generation use live structured model output and fall back safely if the request fails. The included demo workspace is synthetic.

## Run locally

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

To exercise the live model path, create `.env.local`:

```env
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-5.6-terra
```

Keep the key local and never commit it.

## Verify

```bash
npm run verify
```

This runs ESLint, a production build, and functional tests covering the execution map, evidence provenance, application specification, and APIs.

## Safety model

- The generator produces a typed `AppSpec`, not executable model-written code.
- Every graph relationship links to source evidence and includes confidence.
- Generated applications use allowlisted views and actions.
- Financial commitments and external escalations require human approval.
- Evaluations run before deployment.
- Human decisions and application versions are auditable.

## Architecture

- Next.js 16, React 19, TypeScript
- Vinext and Cloudflare-compatible Sites deployment
- Next.js route handlers for discovery and application generation
- OpenAI Responses API with strict JSON schemas and validated outputs
- Deterministic intelligence for a reliable zero-cost demo and safe fallback
- Lucide icon system and responsive operational interface

## Demo data

The files in [`samples/`](samples/README.md) mirror the **Load demo workspace** action:

- complaint queue
- complaint-response policy
- operations handoff notes

## Product direction

Complaint operations is the first wedge. The broader product is a cloud for small internal software: connect company knowledge, identify where work is breaking, generate the needed application, and improve it using human corrections and operational outcomes.
