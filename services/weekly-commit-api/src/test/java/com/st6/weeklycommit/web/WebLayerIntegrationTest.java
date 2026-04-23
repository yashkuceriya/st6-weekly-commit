package com.st6.weeklycommit.web;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.st6.weeklycommit.AbstractIntegrationTest;
import com.st6.weeklycommit.repository.AppUserRepository;
import com.st6.weeklycommit.service.CommitService;
import com.st6.weeklycommit.service.CommitService.AddCommitInput;
import com.st6.weeklycommit.service.PlanLifecycleService;
import com.st6.weeklycommit.web.dto.Requests;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

@AutoConfigureMockMvc
class WebLayerIntegrationTest extends AbstractIntegrationTest {

  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;
  @Autowired AppUserRepository users;
  @Autowired PlanLifecycleService lifecycle;
  @Autowired CommitService commits;

  private static final UUID DEV_IC = UUID.fromString("00000000-0000-0000-0000-0000000000ff");
  private static final UUID OUTCOME_1 = UUID.fromString("00000000-0000-0000-0000-000000004001");
  private static final UUID CHESS_OFFENSE = UUID.fromString("00000000-0000-0000-0000-000000000301");

  @Test
  void healthEndpointReturnsOk() throws Exception {
    mvc.perform(get("/health"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("OK"));
  }

  @Test
  void strategicTreeReturnsRallyCryRoot() throws Exception {
    mvc.perform(get("/strategic-nodes/tree"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].type").value("RALLY_CRY"))
        .andExpect(jsonPath("$[0].children", hasSize(greaterThan(0))));
  }

  @Test
  void chessLayersIncludeSeededCategories() throws Exception {
    mvc.perform(get("/chess-layers"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[*].name", hasItem("Offense")))
        .andExpect(jsonPath("$[*].name", hasItem("Defense")));
  }

  @Test
  void currentPlanCreatesDraftIfMissing() throws Exception {
    mvc.perform(get("/plans/me/current"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.state").value("DRAFT"))
        .andExpect(jsonPath("$.commits", hasSize(0)));
  }

  @Test
  void lockRejectsUnalignedPlanWithFieldErrors() throws Exception {
    var user = users.findById(DEV_IC).orElseThrow();
    var plan = lifecycle.createPlanForCurrentWeek(user);
    commits.add(plan.getId(),
        new AddCommitInput("Unaligned commit", null, "evidence", null, null, 1));

    mvc.perform(post("/plans/{id}/lock", plan.getId()))
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.errors[*].field", hasItems("supportingOutcome", "chessLayer")));
  }

  @Test
  void lockSucceedsForFullyAlignedPlan() throws Exception {
    var user = users.findById(DEV_IC).orElseThrow();
    var plan = lifecycle.createPlanForCurrentWeek(user);
    commits.add(plan.getId(),
        new AddCommitInput("Ship outbound", null, "first batch sent", OUTCOME_1, CHESS_OFFENSE, 1));

    mvc.perform(post("/plans/{id}/lock", plan.getId()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.state").value("LOCKED"))
        .andExpect(jsonPath("$.commits[0].lockedOutcomePath", notNullValue()));
  }

  @Test
  void invalidStateTransitionReturns409() throws Exception {
    var user = users.findById(DEV_IC).orElseThrow();
    var plan = lifecycle.createPlanForCurrentWeek(user);

    var body = json.writeValueAsString(new Requests.ReconcilePlanRequest(List.of()));
    mvc.perform(post("/plans/{id}/reconcile", plan.getId())
            .contentType("application/json")
            .content(body))
        .andExpect(status().isConflict());
  }

  @Test
  void planActivityEndpointReturnsList() throws Exception {
    var user = users.findById(DEV_IC).orElseThrow();
    var plan = lifecycle.createPlanForCurrentWeek(user);
    mvc.perform(get("/plans/{id}/activity", plan.getId()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isArray());
  }

  @Test
  void aiSuggestTitleReturnsStubbedSuggestion() throws Exception {
    mvc.perform(post("/commits/suggest-title")
            .contentType("application/json")
            .content("{\"rationale\":\"unblock review\",\"outcomeTitle\":\"Build outbound\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.title", containsString("Build outbound")))
        .andExpect(jsonPath("$.source").value("stub"));
  }

  @Test
  void teamExceptionsEndpointReturnsRollupAndPage() throws Exception {
    var teamId = "00000000-0000-0000-0000-000000000010";
    mvc.perform(get("/teams/{teamId}/exceptions", teamId)
            .param("weekStartDate", PlanLifecycleService.currentWeekStart().toString()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.rollup").exists())
        .andExpect(jsonPath("$.exceptions.content").isArray());
  }

  @Test
  void userMeReturnsRoles() throws Exception {
    mvc.perform(get("/users/me"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.email").value("dev-ic@st6.local"))
        .andExpect(jsonPath("$.roles", hasItem("IC")));
  }

  @Test
  void healthAndActuatorBothExposed() throws Exception {
    mvc.perform(get("/actuator/health")).andExpect(status().isOk());
  }
}
