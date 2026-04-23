# INTERVIEW_PREP.md — Weekly Commit Module

**For:** ST6 / Solovis interview with AJ Watson + Charles Harris on 2026-04-23.
**Reading time:** 30 min if you skim, 90 min if you study every section.
**Goal:** be able to defend any line of this codebase under pointed questions, run the demo cold, and steer the conversation toward your strongest ground.

> If you read only one thing, read sections 1–3 and the demo script in 5.

---

## 1. Elevator pitch — memorise the exact words

> "It's a strategy-execution control layer that happens to run on a weekly people cadence. Every weekly commit is hard-linked to a Supporting Outcome in the RCDO hierarchy at lock time, the system runs the full DRAFT → LOCKED → RECONCILING → RECONCILED lifecycle as a state machine with carry-forward as a deliberate action, and the manager surface is an exception queue that answers 'who needs my attention right now', not a passive analytics dashboard. The visual identity is deliberately not corporate-blue because it's a thinking tool, not another HR form."

That's 75 seconds when spoken. Practice it three times out loud before the call.

---

## 2. The product thesis (the one-liner you can repeat all day)

**One line:** "We're not building a better weekly check-in form — we're building the missing operating-rhythm layer between strategy and weekly execution."

**Three sentences (use when asked "why is this not just a 15Five clone?"):**

1. 15Five lets a user *optionally* link a priority to an objective; ST6's brief asks for **mandatory** structural binding to the lowest strategic node, which is a different product posture, not a polish.
2. The differentiator screen is **reconciliation** — plan-vs-actual, delta reason, and carry decision in one side-by-side view — because that's where execution honesty happens, and existing tools only have it scattered across status and dashboard surfaces.
3. The manager surface is an **exception queue** — overdue lock, repeated carry-forward, blocked high-priority — not another BI dashboard, because dashboards tell you what happened, queues tell you what to do next.

**If they push: "but is enforcement actually different from a required field?"**
> "Three places — DB-level trigger refuses non-SUPPORTING_OUTCOME nodes, service-level guard returns field-level 422 errors per commit, and the lock button is disabled in the UI with the same hint. Three layers because adoption friction is the #1 ship risk and we have to be honest about why a commit can't be locked."

---

## 3. Architecture deep-dive — be able to draw this on a whiteboard

```
┌──────────────────────────────────────────────────────────┐
│              Browser  (cream background)                  │
│   ┌──────────────────────────────────────────────────┐   │
│   │ apps/pa-host  (React 18 + Vite 5, port 4200)     │   │
│   │  · Auth0 SDK + token bridge                       │   │
│   │  · RTK store (weeklyCommitApi reducer + middleware│   │
│   │  · React Router, navigation, page chrome          │   │
│   │  · vite:preloadError handler (stale chunks)       │   │
│   └──────────────────┬───────────────────────────────┘   │
│                      │ Module Federation (runtime fetch) │
│   ┌──────────────────▼───────────────────────────────┐   │
│   │ apps/weekly-commit-remote (Vite 5, port 4201)    │   │
│   │  · Exposes ./WeeklyCommitApp                      │   │
│   │  · /me   → PlannerPage  (drag-rank, AI suggest)   │   │
│   │  · /me/reconcile → ReconciliationPage (hero)      │   │
│   │  · /team → ManagerQueuePage (exceptions+rollup)   │   │
│   │  · Activity feed side-rail on planner             │   │
│   └──────────────────────────────────────────────────┘   │
│                                                            │
│   libs/  shared-types · shared-ui (Claude tokens)         │
│          api-client (RTK Query, split endpoints, tags)    │
└─────────────────────────┬────────────────────────────────┘
                          │ /api proxy → :8080
              ┌───────────▼────────────┐
              │ services/weekly-commit │
              │   Spring Boot 3.3 + 21 │
              │ ┌────────────────────┐ │
              │ │ web (controllers)  │ │  · Plan/Commit/Team/Review
              │ │ - command APIs     │ │  · Activity / AI suggest
              │ │ - @PreAuthorize    │ │  · GlobalExceptionHandler
              │ │ - GlobalExHandler  │ │
              │ ├────────────────────┤ │
              │ │ service            │ │  · PlanLifecycleService (4-state machine)
              │ │ - PlanGuards       │ │  · CarryForwardService
              │ │ - ManagerQueueSvc  │ │  · StrategicPathResolver (recursive CTE)
              │ │ - ActivityFeedSvc  │ │  · AiAssistService (stubbed)
              │ ├────────────────────┤ │
              │ │ domain             │ │  · AbstractAuditingEntity
              │ │ - 12 entities      │ │  · @Version everywhere
              │ │ - 7 enums          │ │  · Lock-time snapshot cols
              │ ├────────────────────┤ │
              │ │ outbox + listeners │ │  · OutboxPoller (in-process; SNS swap-ready)
              │ │ - PlanLockedDigest │ │  · OutlookGraphService (Mail.Send stub)
              │ └────────────────────┘ │
              └───────────┬────────────┘
                          │
              ┌───────────▼────────────┐
              │ Postgres 16.4          │  · 11 Flyway migrations
              │ + extensions:          │  · Polymorphic strategic_node + cycle trigger
              │   uuid-ossp, pgcrypto, │  · Partial unique index per user/week
              │   pg_trgm              │  · Outbox table with partial unpublished idx
              └────────────────────────┘
```

