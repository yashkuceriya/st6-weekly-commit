package com.st6.weeklycommit.eval;

import static org.assertj.core.api.Assertions.assertThat;

import com.st6.weeklycommit.AbstractIntegrationTest;
import com.st6.weeklycommit.domain.enums.StrategicNodeType;
import com.st6.weeklycommit.repository.AppUserRepository;
import com.st6.weeklycommit.repository.ChessLayerCategoryRepository;
import com.st6.weeklycommit.repository.StrategicNodeRepository;
import com.st6.weeklycommit.repository.TeamRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * Golden contract over the seed data shape (V9__seed.sql).
 *
 * <p>If these counts change, the seed was modified — bump
 * {@code src/test/resources/golden/seed-snapshot.json} deliberately so the
 * diff lands in code review.
 *
 * <p>This is one of the "evals" the brief asks for: deterministic, no
 * stochasticity, easy to read, fails loudly on accidental drift.
 */
@DisplayName("Eval — Seed data golden snapshot")
class SeedDataGoldenTest extends AbstractIntegrationTest {

  @Autowired TeamRepository teams;
  @Autowired AppUserRepository users;
  @Autowired ChessLayerCategoryRepository chessLayers;
  @Autowired StrategicNodeRepository nodes;

  @Test
  void teamCountMatchesGolden() {
    assertThat(teams.count()).isEqualTo(2);
  }

  @Test
  void userBreakdownMatchesGolden() {
    var allUsers = users.findAll();
    assertThat(allUsers).hasSize(16);

    long admins = allUsers.stream().filter(u -> u.isAdmin()).count();
    long managers = allUsers.stream().filter(u -> u.isManager()).count();
    long ics = allUsers.stream().filter(u -> !u.isAdmin() && !u.isManager()).count();

    assertThat(admins).isEqualTo(1);
    assertThat(managers).isEqualTo(3);
    assertThat(ics).isEqualTo(12);
  }

  @Test
  void chessLayerCatalogMatchesGolden() {
    var cats = chessLayers.findByActiveTrueOrderByDisplayOrderAscNameAsc();
    assertThat(cats).hasSize(4);
    assertThat(cats).extracting("name")
        .containsExactly("Offense", "Defense", "Maintenance", "Discovery");
    assertThat(cats.stream().filter(c -> c.isDefault()).count()).isEqualTo(1);
    assertThat(cats.get(0).getName()).isEqualTo("Offense"); // default by display order
  }

  @Test
  void rcdoHierarchyShapeMatchesGolden() {
    long rcs = nodes.findByTypeAndActiveTrueOrderByDisplayOrderAsc(StrategicNodeType.RALLY_CRY).size();
    long dos = nodes.findByTypeAndActiveTrueOrderByDisplayOrderAsc(StrategicNodeType.DEFINING_OBJECTIVE).size();
    long os = nodes.findByTypeAndActiveTrueOrderByDisplayOrderAsc(StrategicNodeType.OUTCOME).size();
    long sos = nodes.findByTypeAndActiveTrueOrderByDisplayOrderAsc(StrategicNodeType.SUPPORTING_OUTCOME).size();

    assertThat(rcs).as("Rally Cries").isEqualTo(1);
    assertThat(dos).as("Defining Objectives").isEqualTo(4);
    assertThat(os).as("Outcomes").isEqualTo(12);
    assertThat(sos).as("Supporting Outcomes").isEqualTo(30);
    assertThat(rcs + dos + os + sos).isEqualTo(47);
  }

  @Test
  void everyDefiningObjectiveHasAtLeastTwoOutcomesUnderIt() {
    var dos = nodes.findByTypeAndActiveTrueOrderByDisplayOrderAsc(StrategicNodeType.DEFINING_OBJECTIVE);
    var allOs = nodes.findByTypeAndActiveTrueOrderByDisplayOrderAsc(StrategicNodeType.OUTCOME);
    for (var d : dos) {
      long childCount = allOs.stream().filter(o -> o.getParent() != null && o.getParent().getId().equals(d.getId())).count();
      assertThat(childCount).as("Outcomes under DO " + d.getTitle()).isGreaterThanOrEqualTo(2);
    }
  }

  @Test
  void everyOutcomeHasAtLeastOneSupportingOutcomeUnderIt() {
    var os = nodes.findByTypeAndActiveTrueOrderByDisplayOrderAsc(StrategicNodeType.OUTCOME);
    var sos = nodes.findByTypeAndActiveTrueOrderByDisplayOrderAsc(StrategicNodeType.SUPPORTING_OUTCOME);
    for (var o : os) {
      long childCount = sos.stream().filter(s -> s.getParent() != null && s.getParent().getId().equals(o.getId())).count();
      assertThat(childCount).as("Supporting Outcomes under O " + o.getTitle()).isGreaterThanOrEqualTo(1);
    }
  }
}
