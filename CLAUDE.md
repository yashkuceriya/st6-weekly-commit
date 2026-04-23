# CLAUDE.md — Weekly Commit Module

This document is for the engineer (or AI) opening this repo for the first time.
It captures _what was built_, _what was deliberately scoped down_, _why decisions
were made the way they were_, and _what I'd ask Charles in person_ if I had time.

It is intentionally honest. Read this before reading code.

---

## What this is, in one paragraph

A production-shaped micro-frontend module that replaces 15Five for ~175+ employees.
Every weekly commit is hard-linked to a Supporting Outcome in the
**Rally Cry → Defining Objective → Outcome → Supporting Outcome** hierarchy
(RCDO), the system runs the full weekly lifecycle as a state machine, and the
manager surface is an _exception queue_ rather than a passive dashboard. The
visual identity is deliberately not corporate-blue — warm cream, terracotta
accent, generous whitespace — to signal that this is a thinking tool, not a form.

---

## Architectural decisions

### Repository layout — Nx + Yarn workspaces, four scopes

```
apps/
  pa-host/                   shell — Auth0, store, navigation, MF host
  weekly-commit-remote/      MF remote — exposes ./WeeklyCommitApp
libs/
  shared-types/              TS contracts (DTOs, enums) — scope:shared-contracts
  shared-ui/                 Flowbite + Claude design tokens — scope:shared-ui
  api-client/                RTK Query slice — scope:api-client
services/
  weekly-commit-api/         Spring Boot 3.3 + Java 21 + Gradle Kotlin DSL
e2e/                         Cypress 13 + Cucumber/Gherkin
infra/                       docker-compose: Postgres 16.4, LocalStack, MailHog
```

Module boundaries are enforced by `@nx/enforce-module-boundaries` ESLint rule
with explicit `scope:*` tags — the host can only import shared libs, the
remote can only import shared libs, shared libs depend only on contracts.

### Frontend — Vite Module Federation, host/remote, shared singletons

Using `@originjs/vite-plugin-federation`. Host consumes `weekly_commit` remote
at runtime from `:4201` (dev) or its CDN URL (prod). React, ReactDOM,
react-redux, RTK, react-router-dom are shared as singletons with
`requiredVersion` so hooks and context cross the federation boundary safely.

The remote uses **relative routes** internally and accepts a `basePath` prop —
this lets the host mount it at any path without coupling the remote to where
it lives.

**Auth bridge:** the remote has no `@auth0/*` dependency. The host calls
`setAuthTokenProvider(...)` from `@st6/api-client` once on startup; RTK Query's
`prepareHeaders` reaches into that module-scoped provider for every request.
That's how the remote authenticates without prop-drilling.

**Stale-chunk handling:** federated CDN deploys can leave clients pointing at
expired chunks. `apps/pa-host/src/stale-chunk.ts` listens for Vite's
`vite:preloadError` and forces a hard reload. HTML/manifest should be
no-cache; chunk files are content-hashed and long-cache.

### Backend — Spring Boot 3.3 / Java 21 / Gradle Kotlin DSL

JHipster-style conventions throughout: `AbstractAuditingEntity` base class
with `@CreatedBy`, `@CreatedDate`, `@LastModifiedBy`, `@LastModifiedDate`;
`AuditorAware<String>` resolves the current user from the Spring Security
context (the dev profile seeds it from a header; prod from the JWT subject).

**Flyway 10 + Postgres caveat:** Spring Boot 3.3 ships Flyway 10, which split
its DB modules out. We declare both `flyway-core` and `flyway-database-postgresql`
explicitly — without that, migrations fail at runtime against PG.

**State machine — 4 states, Carry Forward as an action.** The brief lists
"DRAFT → LOCKED → RECONCILING → RECONCILED → Carry Forward" as the lifecycle;
I treat the first four as the actual state machine and Carry Forward as an
_action_ during/after RECONCILING that creates child commits in next week's
DRAFT plan with provenance back to the source. This preserves immutability of
historical weeks and matches modern check-in UX. **If Charles meant a literal
5th state, this is one schema migration to switch.**