### Box-by-box defense

**`apps/pa-host`** — The shell. Owns navigation, Auth0, the Redux store. Its `vite.config.ts` declares `weekly_commit` as a remote and shares React/RTK/Router as singletons with `requiredVersion`. Loads the remote lazily so initial render doesn't pay for the full WC bundle.

**`apps/weekly-commit-remote`** — Federated remote. Exposes `./WeeklyCommitApp` (the entire WC sub-application) as a default export. Receives `basePath` prop so the host can mount it anywhere; uses relative routes internally. **Has no `@auth0/*` dep** — it reaches auth via `setAuthTokenProvider` in `@st6/api-client`, which the host wires once at startup.

**`libs/shared-types`** — Source of truth for wire-shape DTOs and enums. Compiles with `noUncheckedIndexedAccess: true`. Tagged `scope:shared-contracts`; no other lib may import anything else.

**`libs/shared-ui`** — Tailwind preset (Claude design tokens), Flowbite primitives, custom components (Card, Breadcrumb, StatusBadge, Sparkline, ActivityFeed). Reusable across host + remote.

**`libs/api-client`** — Single `weeklyCommitApi` slice with `injectEndpoints` per file (plans, commits, strategic-nodes, chess-layers, exceptions, reviews, activity, ai, rollup-history). Tag types are intentionally small and meaningful: `Plan / CurrentPlan / TeamPlans / Exceptions / TeamRollup / StrategicTree / ChessLayers / Review`. Mutation invalidation is precise — `lock` invalidates `Plan + CurrentPlan + TeamPlans + Exceptions + TeamRollup`, `addCommit` invalidates only `Plan + CurrentPlan`.

**`services/weekly-commit-api/web`** — Controllers are command-oriented, not PATCH-heavy. `/plans/{id}/lock`, `/plans/{id}/reconcile`, `/plans/{id}/start-reconciliation`, `/plans/{id}/review`. Each maps 1:1 to a state-machine event. Method-level `@PreAuthorize("hasAuthority('SCOPE_plan:lock')")` gates each.

**`services/.../service/PlanLifecycleService`** — The state machine. Explicit `lock()`, `startReconciliation()`, `reconcile()` methods. Each: requires source state, runs guard (delegates to `PlanGuards`), mutates state + timestamps, snapshots breadcrumb on lock, writes `outbox_event` row in same transaction, publishes Spring `ApplicationEvent` for in-process listeners. **Why not Spring State Machine?** Library is reactive in 4.x with Mono-style `sendEvent`; for a 4-state machine the ceremony costs more than it pays. CLAUDE.md notes this is flippable.

**`services/.../service/PlanGuards`** — The product thesis encoded. `guardLock()` returns `PlanValidationException` with field-level errors (commit_id + field + message) so the API can surface "Commit X is missing Supporting Outcome" instead of a generic toast. `guardReconcile()` enforces the carry-forward escalation rule (gen 2 needs ≥60 chars, gen 3 sets `requires_manager_ack`).

**`services/.../service/CarryForwardService`** — Materialises a CARRY_FORWARD decision into a real child commit in next week's DRAFT plan. Sets `source_commit_id`, increments `carry_generation`, flips `requires_manager_ack` at gen 3+. Creates the next-week plan if it doesn't exist.

**`services/.../service/StrategicPathResolver`** — Recursive CTE walks `strategic_node` table from a given node up to its Rally Cry root. Includes path-array cycle guard per PG warning. Used at lock time to snapshot `locked_outcome_path` + `locked_outcome_titles` JSONB.

**`services/.../service/ManagerQueueService`** — Computes 5 exception types (overdue lock, pending review SLA, repeated carry-forward, outcome coverage gap, blocked high-priority) plus 6 rollup metrics. Uses `Pageable` for the underlying queries — designed for the brief's 2000-record team scale.

**`services/.../outbox`** — `OutboxPoller` runs every 5 seconds (configurable), fetches unpublished events ordered by `created_at`, dispatches via `ApplicationEventPublisher`. In prod, the dispatch step swaps to SNS publish without changing writers — at-least-once delivery, no cross-process race.

**`services/.../integration/OutlookGraphService`** — Manager digest via Microsoft Graph `Mail.Send`. Behind `app.outlook.enabled` flag; logs only by default. Wired through `PlanLockedDigestListener` which fires AFTER_COMMIT (transactional event) so we don't notify on rolled-back transactions.

