# Neural Knights product audit

## Current verdict

The product now communicates a differentiated idea: use company evidence to decide what internal software should exist, then run that software with explicit controls.

The first version proved the story visually but behaved too much like a prepared demo. The current pass adds a live, source-dependent OpenAI discovery path, visible processing stages, evidence inspection, working queue controls, rerunnable evaluations, rejection/approval actions, and exportable audit history.

Problem understanding now precedes generation. The user confirms a domain and subproblem before Neural Knights creates an execution map, and the deterministic fallback uses domain-specific playbooks rather than always returning the complaint demo.

The model-training path now produces evidence-derived dataset insights and a sequenced decision checklist. Confirmed target, metric, and validation choices are carried into the generated model workbench.

## Highest-priority missing pieces

### 1. Real design partners

The current complaint workspace is synthetic. The next moat-building step is not another generic connector. It is two permissioned datasets from complaint or compliance teams, followed by measured operator corrections.

**Proof needed:** operators agree with the diagnosed bottleneck and use the generated queue on real cases.

### 2. Durable workspace and deployment state

Generated apps currently persist in the browser and share a stable demo route. A real customer needs durable workspaces, deployment versions, and app URLs that work across devices and users.

**Next build:** one workspace table, source metadata, graph snapshots, app specifications, deployment versions, and audit events.

### 3. Permissions tied to source systems

The runtime constrains actions, but the graph does not yet inherit source-level access controls.

**Next build:** every node and edge carries an access policy derived from its source; generated views hide inaccessible evidence.

### 4. Correction loop

Human approvals are recorded, but they do not yet become future evaluations.

**Next build:** when an operator edits, rejects, or reroutes a recommendation, capture the corrected outcome as an eval case for the next app version.

### 5. Generated runtime breadth

The runtime now renders complaint operations and a model-training workbench, but other domains still need their own suitable operational views.

**Next build:** add a small allowlisted component vocabulary for queue, record detail, approval inbox, monitor, intake form, and report. Keep arbitrary generated code out of the runtime.

## What not to add yet

- A marketplace
- Dozens of integrations
- Fine-tuning
- A graph database
- Autonomous external writes
- Generic multi-agent diagrams
- Billing

None of these helps prove that Neural Knights identifies and solves a real operational problem better than an operator or existing workflow tool.

## UI findings

The previous interface looked model-generated because it used a dark agent dashboard, tiny labels, many equal-weight panels, and explanatory copy about what agents would do.

The revised direction:

- Uses a light operational shell and a visible three-step journey.
- Shows changing workspace signals instead of describing agent roles.
- Makes map nodes inspectable and exposes their source IDs.
- Shows whether analysis used the live model or safe fallback.
- Adds working search, filters, approve/dismiss actions, evaluation reruns, and audit export.
- Keeps color for operational meaning rather than decoration.

## YC demo proof

The demo should prove four claims in under 90 seconds:

1. Uploaded evidence changes the execution map.
2. Recommendations cite the supplied sources.
3. The selected blueprint changes the generated app rules.
4. Consequential actions require a human and produce an audit event.

Everything after those four claims is secondary until there is customer usage.
