package com.st6.weeklycommit;

import java.util.concurrent.atomic.AtomicBoolean;
import org.flywaydb.core.Flyway;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.TestContext;
import org.springframework.test.context.TestExecutionListener;
import org.springframework.test.context.support.AbstractTestExecutionListener;

/**
 * Cleans + re-migrates the test database once per JVM session (not per class).
 * Class-scoped clean races with JPA write-behind and Postgres deferred
 * constraints; a single cold-start is deterministic and fast enough here.
 * Per-method rollback is provided by {@code @Transactional} on test classes.
 */
public class TestDatabaseLifecycleListener extends AbstractTestExecutionListener
    implements TestExecutionListener {

  private static final AtomicBoolean DONE = new AtomicBoolean(false);

  @Override
  public void beforeTestClass(TestContext testContext) {
    if (!DONE.compareAndSet(false, true)) return;
    ApplicationContext ctx = testContext.getApplicationContext();
    if (!ctx.containsBean("flyway")) return;
    Flyway flyway = ctx.getBean(Flyway.class);
    flyway.clean();
    flyway.migrate();
  }
}