**Postgres schema** — 11 migrations, ordered:
- V1: `team`, `app_user`, `strategic_node` (polymorphic with cycle-guard trigger)
- V2: `chess_layer_category` (admin-configurable taxonomy)
- V3: `weekly_plan` (state enum, partial unique index per user/week)
- V4: `weekly_commit` (FK to outcome with type-check trigger, snapshot cols, carry provenance)
- V5: `commit_reconciliation` (status + carry decision + escalation)
- V6: `manager_review`
- V7: `commit_event` (append-only audit)
- V8: `outbox_event` (partial idx on unpublished)
- V9: seed data (Rally Cry, 4 DOs, 12 Os, 30 SOs, 3 mgrs, 12 ICs, dev user)
- V10: hot-path performance indexes for 2000-record scale
- V11: `user_role` table (RBAC done properly; replaces boolean flags)

---

## 4. Decision log — every choice you made and what you rejected

| # | Decision | What you picked | What you considered | Why | If they push back |
|---|---|---|---|---|---|
| 1 | Frontend MF tool | Vite 5 + `@originjs/vite-plugin-federation` | Webpack 5 MF, `@module-federation/vite` (newer official) | **Brief explicitly says Vite 5.** Originjs has 5x the production usage and Stack Overflow coverage of the newer plugin. | "Webpack MF is more battle-tested" → "Yes, but the brief specified Vite 5. The plugin is mature enough for a take-home; for prod I'd evaluate the newer official one." |
| 2 | Monorepo | Nx + Yarn workspaces | Flat repo, Turborepo, pnpm workspaces, Bun | **Brief explicitly requires Nx + Yarn.** Used Nx tag-based ESLint boundaries (`scope:pa-host`, `scope:weekly-commit`, `scope:shared-ui`, `scope:shared-contracts`, `scope:api-client`) so module direction is enforced, not aspirational. | If "isn't Nx overkill?" → "For 2 apps + 3 libs maybe. The boundary-tag rule is what pays for it — without it, the remote could leak imports into the host's auth and we'd never know." |
| 3 | FE state | Redux Toolkit + RTK Query | Tanstack Query + Zustand, SWR, plain fetch | **Brief explicitly requires RTK Query.** Used `injectEndpoints` split-API pattern so endpoints are tree-shakeable and the remote bundle only ships what it uses. | "Tanstack Query is lighter" → "True, and that's a good v2 conversation, but RTK Query gives me single-store sharing across host + remote which would be ugly with Tanstack." |
| 4 | UI kit | Flowbite React + custom components | Radix primitives, Mantine, Material UI, headless | **Brief explicitly requires Flowbite React + Tailwind.** Built domain-specific components (Card, Breadcrumb, StatusBadge, Sparkline, ChessChip) on top so the design language can be reskinned without touching pages. |
| 5 | E2E | Cypress 13 + Cucumber/Gherkin | Playwright | Brief lists Vitest+Playwright in Dev Tools AND Cypress+Cucumber in Code Quality. Code Quality is explicitly the gate, so Cypress wins. Playwright config skeleton kept as next-gen migration target. | If "but Playwright is faster and more reliable now" → "Agreed for new builds. Cypress was the explicit Code Quality gate; honoring the spec is the take-home test. Playwright migration is one of the things I'd put in the v2 sprint." |
| 6 | Backend lang | Java 21 + Gradle Kotlin DSL | Java 21 + Maven, Kotlin | **Brief requires Java 21.** Picked Gradle Kotlin DSL over Maven for terser config; JHipster's default is Maven so flag this. |
| 7 | Schema strategy | Polymorphic `strategic_node` table | 4 separate tables (rally_cry, defining_objective, outcome, supporting_outcome) | One table with `type` enum + self-FK + cycle-guard trigger. 4 tables would have 4 nearly-identical schemas + 6 join paths to walk. Polymorphic loses some FK strictness, gained back via the `type` check trigger on `weekly_commit.supporting_outcome_id`. | "But a single polymorphic table can't enforce 'commit FK must be SUPPORTING_OUTCOME'" → "It can't via FK alone; that's why V4 has the `weekly_commit_outcome_must_be_supporting` trigger. Belt and braces." |
| 8 | State machine | Explicit `PlanLifecycleService` | Spring State Machine 4.x (reactive), Spring State Machine 3.x (blocking), enum + if-statements | Explicit transitions are 200 lines, fully tested, no Mono ceremony, easy to read. Spring State Machine excels for >5 states with deep guard hierarchies. CLAUDE.md notes flippable. | If "but the brief says state machine" → "It is a state machine — explicit `lock()`, `startReconciliation()`, `reconcile()` methods, each with state precondition + guard + action. The framework would mostly be in the way at this size." |
| 9 | Carry Forward | Action that creates child commit, NOT 5th state | Literal 5th state per brief wording | Preserves immutability of historical weeks. Carry-forward children live in next week's plan with `source_commit_id` provenance + `carry_generation` counter. CLAUDE.md notes this interpretation explicitly. | If "Charles meant a literal state" → "It's one schema enum addition + one transition to switch. The current shape mirrors how 15Five and Lattice handle it; I went with that." |
| 10 | Validation timing | Enforce alignment at LOCK transition, not draft save | Block on every save | Adoption friction = #1 ship risk per the second-research synthesis. Drafts can be incomplete; lock cannot. UX matches 15Five's fast save; the rule kicks in only when work is *committed*. |
| 11 | API style | Command endpoints for transitions | PATCH-heavy REST, GraphQL mutations | `/lock`, `/start-reconciliation`, `/reconcile`, `/review` map 1:1 to state events. Easier to secure (`@PreAuthorize` per scope), easier to test, and a controller method's URL tells you what business operation it is. |
| 12 | Auth | Auth0 OAuth2 JWT (resource server) + dev bypass | Spring Security form login, custom JWT, Auth0 with no bypass | **Brief requires Auth0.** Dev profile uses `PermissiveAuthenticationFilter` reading `X-Dev-User` header so the FE works without an Auth0 tenant. Prod profile (`SecurityConfig`) requires real JWT with audience verification. Scope-based `@PreAuthorize` works in both modes. |
| 13 | Lock-time snapshot | Snapshot breadcrumb on each commit at lock | Always derive from live FK | RCDO can be renamed/restructured; historical reports would silently change. Snapshot `locked_outcome_path TEXT` + `locked_outcome_titles JSONB` on each commit when state moves to LOCKED. Live FK still resolves; snapshot is the historical truth. |
| 14 | Optimistic locking | `@Version` on `weekly_plan` and `weekly_commit` | Pessimistic SELECT FOR UPDATE | IC edits + reconciliation + manager review can race; last-write-wins would silently destroy work. `@Version` gives `ObjectOptimisticLockingFailureException` → 409 with a clean "refresh and try again" message via GlobalExceptionHandler. |
| 15 | Async pattern | Outbox table + scheduled poller | Direct event publishing, Spring transactional events only | Outbox guarantees at-least-once delivery: state change + outbox row in same transaction; poller publishes after commit. In prod, swap dispatcher to SNS publish without changing writers. |
| 16 | Outlook scope | `Mail.Send` only (manager digest) | Calendar awareness, To Do export, webhook subscriptions | Lowest token-scope sprawl, highest demo value. Calendar + To Do stubbed; webhook plan documented in CLAUDE.md. |
| 17 | Chess layer | Admin-configurable `chess_layer_category` table | Hardcoded enum, free-form tags | Brief doesn't define semantics. Reference table with name/color/order/weight/is_default — reversible if Charles defines it differently. Seeded with Offense/Defense/Maintenance/Discovery. |
| 18 | RBAC | `user_role` join table (V11) | Boolean flags on `app_user` | Boolean flags were v0; join table supports per-team grants, role-grant audit, multi-role users. Booleans kept one cycle for migration. |
| 19 | AI assist | Stubbed `AiAssistService` behind feature flag | Real OpenAI call now, skip entirely | Research warned against fragile demo dependencies. Stable interface for `POST /commits/suggest-title` returns templated suggestion in dev; flips to real call when `app.ai.enabled=true`. |
| 20 | CDN auth | Origin Access Control (OAC) | Origin Access Identity (OAI) | OAI is deprecated. OAC works only with regular S3 origins (not website endpoints). Documented in CLAUDE.md infra section. |
| 21 | Visual identity | Claude warm cream + terracotta | Conventional enterprise blue, dark mode | Memorability. The CPO is "Artificial Intelligence Head" per ZoomInfo; a Claude-aesthetic enterprise tool reads as "intelligent operating tool" not "another HR form." Differentiator before the user reads a label. |

