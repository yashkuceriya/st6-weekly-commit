# VERIFY.md — How to actually run this

This is the runbook your evaluator (or you, the night before) follows to confirm
every layer works. **None of this has been executed inside the Claude session
that built it** — yarn / gradle / docker aren't installed in that sandbox. You
have to run it. Each step has the exact command, what to expect, and what to do
if it fails.

> Read [CLAUDE.md](./CLAUDE.md) for the *why*, [README.md](./README.md) for the
> *what*, [DEMO.md](./DEMO.md) for the demo script, and
> [INTERVIEW_PREP.md](./INTERVIEW_PREP.md) for the talking points.

---

## 0. Prereqs

```bash
java -version         # need 21+ (you have 25 LTS — fine, gradle toolchain pins to 21)
node -v               # need ≥ 20.11 (you have 25 — fine)
yarn -v               # if missing: npm install -g yarn   OR   corepack enable && corepack prepare yarn@1.22.22 --activate
gradle -v             # if missing: brew install gradle   (only needed once, to bootstrap the wrapper jar)
docker info           # must be running — open Docker.app first
```

If `yarn` or `gradle` install commands fail, fall back to:
```bash
npm install --location=global yarn@1.22.22
brew install --quiet gradle
```

---

## 1. First-time install + wrapper bootstrap

```bash
cd /Users/yash/ST6
yarn install                                          # ~2–3 min, expect ~1500 packages
cd services/weekly-commit-api
gradle wrapper --gradle-version 8.10.2 --distribution-type bin   # ~30s, generates gradle-wrapper.jar
./gradlew --version                                   # confirms wrapper bootstrapped
cd ../..
```

**If yarn install fails:** read the error. Likely culprits:
- Peer-dep mismatch on `flowbite-react` against React 18.3 → safe to add `--ignore-engines`
- `@nx/eslint-plugin` typing version drift → bump to `latest` in root `package.json` and rerun
- Node 25 too new for some lifecycle scripts → `nvm install 20.11.0 && nvm use 20.11.0`

---

## 2. Bring up infrastructure

```bash
yarn infra:up
docker compose -f infra/docker-compose.yml ps         # all 3 services should be "Up"
docker compose -f infra/docker-compose.yml logs postgres | tail -10
```

Expect: postgres ready, localstack health OK, mailhog UI at `http://localhost:8025`.

**If postgres won't start:** port 5432 already in use. `lsof -i :5432` → kill the conflicting process or change the port in `infra/docker-compose.yml`.

---

## 3. Backend — compile, migrate, test

```bash
cd services/weekly-commit-api
./gradlew clean compileJava                           # ~30s first time, downloads deps
./gradlew test                                        # ~3–5 min, runs all unit + integration tests
./gradlew jacocoTestReport jacocoTestCoverageVerification    # 80% gate
./gradlew bootRun --args='--spring.profiles.active=dev'      # starts on :8080
```

In another terminal:
```bash
curl http://localhost:8080/api/health
# → {"status":"OK","service":"weekly-commit-api","timestamp":"..."}

curl http://localhost:8080/api/strategic-nodes/tree | head -100
# → JSON tree with Rally Cry root and nested DOs/Os/SOs

curl http://localhost:8080/api/chess-layers
# → 4 entries: Offense, Defense, Maintenance, Discovery

curl http://localhost:8080/api/plans/me/current
# → DRAFT plan auto-created for dev-ic@st6.local
```

**Expected test output:**
- `SmokeTest` — 2 passed
- `PlanGuardsTest` — 11 passed (lock + reconcile guards)
- `PlanLifecycleServiceTest` — 6 passed (full happy path + carry-forward)
- `StrategicPathResolverTest` — 2 passed (recursive CTE)
- `WebLayerIntegrationTest` — 11 passed (every controller via MockMvc)
- `SeedDataGoldenTest` — 6 passed (seed shape contract)
- `StateMachineInvariantsTest` — 7 passed (state never regresses, version monotonic, snapshot present iff state ≥ LOCKED, carry generation = source+1, etc.)
- `SchemaCatalogTest` — 8 passed (tables, enums, indexes match expected catalog)

**Total: 53 backend tests.** JaCoCo gate is on `domain.*` and `service.*` packages — should land 80%+.

**If any test fails:** the failure message tells you what diverged. Most common:
- Testcontainers can't pull `postgres:16.4-alpine` → check Docker is running, has internet
- Hibernate `NAMED_ENUM` mapping fails → confirm Boot 3.3.5 is on the classpath (`./gradlew dependencies | grep boot`)
- Flyway "no module for postgresql" → confirm `flyway-database-postgresql` is in `build.gradle.kts` (it is)

---

## 4. Frontend — typecheck, test, build

```bash
yarn typecheck         # 4 workspaces; should pass clean with strict mode
yarn lint              # ESLint flat config, includes Nx boundary rule
yarn test              # Vitest across libs/shared-ui + apps/weekly-commit-remote
yarn build             # full production build of host + remote
```

