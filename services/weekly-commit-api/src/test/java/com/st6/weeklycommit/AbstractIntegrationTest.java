package com.st6.weeklycommit;

import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestExecutionListeners;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.context.support.DependencyInjectionTestExecutionListener;
import org.springframework.test.context.support.DirtiesContextTestExecutionListener;
import org.springframework.test.context.transaction.TransactionalTestExecutionListener;

/**
 * Shared base for integration tests.
 *
 * <p>Connects to the running {@code infra/docker-compose.yml} Postgres at
 * {@code localhost:5433/weekly_commit_test}. We deliberately avoided
 * Testcontainers' {@code @Container} runtime in this take-home — Docker
 * Desktop's evolving info-API behaviour kept blocking auto-discovery on newer
 * Docker daemons (29+ returns 400 stubs to older docker-java clients).
 *
 * <p>Setup runbook is in VERIFY.md: {@code yarn infra:up} brings the stack
 * up, including a {@code weekly_commit_test} database created by
 * {@code infra/postgres-test-init.sql}.
 *
 * <p>Each test class gets a fresh schema via Flyway clean+migrate (via
 * {@link TestDatabaseLifecycleListener}) so order-dependent state from prior
 * tests doesn't leak.
 */
@ExtendWith(SpringExtension.class)
@SpringBootTest
@ActiveProfiles("test")
@TestExecutionListeners(
    value = {
      TestDatabaseLifecycleListener.class,
      DependencyInjectionTestExecutionListener.class,
      DirtiesContextTestExecutionListener.class,
      TransactionalTestExecutionListener.class
    },
    mergeMode = TestExecutionListeners.MergeMode.REPLACE_DEFAULTS)
public abstract class AbstractIntegrationTest {}
