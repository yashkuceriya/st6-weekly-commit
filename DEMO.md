# Demo script — Weekly Commit Module

Five minutes to land the product thesis. Read [`CLAUDE.md`](./CLAUDE.md) first
for the architectural narrative.

## Bring up the stack

```bash
yarn install
yarn infra:up         # Postgres, LocalStack, MailHog
yarn dev:api          # backend on :8080
yarn dev              # host :4200 + remote :4201

open http://localhost:4200
```

## The demo moment

The FE proxies `/api/*` to the backend. Auth is bypassed in dev — use the
`X-Dev-User` header (browser DevTools → Network → request → modify) to act as
different seeded users. Default identity: `dev-ic@st6.local`.

### 1. IC plans a week (and gets blocked by the alignment rule)

- Open `/weekly-commit/me` — the planner shows an empty week.
- Click **Add your first commit**, fill in title + evidence only — leave
  Supporting Outcome and Chess layer blank.
- Lock button is **disabled** with the hint *"1 issue to fix below"*.
- The CommitCard surfaces field-level errors: *"Pick a Supporting Outcome"*
  and *"Pick a chess layer"*.

### 2. IC fixes alignment and locks

- Click **Edit** on the commit. The Strategic Node Picker shows the full
  RCDO tree as breadcrumbs (RC › DO › O › SO). Search "outbound" → pick
  *Build outbound campaign for fintech vertical*.
- Pick a chess layer chip (Offense, color-coded).
- Save. Add a second commit similarly.
- Click **Lock the week**. State badge flips to **Locked**, banner shows
  *Locked at {time}*. Backend snapshots the breadcrumb path on each commit
  (`locked_outcome_path`).

### 3. IC reconciles (Friday)

- Click **Start reconciliation**. Side-by-side rows appear: planned on the
  left (read-only with snapshot path), actual on the right.
- Mark commit 1 as **Delivered**. Mark commit 2 as **Missed**, fill in
  actual + delta + choose **Carry forward**.
- Submit becomes enabled when every commit has a complete disposition.
- Click **Submit reconciliation**. Plan moves to **Reconciled**. A child
  commit lands in next week's DRAFT plan with `source_commit_id` and
  `carry_generation = 2`.

### 4. Carry-forward escalation (advance the demo)

- If you simulate a 2nd carry (carry_generation = 2 on the source), the
  reconciliation form requires ≥ 60 chars of rationale. The 3rd flips
  `requires_manager_ack=true` on the child commit.

### 5. Manager exception queue

- Set `X-Dev-User: morgan.chen@st6.local` and visit `/weekly-commit/team`.
- Top of page: rollup metrics (alignment %, lock rate, review SLA, carry
  rate, time-to-plan median).
- Below: actionable cards. Repeated carry-forwards, overdue locks, pending
  review SLA, blocked high-priority work — each with a primary action.

## Behind the scenes during the demo

- Each state transition writes an `outbox_event` row in the same
  transaction; the `OutboxPoller` re-publishes it.
- `PlanLockedDigestListener` fires on `PlanLockedEvent` (post-commit) and
  calls `OutlookGraphService.sendManagerDigest` — logs only by default,
  flips to real `Mail.Send` when `st6.outlook.enabled=true` with credentials.
- All entities extend `AbstractAuditingEntity` — `created_by`, `created_at`,
  `updated_by`, `updated_at` populated from the JWT subject (or the
  `X-Dev-User` header in dev).
- `@Version` on `weekly_plan` and `weekly_commit` — concurrent edits hit
  `ObjectOptimisticLockingFailureException` → 409 with a clean message.

## What the reviewer should look at

| Question | Where to look |
| --- | --- |
| Is alignment really enforced? | `services/.../service/PlanGuards.java` and the `weekly_commit_outcome_must_be_supporting` trigger in `V4__weekly_commit.sql`. |
| How does carry-forward work? | `CarryForwardService` + `V4` schema (`source_commit_id`, `carry_generation`) + `ReconciliationRow.tsx` escalation UI. |
| Where's the snapshot? | `PlanLifecycleService.snapshotOutcomesAtLock()`, plus `locked_outcome_path` and `locked_outcome_titles` columns. |
| Does the host actually load the remote? | `apps/pa-host/vite.config.ts` (host MF config) ↔ `apps/weekly-commit-remote/vite.config.ts` (exposes). |
| Where's the test coverage? | `services/.../service/PlanGuardsTest.java`, `PlanLifecycleServiceTest.java`, `apps/weekly-commit-remote/src/lib/*.test.ts`, `e2e/cypress/e2e/*.feature`. |