---

## 5. Demo script — the exact 5 minutes

**Before the call:** `yarn infra:up && yarn dev:api & yarn dev`. Open `http://localhost:4200` in a clean browser window. Have CLAUDE.md and DEMO.md open in side tabs.

**Pacing:** ~60s per scene. Don't apologise for stub anywhere. Don't say "I would have done X if I had more time" — instead say "X is documented as next-phase in CLAUDE.md."

### Scene 1 — opening framing (60s)
> "Quick opening before I click anything. The point of this isn't a better form — it's an operating-rhythm layer between strategy and weekly execution. The product thesis is in three places: enforced strategic alignment, reconciliation as a hero screen, and a manager exception queue. I'll touch all three. The visual choice is intentional — warm cream, not corporate blue — because this is supposed to feel like a thinking tool."

### Scene 2 — IC plans, hits the alignment rule (60s)
- Open `/weekly-commit/me`. Empty state visible.
- Click **Add your first commit**. Type "Refresh decks". Type evidence. **Skip outcome and chess layer.** Save.
- Lock button is **disabled** with "1 issue to fix below". CommitCard shows red errors: "Pick a Supporting Outcome", "Pick a chess layer".
- Say: "Three layers of enforcement — UI disables the button, service returns a 422 with field-level errors, DB has a type-check trigger. Each layer protects the next."

