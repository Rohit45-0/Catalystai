# Catalyst AI sample evidence

These files exercise the credential-free evidence ingestion path.

- `shopify-priority-order.json`: a paid priority order approaching its dispatch SLA.
- `slack-warehouse-blocker.json`: warehouse context identifying the blocked SKU and location.
- `gmail-invoice-thread.txt`: a short billing conversation for the Gmail connector modal.

POST either JSON file to `http://localhost:3006/api/evidence`, then use **Connections -> Sync webhook -> Analyze evidence**.