**Hard alignment rule enforced at LOCK, not at draft save.** Drafts can be
incomplete (preserves the 15Five-style fast-save UX). Lock guard rejects with
field-level errors per commit — no commit may lack `supportingOutcomeId`,
`chessLayerCategoryId`, `priorityRank`, or `expectedEvidence`. Same shape on
the RECONCILED transition.

**Lock-time snapshot.** When a plan locks, we snapshot
`locked_outcome_path` (full breadcrumb string) and `locked_outcome_titles`
(JSONB map) onto each commit. This protects historical reporting if RCDO is
later renamed or restructured. The live FK still resolves to the current
hierarchy; the snapshot tells you what it _was_ at the time the user committed.

**Optimistic locking** with `@Version` on `weekly_plan` and `weekly_commit` —
IC edits, reconciliation, and manager review can race and last-write-wins
would silently destroy work.

**Outbox pattern.** State transitions write an `outbox_event` row in the same
transaction as the state change. A scheduled poller publishes (in-process for
this take-home; the README documents the SNS/SQS swap for prod).

### API style — command endpoints over PATCH

`/plans/{id}/lock`, `/plans/{id}/start-reconciliation`, `/plans/{id}/reconcile`,
`/plans/{id}/review`, `/plans/{id}/carry-forward`. Each is a domain operation,
not a free-form update. Easier to secure (`@PreAuthorize("hasAuthority('SCOPE_plan:lock')")`),
easier to test, and they map 1:1 to state-machine events.

### RTK Query — split endpoints, tag-based invalidation

Endpoints live in `libs/api-client/src/endpoints/*` and inject into a single
shared slice. Tag types: `Plan`, `CurrentPlan`, `TeamPlans`, `Exceptions`,
`TeamRollup`, `StrategicTree`, `ChessLayers`, `Review`. Mutations are
intentional about what they invalidate — `lock` invalidates the plan plus
team plans, exceptions, and the rollup; `addCommit` invalidates only the plan.

---

## Decisions where the brief was ambiguous

These are the decisions where I picked a defensible default and wrote it down
so the reviewer can flip it without rework.

| Brief ambiguity | Choice | Reason | How to flip |
|---|---|---|---|
| **Chess layer semantics** | Admin-configurable taxonomy table — `name`, `description`, `color`, `display_order`, `weight`, `is_default`. Affects both ordering and categorisation. Seeded with Offense / Defense / Maintenance / Discovery. | Brief gives no industry-standard meaning. Configurable table is reversible if Charles defines it differently. | Replace seed rows or hardcode an enum if it's actually fixed semantics. |
| **Carry Forward as state vs action** | Action — creates child commits in next week's DRAFT with `source_commit_id` + `carry_generation`. State machine has 4 states. | Preserves historical-week immutability; matches second-research recommendation. | Add `CARRIED_FORWARD` to the state enum, add a transition. |
| **Cypress vs Playwright** | Ship Cypress + Cucumber/Gherkin per the explicit Code Quality requirement. Playwright config skeleton with one smoke test included as a future migration target. | Code Quality is the gate; Dev Tools is permissive. Honoring the gate wins. | Delete `e2e/` Cypress files, expand the Playwright skeleton. |
| **RCDO linkage required when?** | Only at LOCK transition, not on draft save. | Adoption-friction risk is the #1 ship risk per research; lock-time enforcement still gives 100% alignment on locked work. | Tighten the validator on `addCommit` / `updateCommit`. |
| **Microsoft Graph scope for v1** | `Mail.Send` only — manager digest on `WeekLockedEvent`. Calendar awareness and To Do export documented as next phases. Behind `app.outlook.enabled` flag (default off). | Lowest token-scope sprawl, highest demo value. | Add scopes to the Azure app registration; implement the stubbed `createFocusBlock` method. |
| **Redux store integration with PA host** | Remote registers `weeklyCommitApi.reducer` into the host's store at startup; auth wired via module-scoped `setAuthTokenProvider`. | More idiomatic than running an isolated sub-store. The host already knows about the slice from `libs/api-client`. | Remote could spin up its own store if the host's store contract is incompatible. |