### Scene 3 — IC fixes alignment, locks (60s)
- Click Edit. Open the strategic node picker. Search "outbound". Pick a SO.
- Pick the Offense chess chip.
- Save. Lock. Banner flips to "Locked at {time}".
- Say: "On lock, the service snapshots the breadcrumb path onto each commit — `locked_outcome_path` and `locked_outcome_titles` JSONB. RCDO can rename freely without breaking history."

### Scene 4 — drag to reorder + activity feed (30s)
- Drag commit 2 above commit 1. Watch ranks update.
- Point to the right rail: "That's the activity feed reading from `commit_event` — every state transition, edit, and integration emission is appended. Audit story flows to a user surface."

### Scene 5 — reconciliation hero (60s)
- Click **Start reconciliation**. Side-by-side rows appear.
- Mark commit 1 Delivered. Mark commit 2 Missed. Fill actual + delta. Choose Carry forward. Type a short rationale.
- Submit. State flips to Reconciled. Message: "child commit landed in next week's plan with provenance back."
- Say: "Reconciliation is the differentiator screen. Plan vs actual, delta, carry decision in one place. The carry-forward rule escalates — a 2nd carry needs a 60-char rationale, a 3rd flips `requires_manager_ack` so a manager has to acknowledge before the plan can lock."

### Scene 6 — manager exception queue (60s)
- Open DevTools → set `X-Dev-User: morgan.chen@st6.local`. Reload.
- Visit `/weekly-commit/team`.
- Top bar: rollup metrics with sparklines (alignment, lock rate, review SLA, carry rate, time-to-plan).
- Below: exception cards. Each card has a primary action button.
- Say: "Cards, not charts. Top question for a manager Monday morning isn't 'what was last week's average', it's 'who needs me right now'. Five card types — overdue lock, pending review SLA, repeated carry-forward, outcome coverage gap, blocked high-priority."

### Scene 7 — close (15s)
> "CLAUDE.md has the full decision log including the things I deliberately scoped down — webhook subscriptions, real AI integration, multi-tenancy. Happy to walk through any of that or take questions."

---

## 6. Likely questions + crisp answers

### Product

**Q: Why is this not just a 15Five clone?**
A: 15Five lets you optionally link a priority to an objective. We make it mandatory at lock time and snapshot the breadcrumb so historical reporting survives RCDO changes. We also reframe the manager surface from a dashboard to an exception queue — different mental model.

**Q: How is this different from Lattice / Betterworks / WorkBoard?**
A: We compress strategy-tool governance, manager-tool cadence, and work-tool immediacy into a single weekly ritual. Lattice is permissive on linkage; WorkBoard is heavy on executive briefings; we sit at the IC↔manager weekly compression point.

**Q: What's the chess layer?**
A: I treated it as admin-configurable taxonomy because the brief doesn't define it. Configurable name/color/order/weight/default. Seeded with Offense/Defense/Maintenance/Discovery. Easy to reskin if you have a specific definition.

**Q: Why is Carry Forward an action, not a state?**
A: Preserves historical-week immutability. A reconciled week is closed; carry-forward creates a child commit in next week's plan with `source_commit_id` provenance. Brief lists 5 states; treating it as 4+action is a one-line schema flip if you'd rather it be literal.

**Q: How do you handle "I missed but I want to drop, not carry"?**
A: Three carry decisions: DROP, FINISHED_NEXT_WEEK (no provenance link), CARRY_FORWARD (system creates child). The reconciliation row records the choice for audit.

**Q: What happens at carry-generation 3+?**
A: The child commit gets `requires_manager_ack=true`. UI shows a warning banner during reconciliation. Manager queue surfaces a REPEATED_CARRY_FORWARD card. Acknowledgement flow is the manager's primary action.

### Architecture

**Q: Walk me through what happens when an IC clicks Lock.**
A: 1) FE evaluates client-side readiness, disables button if any field missing. 2) On click, RTK Query mutation `lockPlan` POSTs `/api/plans/{id}/lock`. 3) `PlanController.lock()` checks `@PreAuthorize('SCOPE_plan:lock')`. 4) `PlanLifecycleService.lock()` requires DRAFT state, runs `PlanGuards.guardLock()` which throws `PlanValidationException` with field-level errors if any commit is incomplete. 5) On pass, sets state=LOCKED, locked_at=now, calls `snapshotOutcomesAtLock()` which uses `StrategicPathResolver` to walk the recursive CTE and write `locked_outcome_path` + `locked_outcome_titles` per commit. 6) Writes outbox_event row in same transaction. 7) Publishes `PlanLockedEvent`. 8) Returns updated plan. 9) RTK Query invalidates `Plan + CurrentPlan + TeamPlans + Exceptions + TeamRollup`. 10) `OutboxPoller` picks up the row 5s later and re-publishes; `PlanLockedDigestListener` fires post-commit and emails the manager via Outlook (logs-only in dev).

