package com.st6.weeklycommit.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.st6.weeklycommit.AbstractIntegrationTest;
import com.st6.weeklycommit.domain.enums.StrategicNodeType;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class StrategicPathResolverTest extends AbstractIntegrationTest {

  @Autowired StrategicPathResolver resolver;

  /** A seeded Supporting Outcome — see V9__seed.sql. */
  private static final UUID SO_OUTBOUND_FINTECH = UUID.fromString("00000000-0000-0000-0000-000000004001");

  @Test
  void resolvesFullPathFromSupportingOutcomeToRallyCry() {
    var path = resolver.resolve(SO_OUTBOUND_FINTECH);
    assertThat(path.segments()).hasSize(4);
    assertThat(path.segments().get(0).type()).isEqualTo(StrategicNodeType.RALLY_CRY);
    assertThat(path.segments().get(3).type()).isEqualTo(StrategicNodeType.SUPPORTING_OUTCOME);
    assertThat(path.breadcrumb())
        .startsWith("Win Q2 in mid-market")
        .endsWith("Build outbound campaign for fintech vertical");
  }

  @Test
  void breadcrumbHasArrowSeparators() {
    var path = resolver.resolve(SO_OUTBOUND_FINTECH);
    assertThat(path.breadcrumb()).contains(" › ");
    assertThat(path.titlesById()).hasSize(4);
  }
}
