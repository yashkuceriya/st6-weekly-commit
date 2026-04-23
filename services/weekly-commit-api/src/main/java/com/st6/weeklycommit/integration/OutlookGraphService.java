package com.st6.weeklycommit.integration;

import com.st6.weeklycommit.domain.WeeklyCommit;
import com.st6.weeklycommit.domain.WeeklyPlan;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Microsoft Graph integration façade.
 *
 * <p>v1 scope is intentionally narrow: app-only {@code Mail.Send} for the
 * manager digest. Calendar awareness ({@code Calendars.Read}) and To Do export
 * ({@code Tasks.ReadWrite}) are stubbed but not implemented — see CLAUDE.md
 * for the next-phase plan.
 *
 * <p>Behind {@code st6.outlook.enabled}: when disabled, every method is a
 * structured no-op + log line so prod-disabled and dev-stub behave identically
 * to integration tests.
 */
@Service
public class OutlookGraphService {

  private static final Logger log = LoggerFactory.getLogger(OutlookGraphService.class);

  private final OutlookProperties props;

  public OutlookGraphService(OutlookProperties props) {
    this.props = props;
  }

  /**
   * Email a digest to the manager of the given plan owner. Triggered by the
   * outbox poller on PLAN_LOCKED events; debounced upstream so a manager
   * receives one digest per Mon morning even if N reports lock back-to-back.
   */
  public void sendManagerDigest(WeeklyPlan plan) {
    var manager = plan.getUser().getManager();
    if (manager == null) {
      log.debug("No manager set for {}, skipping digest.", plan.getUser().getEmail());
      return;
    }

    var subject = subject(plan);
    var body = renderBody(plan);

    if (!props.enabled()) {
      log.info(
          "[outlook stub] digest → {} | subject: {} | preview: {}",
          manager.getEmail(),
          subject,
          body.substring(0, Math.min(120, body.length())));
      return;
    }

    // Real path: build a GraphServiceClient with ClientSecretCredential
    // and POST to /users/{senderUpn}/sendMail. Wired but commented out so
    // the take-home build doesn't require live Azure credentials.
    //
    // var credential = new ClientSecretCredentialBuilder()
    //     .tenantId(props.tenantId())
    //     .clientId(props.clientId())
    //     .clientSecret(props.clientSecret())
    //     .build();
    // var graph = new GraphServiceClient(credential, "https://graph.microsoft.com/.default");
    // graph.users().byUserId(props.senderUpn()).sendMail().post(payload);
    log.info(
        "[outlook] would send digest → {} | subject: {} (real send disabled in this build)",
        manager.getEmail(),
        subject);
  }

  /**
   * Stubbed Calendar integration. The interface exists so tests + the FE can
   * reason about the surface, but the implementation lives behind the same
   * feature flag and currently logs.
   */
  public void createFocusBlock(WeeklyCommit commit) {
    if (!props.enabled()) {
      log.debug("[outlook stub] would create focus block for commit {}", commit.getId());
      return;
    }
    log.info("[outlook] focus block creation not implemented — see CLAUDE.md.");
  }

  private static String subject(WeeklyPlan plan) {
    return "Weekly digest — " + plan.getUser().getDisplayName() + " · week of " + plan.getWeekStartDate();
  }

  private static String renderBody(WeeklyPlan plan) {
    var sb = new StringBuilder();
    sb.append(plan.getUser().getDisplayName())
        .append(" locked their plan for the week of ")
        .append(plan.getWeekStartDate())
        .append(".\n\n");
    sb.append("Commits:\n");
    for (var c : plan.activeCommits()) {
      sb.append("  • [P")
          .append(c.getPriorityRank())
          .append("] ")
          .append(c.getTitle());
      if (c.getLockedOutcomePath() != null) {
        sb.append("  (").append(c.getLockedOutcomePath()).append(")");
      }
      sb.append('\n');
    }
    sb.append("\nReview by Friday EOD per the operating cadence.\n");
    return sb.toString();
  }
}