**Q: Why explicit state machine instead of Spring State Machine?**
A: Library shines for diagrams of complex workflows with deep guard hierarchies. This lifecycle is 4 states; explicit transitions read more clearly, tests are trivial, and Spring State Machine 4.x is reactive — Mono-style sendEvent ceremony costs more than it pays at this size.

**Q: How do the host and remote share the Redux store?**
A: Host owns the store; on startup it imports `weeklyCommitApi` from `@st6/api-client` and registers its reducer + middleware. The remote uses the same `weeklyCommitApi` instance — the federation singleton config ensures one copy of `@reduxjs/toolkit` and `react-redux` across the boundary. The remote has no `@auth0/*` dep; the host calls `setAuthTokenProvider()` once at startup and the api-client's `prepareHeaders` reaches into that module-scoped provider.

**Q: How does the remote work in standalone dev?**
A: `apps/weekly-commit-remote/src/main.tsx` exists for that case — spins up its own store + a `setAuthTokenProvider(() => 'dev-bypass-token')` so you can develop the remote alone (`yarn dev:remote`). Production builds don't consume `main.tsx`; the host loads `WeeklyCommitApp` directly.

**Q: How does federation handle stale chunks after a deploy?**
A: `apps/pa-host/src/stale-chunk.ts` listens for Vite's `vite:preloadError` and forces a hard reload. HTML/manifest is cached `no-cache`; chunk files are content-hashed and long-cache. Production: CloudFront with OAC (not OAI) backed by a regular S3 origin (not website endpoint).

**Q: What's the outbox for?**
A: Transactional fanout. State changes write `outbox_event` rows in the same DB transaction as the change. Background poller reads unpublished rows in age order and dispatches. In dev, dispatch is in-process via `ApplicationEventPublisher`. In prod, swap to SNS publish — writers don't change. Guarantees at-least-once delivery without coupling business txns to a queue.

**Q: How does the recursive CTE for path resolution avoid cycles?**
A: Path-array guard. Each iteration appends the visited node id to a `cycle_guard UUID[]` and the next step adds `WHERE NOT s.id = ANY(cycle_guard)`. PG explicitly warns about this pattern; we belt-and-braces with the `strategic_node_no_cycle` trigger that refuses inserts/updates that would close a loop.

**Q: Why polymorphic `strategic_node` instead of 4 tables?**
A: One table is 4× simpler with identical shape per node type. The discriminator is the `type` enum. The cost is FK strictness — `weekly_commit.supporting_outcome_id` could in theory point at any node type. We catch that with the `weekly_commit_outcome_must_be_supporting` trigger and the service-level `StrategicPathResolver.requireSupportingOutcome()` check. Three layers, again.

**Q: How does optimistic locking surface to the user?**
A: `ObjectOptimisticLockingFailureException` is caught by `GlobalExceptionHandler` and returned as 409 with message "Stale write — someone updated this concurrently. Refresh and try again." The FE shows it as a banner; RTK Query refetches.

**Q: How big is the JaCoCo coverage gate and what's covered?**
A: 80% on `com.st6.weeklycommit.domain.*` and `com.st6.weeklycommit.service.*`. Excludes config, dto, mapperImpl. Tests: `PlanGuardsTest` (pure-unit guard rules), `PlanLifecycleServiceTest` (Testcontainers integration, full happy path + carry-forward materialisation), `StrategicPathResolverTest` (recursive CTE), `WebLayerIntegrationTest` (MockMvc against every controller), `SmokeTest` (boots the whole context, hits health + actuator).

### Stack

**Q: Why Vite over Webpack for module federation?**
A: Brief said Vite 5. The `@originjs/vite-plugin-federation` plugin is mature; the newer `@module-federation/vite` is the future but has thinner production usage. For a take-home, originjs.

**Q: Why Nx + Yarn workspaces? Isn't that overkill?**
A: Brief required it. The boundary-tag ESLint rule is what pays for it — `scope:weekly-commit` can only import `scope:shared-ui`, `scope:shared-contracts`, `scope:api-client`. Without that rule, the remote could leak imports into the host's auth and we'd never know.

**Q: Why RTK Query and not Tanstack Query?**
A: Brief required RTK Query. It also wins because of single-store sharing across host + remote — Tanstack Query would need cross-app cache hydration to match.

**Q: Why Cypress + Cucumber and not Playwright?**
A: Brief listed both, but Code Quality named Cypress + Cucumber explicitly. Code Quality is the gate. Playwright config skeleton is there as a future-migration target.

