package com.st6.weeklycommit.eval;

import static org.assertj.core.api.Assertions.assertThat;

import com.st6.weeklycommit.AbstractIntegrationTest;
import java.sql.Connection;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import javax.sql.DataSource;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * Eval — schema-catalog snapshot. Applies all migrations (Flyway runs at
 * boot via the parent class) and then asserts that key tables / columns /
 * indexes / enum types exist with the expected shape. Catches accidental
 * migration breakage where a new V## drops or renames something load-bearing.
 *
 * <p>Reads the JDBC catalog directly, no JPA — so it tests the actual
 * persisted schema, not the Hibernate mapping.
 */
@DisplayName("Eval — Schema catalog snapshot")
class SchemaCatalogTest extends AbstractIntegrationTest {

  @Autowired DataSource dataSource;

  @Test
  void allExpectedTablesExist() throws Exception {
    var actualTables = listTables();
    assertThat(actualTables)
        .contains(
            "team",
            "app_user",
            "strategic_node",
            "chess_layer_category",
            "weekly_plan",
            "weekly_commit",
            "commit_reconciliation",
            "manager_review",
            "commit_event",
            "outbox_event",
            "user_role");
  }

  @Test
  void weeklyCommitTableHasLockSnapshotColumns() throws Exception {
    var cols = listColumns("weekly_commit");
    assertThat(cols).contains("locked_outcome_path", "locked_outcome_titles");
    assertThat(cols).contains("source_commit_id", "carry_generation", "requires_manager_ack");
    assertThat(cols).contains("version"); // optimistic locking
  }

  @Test
  void weeklyPlanTableHasOptimisticLockingAndStateTimestamps() throws Exception {
    var cols = listColumns("weekly_plan");
    assertThat(cols).contains("version");
    assertThat(cols)
        .contains(
            "drafted_at",
            "first_edit_at",
            "locked_at",
            "reconciliation_started_at",
            "reconciled_at");
    assertThat(cols).contains("deleted_at"); // soft delete
  }

  @Test
  void enumTypesExist() throws Exception {
    var types = listEnumTypes();
    assertThat(types)
        .contains(
            "strategic_node_type",
            "plan_state",
            "commit_status",
            "carry_decision",
            "review_status",
            "app_role");
  }

  @Test
  void planStateEnumHasFourValues() throws Exception {
    var values = listEnumValues("plan_state");
    assertThat(values).containsExactlyInAnyOrder("DRAFT", "LOCKED", "RECONCILING", "RECONCILED");
  }

  @Test
  void carryDecisionEnumHasThreeValues() throws Exception {
    var values = listEnumValues("carry_decision");
    assertThat(values).containsExactlyInAnyOrder("DROP", "FINISHED_NEXT_WEEK", "CARRY_FORWARD");
  }

  @Test
  void uniqueIndexEnforcesOnePlanPerUserPerWeek() throws Exception {
    var indexes = listIndexes("weekly_plan");
    assertThat(indexes).contains("idx_weekly_plan_user_week_active");
  }

  @Test
  void performanceIndexesFromV10Exist() throws Exception {
    var planIdx = listIndexes("weekly_plan");
    assertThat(planIdx).contains("idx_weekly_plan_team_week_state");

    var commitIdx = listIndexes("weekly_commit");
    assertThat(commitIdx).contains("idx_weekly_commit_carry_chain");
  }

  // ────────────────────────────────────────────────────────────────────────
  // Catalog probes
  // ────────────────────────────────────────────────────────────────────────

  private List<String> listTables() throws Exception {
    try (Connection conn = dataSource.getConnection();
        var rs = conn.getMetaData().getTables(null, "public", "%", new String[] {"TABLE"})) {
      var out = new ArrayList<String>();
      while (rs.next()) out.add(rs.getString("TABLE_NAME"));
      return out;
    }
  }

  private Set<String> listColumns(String table) throws Exception {
    try (Connection conn = dataSource.getConnection();
        var rs = conn.getMetaData().getColumns(null, "public", table, "%")) {
      var out = new HashSet<String>();
      while (rs.next()) out.add(rs.getString("COLUMN_NAME"));
      return out;
    }
  }

  private Set<String> listIndexes(String table) throws Exception {
    try (Connection conn = dataSource.getConnection();
        var rs = conn.getMetaData().getIndexInfo(null, "public", table, false, false)) {
      var out = new HashSet<String>();
      while (rs.next()) {
        var name = rs.getString("INDEX_NAME");
        if (name != null) out.add(name);
      }
      return out;
    }
  }

  private List<String> listEnumTypes() throws Exception {
    try (Connection conn = dataSource.getConnection();
        var stmt = conn.createStatement();
        var rs =
            stmt.executeQuery(
                "SELECT typname FROM pg_type WHERE typtype = 'e' ORDER BY typname")) {
      var out = new ArrayList<String>();
      while (rs.next()) out.add(rs.getString(1));
      return out;
    }
  }

  private List<String> listEnumValues(String enumName) throws Exception {
    try (Connection conn = dataSource.getConnection();
        var stmt = conn.prepareStatement(
            "SELECT e.enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = ?")) {
      stmt.setString(1, enumName);
      try (var rs = stmt.executeQuery()) {
        var out = new ArrayList<String>();
        while (rs.next()) out.add(rs.getString(1));
        return out;
      }
    }
  }
}