**Expected test output (Vitest):**
- `libs/shared-ui/src/components/__tests__/Breadcrumb.test.tsx` — 4 tests
- `libs/shared-ui/src/components/__tests__/Sparkline.test.tsx` — 5 tests
- `libs/shared-ui/src/components/__tests__/StatusBadge.test.tsx` — 8 tests
- `apps/weekly-commit-remote/src/lib/lock-validation.test.ts` — 6 tests
- `apps/weekly-commit-remote/src/lib/reconciliation.test.ts` — 7 tests

**Total: 30 frontend tests.**

**If typecheck barks at `noUncheckedIndexedAccess`:** that's the strict mode catching genuine optional indexes. Search for the line, add a `?` or a guard.

**If build fails on Vite Module Federation:** likely the host can't resolve the remote in build mode (it tries the runtime URL). Run `cd apps/weekly-commit-remote && yarn build` first, then host build.

---

## 5. Run it end-to-end

```bash
# Terminal 1 — API
cd services/weekly-commit-api && ./gradlew bootRun --args='--spring.profiles.active=dev'

# Terminal 2 — Remote (must be built+previewed for Module Federation)
yarn dev:remote        # OR: yarn workspace weekly-commit-remote serve

# Terminal 3 — Host
yarn dev:host

# Browser
open http://localhost:4200
```

**Expected:**
1. Host loads on :4200, top nav with "PA" branding
2. Auto-redirects to `/weekly-commit/me`
3. Remote bundle is fetched from :4201 — should appear within ~500ms
4. Empty state: "Plan your week" + "Add your first commit" button
5. Activity feed sidebar on the right showing "No activity yet."

**Demo script** is in `DEMO.md` — walk it once before the real demo.

---

## 6. The eval / golden-set layer

This is what the brief calls "all those things covered". Three tests treat the
system as a contract:

| Test | What it asserts | If it fails |
|---|---|---|
| `SeedDataGoldenTest` | V9 seed has exactly: 2 teams, 16 users, 4 chess categories, 1 RC, 4 DOs, 12 Os, 30 SOs | Seed was modified → bump `golden/seed-snapshot.json` deliberately |
| `StateMachineInvariantsTest` | State never regresses; version monotonically increases; snapshot present iff state ≥ LOCKED; carry generation = source+1; lock guard always reports ≥ 1 field error per broken commit | A real bug in PlanLifecycleService or its guards |
| `SchemaCatalogTest` | All expected tables, columns, indexes, enum types exist with expected shape — straight from the JDBC catalog | A migration accidentally dropped/renamed something load-bearing |

These run as part of `./gradlew test`. They're separate from the unit/integration tests on purpose — when one of these fails, you know it's a *contract* break, not just an implementation bug.

The frontend equivalent is the snapshot tests on `Breadcrumb`, `StatusBadge`, `Sparkline` — accidental visual regressions show up as a snapshot diff.

---

## 7. Production smoke

```bash
yarn ci    # runs: format:check + lint + typecheck + frontend tests + backend tests + build
```

If `yarn ci` exits clean, the whole stack is green. That's what you want before submission.

---

## 8. Common breakages & fixes

| Symptom | Fix |
|---|---|
| `Cannot find module 'weekly_commit/WeeklyCommitApp'` in host build | Build the remote first: `cd apps/weekly-commit-remote && yarn build`. Host build expects the remoteEntry to exist if it's resolving statically. |
| Spring Boot startup error: `relation "team" does not exist` | Flyway didn't run or db is empty. Check `spring.flyway.enabled=true` (it is). `docker compose -f infra/docker-compose.yml down -v && yarn infra:up` to reset. |
| `@JdbcTypeCode(NAMED_ENUM)` mapping error | Hibernate version mismatch. `./gradlew dependencies --configuration runtimeClasspath \| grep hibernate` — should be 6.5.x. Boot 3.3.5 ships it. |
| FE 401 on `/api/plans/me/current` | Dev profile not active OR `X-Dev-User` header wrong. Confirm `application-dev.yml` is loaded; default user is `dev-ic@st6.local`. |
| Drag-to-reorder fires N requests | Expected at this scale. Future: single `/plans/{id}/reorder` endpoint. Documented in INTERVIEW_PREP.md §6 "What's risky in the codebase". |
| `vite:preloadError` in console | Stale chunk after redeploy — handler in `apps/pa-host/src/stale-chunk.ts` reloads automatically. |

---

## 9. Submission checklist

- [ ] `yarn ci` passes clean
- [ ] `yarn dev` brings up host + remote + API together
- [ ] Demo script in DEMO.md walks end-to-end without manual data setup
- [ ] CLAUDE.md, README.md, DEMO.md, INTERVIEW_PREP.md, VERIFY.md all present and current
- [ ] `git log --oneline` shows reasonable commit history (or one initial commit if you went that route)
- [ ] No `.env` with real secrets in the bundle
- [ ] Memory directory at `~/.claude/projects/-Users-yash-ST6/memory/` documents the build state for future-you
