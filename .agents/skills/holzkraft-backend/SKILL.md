---
name: holzkraft-backend
description: Implement or review HOLZKRAFT Supabase schema, RLS, server use cases, delivery pricing, inventory, checkout, payments, webhooks, invoices, notifications, admin authorization, audit, and backend tests. Use for migrations, server code, Route Handlers, Server Actions, external provider adapters, queues, storage, or security-sensitive commerce logic.
---

# HOLZKRAFT Backend

Build commerce capabilities from explicit invariants, with Supabase/PostgreSQL as the source of truth.

## Workflow

1. Read repository `AGENTS.md`.
2. Read `docs/BACKEND.md` and the relevant part of `docs/ARCHITECTURE.md`.
3. Read the matching PRD section and existing migrations.
4. Verify current framework/SDK behavior through Context7 before depending on an unstable API.
5. State invariants, authorization and transaction boundary before editing.
6. Write the migration or domain contract first when data shape changes.
7. Implement one vertical use case behind a typed application boundary.
8. Add authorization, validation, idempotence, audit and safe errors.
9. Test unit logic, database constraints/RLS and the integration path.
10. Update `docs/PROJECT_STATUS.md`, `docs/IMPLEMENTATION_PLAN.md` and `docs/DECISIONS.md` when needed.

## Non-negotiable rules

- Recalculate price, tax, delivery, availability and total on the server.
- Store money as integer cents in EUR.
- Enable RLS before exposing a table and test cross-user denial.
- Use a privileged Supabase client only in an authorized server-only case.
- Keep order, payment, shipment, invoice and notification states separate.
- Verify webhook signatures and persist provider event IDs for idempotence.
- Never treat a browser redirect as payment proof.
- Never store PAN, CVV, raw card data, passwords or secrets.
- Keep issued invoice PDFs and snapshots immutable; corrections are new audited documents.
- Persist the business transaction before scheduling Resend or Telegram.
- A notification failure must be retryable and must not roll back or duplicate an order.
- A regulated product remains unpublished until mandatory compliance fields and documents exist.

## Verification

- Unit tests for calculations, transitions and authorization decisions.
- Integration tests for constraints, transactions, RLS and concurrent inventory.
- Contract tests for provider adapters.
- Replay tests for duplicate/out-of-order webhooks.
- Access tests for signed tracking and invoice downloads.
- Log inspection to confirm redaction of secrets and personal data.

Do not connect live payment, production storage, real e-mail recipients or a supplier feed unless the user explicitly authorizes that external change.