**Q: Why Java 21 + Gradle Kotlin DSL?**
A: Java 21 is the brief. Gradle KDSL over Maven for terser config and better refactor support. JHipster's default is Maven; happy to switch if the house style demands.

### Stretch

**Q: What would you do with two more weeks?**
A:
1. Webhook subscriptions for Outlook so cross-day reminders ride Graph notifications instead of polling.
2. AI-assisted suggestion behind real provider with `ai_usage_log` table for cost tracking. Stubbed surface is in `AiAssistService`.
3. Trend analytics — week-over-week deltas, quarterly alignment heatmap. Metrics are computed; visualisation is the deferred work.
4. Multi-tenancy — `tenant_id` everywhere + row-security policies. Single-tenant-now is fine for take-home; not fine for ST6 portfolio.
5. Slack integration as a parallel notification channel via Slack Bolt SDK; same outbox dispatcher routes events.
6. Real Cypress + Cucumber against a seeded staging stack in CI.

**Q: What did you deliberately cut?**
A:
1. Webhook-driven Graph subscriptions. Validation handshake + cert rotation + renewal cadence is a half-day on its own. Synchronous `Mail.Send` is what ships.
2. Real LLM call. Research warned against fragile-AI demo. Stable stub interface ships.
3. Trend analytics views. Metrics are exposed; charts are next-phase.
4. Full team-scoped RBAC. Single MANAGER role check, not per-team grants.
5. PDF / weekly print export. Lovely but invisible in a 5-min demo.

**Q: What's risky in the codebase?**
A: Two things I'd flag honestly:
1. Native HTML5 drag-to-reorder fires N sequential `updateCommit` mutations. At 5 commits it's fine; at 50 we'd want a single `POST /plans/{id}/reorder` endpoint with a single tx.
2. `ManagerQueueService` does in-memory exception sorting and pagination. Up to 2000 records that's acceptable; past that we'd push pagination into the SQL.

### Curveballs

**Q: A user changes a Supporting Outcome's title after I locked. What happens?**
A: My commit's `supportingOutcome` FK still resolves to the renamed node. But `locked_outcome_path` and `locked_outcome_titles` JSONB on my commit hold the breadcrumb as it was at lock. Historical reports use the snapshot; live UI shows current name with a "(was: …)" hint if they diverge. That diff UI is one of the next-phase items.

**Q: Two managers try to review the same plan simultaneously.**
A: One wins, the other gets 409 from the optimistic-lock filter. UI refetches and surfaces the existing review. Real org would have a designated reviewer (manager_id on app_user); this defends against the exception case.

**Q: An IC moves to a new manager mid-week. How does the queue handle it?**
A: Manager → directReports lookup is live, not snapshot. New manager sees the IC immediately; old manager doesn't. Acceptable; if you want a "current week stays with old manager", that's a small denorm.

**Q: How would you scale the rollup metrics for a 10,000-employee org?**
A: Three changes. (1) Push exception detection into SQL — five queries with `EXISTS` instead of in-memory iteration. (2) Materialised view for rollup metrics, refreshed on outbox events for the affected week+team. (3) Pre-compute the rollup history table (the table peer mentions has) so sparklines don't recompute the last 8 weeks on every page load.

**Q: What if Charles tells you the chess layer means "king/queen/bishop urgency tiers"?**
A: One row of seed data + a label-and-color tweak. The model is exactly that flexible.

---

## 7. Stack defense one-pager — what each required tech buys you

