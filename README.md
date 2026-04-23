# Weekly Commit Module

A production-shaped micro-frontend that replaces 15Five for ~175+ employees.
Every weekly commit is hard-linked to the **Rally Cry → Defining Objective →
Outcome → Supporting Outcome** hierarchy. The system runs the full weekly
lifecycle (DRAFT → LOCKED → RECONCILING → RECONCILED with Carry Forward as a
deliberate action) and gives managers an _exception queue_ rather than a
passive dashboard.

> Read [`CLAUDE.md`](./CLAUDE.md) before reading code — it's the why behind the what.

---

## Stack

| Layer       | Tech                                                                                  |
| ----------- | ------------------------------------------------------------------------------------- |
| Monorepo    | Yarn workspaces + Nx 20, scoped module-boundary ESLint rule                           |
| Frontend    | React 18, Vite 5, TypeScript strict, Tailwind 3 + Flowbite React, Redux Toolkit + RTK Query |
| MF          | `@originjs/vite-plugin-federation` (host: pa-host · remote: weekly-commit-remote)     |
| Backend     | Spring Boot 3.3, Java 21, Gradle Kotlin DSL, Spring State Machine 4, Spring Data JPA  |
| Persistence | PostgreSQL 16.4, Flyway 10 (with explicit `flyway-database-postgresql` module)        |
| Auth        | Auth0 OAuth2 JWT (resource server) — dev profile bypasses with permissive filter     |
| Integration | Microsoft Graph (`Mail.Send`) for manager digest emails                               |
| Async       | Outbox table + scheduled poller; SNS/SQS swap documented for prod                     |
| Testing     | Vitest (unit FE), JUnit 5 + Testcontainers (BE), Cypress 13 + Cucumber/Gherkin (E2E) |
| Quality     | TS strict, ESLint 9, Prettier 3.3, Spotless (google-java-format), SpotBugs, JaCoCo 80% |
| Observ.     | Spring Actuator + Micrometer + Prometheus endpoint                                    |

---

## Quickstart

```bash
# 1. Prerequisites
#    - Node 20.11+ and Yarn 1.22+
#    - Java 21 (sdkman: sdk install java 21.0.5-tem)
#    - Docker (for Postgres, LocalStack, MailHog)
#    - System gradle (one-time only, to generate the wrapper jar — brew install gradle)

# 2. Install JS dependencies
yarn install

# 3. Bring up local infra
yarn infra:up                    # Postgres :5432, LocalStack :4566, MailHog :8025

# 4. Start the API
yarn dev:api                     # Spring Boot on :8080

# 5. Start the frontend (host + remote together)
yarn dev                         # host on :4200, remote on :4201

# 6. Visit
open http://localhost:4200
```

The `dev` profile bypasses Auth0. Set `X-Dev-User: <email>` in your browser
DevTools or via a request interceptor to act as a different seeded user.

### Useful commands

```bash
yarn build           # all workspaces
yarn test            # all unit tests
yarn test:api        # backend tests + JaCoCo coverage gate (80%)
yarn lint            # ESLint
yarn format          # Prettier
yarn typecheck       # tsc per workspace
yarn e2e             # Cypress + Cucumber (requires dev stack running)
yarn ci              # full local CI emulation
```

---

## Demo script (5 minutes)

The "demo moment" the design optimised for:

1. **IC plans a week** — Visit `/weekly-commit/me`, add 3 commits. One has no
   strategic outcome linked. Lock button is _disabled_ with a field-level
   error: "Commit 'Refresh design system' is missing a Supporting Outcome."
2. **IC fixes and locks** — Add the missing link via the breadcrumb tree
   picker. Lock succeeds. Page now shows "Locked at 14:22 · Tue".
3. **IC reconciles** — Friday mode. `/weekly-commit/me/reconcile` shows side
   by side: planned, status (Delivered/Partial/Missed), actual, delta reason,
   carry decision. Mark one Missed → Carry Forward. Submit.
4. **Carry-forward escalation** — Two weeks later, the same logical commit is
   still being carried. The reconciliation form requires longer rationale,
   shows a warning. Third generation requires manager acknowledgement.
5. **Manager opens the queue** — `/weekly-commit/team`. Top of page: rollup
   bar with alignment %, lock rate, review SLA, carry-forward rate. Below:
   exception cards. The repeated-carry-forward card is highlighted; manager
   acknowledges + nudges, all in one click.

---

## Project structure

```
.
├── apps/
│   ├── pa-host/                  React shell, Auth0, store, MF host
│   └── weekly-commit-remote/     React remote, exposes ./WeeklyCommitApp
├── libs/
│   ├── shared-types/             TS DTOs/enums (scope:shared-contracts)
│   ├── shared-ui/                Flowbite + Claude design tokens (scope:shared-ui)
│   └── api-client/               RTK Query slice (scope:api-client)
├── services/
│   └── weekly-commit-api/        Spring Boot 3.3 + Java 21 + Gradle Kotlin DSL
├── e2e/                          Cypress 13 + Cucumber/Gherkin
├── infra/                        docker-compose (Postgres + LocalStack + MailHog)
├── CLAUDE.md                     architectural narrative + decision log
└── README.md
```

---

## Production deployment notes (not in this take-home, but documented)

- **Remote bundles** → S3 (regular bucket, not website endpoint) + CloudFront
  with **Origin Access Control (OAC)**, not the deprecated OAI. HTML/manifest
  served `Cache-Control: no-cache`; chunk files content-hashed and long-cache.
- **API** → containerised, deployed on EKS (multi-AZ), autoscaled by Karpenter.
- **Outbox publisher** → swap the in-process listener for an SQS-driven
  consumer reading from a topic fed by an SNS publisher; preserves at-least-
  once delivery without coupling business transactions to the queue.
- **Outlook integration** → enable `app.outlook.enabled=true`, provide
  Azure AD app credentials. App-only `Mail.Send` scope is sufficient for the
  digest flow.
- **Observability** → scrape `/api/actuator/prometheus`. Custom metrics:
  `plan_locked_total`, `reconciliation_completed_total`, `manager_review_overdue`,
  `lock_to_review_seconds`.

---

## License

Internal — UNLICENSED.