---

## What was deliberately scoped down

Take-home timeline (~12 productive hours). The following were _explicitly_ cut
with documented next-phase plans, not forgotten:

- **Microsoft Graph webhook subscriptions** — the SDK + Graph API has
  validation handshakes, certificate rotation, and renewal cadences that take
  half a day to do properly. Shipped: synchronous `sendMail` digest. Plan:
  swap to subscription-driven sync once the production Azure app registration
  is in place.
- **AI-assisted commit titling / outcome suggestions** — research warned
  against making the demo depend on a fragile AI story. Skipped entirely.
  Plan: optional sidecar service called from the new-commit modal.
- **Trend analytics (week-over-week, quarter rollups)** — secondary view,
  better as a separate page once the operating cadence is real. The metrics
  themselves are computed and exposed; the visualisation is what's deferred.
- **Full RBAC config** — single `MANAGER` role check; no granular per-team
  delegation. Plan: scope-based + team-membership checks once the org chart
  data model is real.
- **CloudFront + EKS deploy automation** — Terraform/Pulumi is not in the
  brief deliverable. Documented in README + this file: S3 + OAC (not OAI) for
  remote bundles, EKS + Karpenter for the API.

---

## Open questions for Charles

1. **Chess layer** — what is it, exactly? The configurable interpretation is
   defensible but I'd rather build the right thing than the flexible thing.
2. **PA host store wiring** — does the existing PA shell expose
   `injectReducer`, or do existing remotes run isolated sub-stores? The
   choice here affects how cleanly the WC reducer lives alongside others.
3. **Auth0 tenant** — there's a placeholder `VITE_AUTH0_*`; what's the real
   tenant + audience for the WC API resource server?
4. **RCDO lifecycle** — when an Outcome is sunset mid-quarter, what should
   happen to in-flight commits already linked to it? Today they keep the
   snapshot path; they'd just stop counting toward live coverage.
5. **Manager review SLA** — 48h is a default; is there an org-level standard?
6. **Outlook tenant scope** — is `Mail.Send` (app-only) acceptable or do we
   need delegated `Mail.Send` so digests come from the manager's mailbox?

---

## How AI was used

This was built with Claude as a pairing partner.

- **Spec interrogation** — two rounds of deep-research synthesis (15Five
  baseline, RCDO/Lencioni framework, Vite Module Federation patterns, Spring
  State Machine vs enum, Flyway 10 PG split). Output landed in
  `~/.claude/projects/-Users-yash-ST6/memory/` so future sessions inherit
  context without re-deriving it.
- **Scaffolding** — root configs, Tailwind preset, RTK Query split-API
  pattern, Spring Boot security configs were generated; I reviewed each before
  accepting.
- **Domain modelling** — entity field-by-field, state-machine transitions,
  outbox flow walked through with the AI; final shape committed by hand.
- **Test generation** — JUnit + Vitest skeletons drafted; I tightened the
  assertions and added the edge cases that mattered.

What stayed entirely human: the product thesis (enforced alignment,
reconciliation hero, exception queue), the visual identity (Claude-style
warm cream + terracotta), and these decision tradeoffs.

---

## Where to start reading

1. `services/weekly-commit-api/src/main/resources/db/migration/` — schema is
   the truth.
2. `services/weekly-commit-api/src/main/java/com/st6/weeklycommit/statemachine/`
   — the state machine config + guards + actions.
3. `libs/api-client/src/endpoints/plans.ts` — the API contract from the
   client's perspective; everything in the UI flows through here.
4. `apps/weekly-commit-remote/src/WeeklyCommitApp.tsx` — the entry point the
   host loads; routes from there.
5. The other markdown in this file's directory — `README.md` is the
   quickstart; this file is the _why_.