| Required tech | Where it's wired | What it buys you |
|---|---|---|
| TypeScript strict | `tsconfig.base.json` with `noUncheckedIndexedAccess: true` | Compile-time safety on every nullable, every array indexer. |
| Java 21 | `services/.../build.gradle.kts` toolchain | Records, pattern matching, virtual threads if needed. |
| React 18 | Both apps' `package.json` | Concurrent rendering for Suspense around the lazy-loaded remote. |
| Vite 5 + MF | `apps/*/vite.config.ts` with `@originjs/vite-plugin-federation` | Sub-second initial render on the host; remote shipped to S3+CloudFront separately. |
| Spring Boot 3.3 | Backend service | JPA + Flyway 10 + actuator + resource server in one stack. |
| RTK Query | `libs/api-client/src/` | Tag-based cache invalidation, generated hooks, single store across host+remote. |
| Flowbite + Tailwind | `libs/shared-ui/tailwind-preset.js` (Claude tokens) | Design system that's not corporate-blue. |
| Vitest | `apps/weekly-commit-remote/vite.config.ts` test block | Fast unit tests on lock-validation, reconciliation logic. |
| Playwright | Brief mentioned; config skeleton; not the default E2E | Documented as future migration target. |
| Postgres 16.4 | `infra/docker-compose.yml` | Recursive CTE for RCDO traversal, partial unique indexes, ENUM types. |
| Hibernate/JPA + Spring Data | All `domain/` + `repository/` | Pageable for 2000-record team views; AbstractAuditingEntity. |
| Flyway | 11 migrations in `db/migration/` | Versioned schema; explicit `flyway-database-postgresql` (Boot 3.3 = Flyway 10 split). |
| Auth0 OAuth2 JWT | `SecurityConfig` + `Auth0ProviderWithRedirect` | Resource-server pattern; scope-based `@PreAuthorize`. Dev bypass via `PermissiveAuthenticationFilter`. |
| Yarn Workspaces + Nx | Root `package.json` + `nx.json` | Tag-based module boundaries enforce host/remote/lib separation. |
| Microsoft Graph (Outlook) | `OutlookGraphService` + `PlanLockedDigestListener` | Manager digest via `Mail.Send`; behind `app.outlook.enabled` flag. |
| AWS EKS / S3 / CloudFront / SNS / SQS | Documented in CLAUDE.md infra section | Outbox is SNS-swap-ready; CDN uses OAC (not OAI). |
| JaCoCo 80% | `build.gradle.kts` with `jacocoTestCoverageVerification` | Domain + service layer gated; config/dto excluded. |
| Cypress + Cucumber/Gherkin | `e2e/cypress/` with `@badeball/cypress-cucumber-preprocessor` | 3 .feature files documenting the alignment, reconciliation, and queue rules in business language. |
| ESLint 9 + Prettier 3.3 | Root `eslint.config.js` (flat) + `.prettierrc` | Includes `@nx/enforce-module-boundaries` for tag-based boundaries. |
| Spotless + SpotBugs | `build.gradle.kts` plugins | google-java-format auto-applied; SpotBugs filters config + dto. |

---

## 8. Open questions for Charles (ask 2–3 of these)

Pick the ones that surface judgment, not gaps:

1. **"What does chess layer mean to you?"** — direct, shows you noticed the brief was vague, gives you a chance to walk through your configurable interpretation.
2. **"In your existing PA host, do remotes register reducers into the host store via `injectReducer`, or do they run isolated sub-stores?"** — signals you know there's a real choice and you made one.
3. **"Is the 5-state lifecycle in the brief literal, or was Carry Forward shorthand for the action?"** — flags your interpretation; not an apology.
4. **"What's the SLA your managers actually hit on weekly review today, in 15Five?"** — signals you care about the baseline, not just the new build.
5. **"For the v2 sprint, would Slack or Teams matter more than Outlook calendar awareness?"** — positions you as already thinking about v2 with them.

**Don't ask:**
- "What stack do you use?" (you should know — it's the brief)
- "How big is the team?" (LinkedIn answers this)
- Open-ended "what would you do differently?" — passive, not curious.

---

## 9. Pre-interview checklist

**The night before (do these in order):**
- [ ] Re-read sections 1, 2, 5 of this doc out loud.
- [ ] `yarn install && yarn infra:up && cd services/weekly-commit-api && ./gradlew test` (bootstraps wrapper + verifies).
- [ ] Walk the demo cold with no notes. Time it. Should land at 5 minutes.
- [ ] Open CLAUDE.md, README.md, DEMO.md, INTERVIEW_PREP.md in pinned tabs.
- [ ] Sleep.

**60 minutes before:**
- [ ] `yarn dev:api &` (wait for "Started WeeklyCommitApplication") then `yarn dev`.
- [ ] Open `http://localhost:4200` in a clean window. Verify all 3 routes work.
- [ ] Verify the demo moment end-to-end once.
- [ ] Quit other apps. One-screen demo, no notifications.

**During the call:**
- [ ] Lead with the elevator pitch (section 1) before sharing screen.
- [ ] Share screen. Run the demo. Don't apologise for stubs.
- [ ] When they ask a question, answer in 1–3 sentences then ask "want to go deeper or move on?"
- [ ] If you don't know: "Honestly, I haven't measured that — my hypothesis would be X." Beats "I'm not sure" every time.
- [ ] Before close: ask 2 of your prepared questions.
- [ ] Final 30 seconds: "I built this in a day with a deliberate scope cut documented in CLAUDE.md. The thing I'd most want a second day on is X" (pick one credible item from section 6's "What would you do with two more weeks").

---

## 10. The shape of your strongest move

If the conversation drifts, steer back to **one of these three**:

1. **The product thesis** — alignment as a control surface, not metadata.
2. **The reconciliation hero screen** — execution honesty made into a UI.
3. **The manager exception queue** — operating mechanism, not BI dashboard.

If they ask "what's the most interesting decision in this codebase?":
> "Probably the lock-time snapshot of the breadcrumb path onto each commit. It's the smallest possible change that protects historical reporting from RCDO restructures, and it landed naturally because the state machine has a defined LOCKED transition where the snapshot side-effect lives. Three lines of code; protects years of reporting."

That's the line. Use it.

---

**Good luck. You built a real thing — go defend it.**
