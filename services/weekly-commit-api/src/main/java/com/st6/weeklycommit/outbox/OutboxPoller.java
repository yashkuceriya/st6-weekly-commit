package com.st6.weeklycommit.outbox;

import com.st6.weeklycommit.domain.OutboxEvent;
import com.st6.weeklycommit.repository.OutboxEventRepository;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Polls the {@code outbox_event} table and dispatches unpublished events to
 * registered listeners.
 *
 * <p>For the take-home, "dispatch" means re-publishing through Spring's
 * {@link ApplicationEventPublisher} so in-process listeners (the Outlook
 * digest, metrics counters, etc.) receive a typed envelope. For prod, this
 * same poller would publish to SNS instead — no change required to writers.
 */
@Component
public class OutboxPoller {

  private static final Logger log = LoggerFactory.getLogger(OutboxPoller.class);
  private static final int BATCH_SIZE = 100;

  private final OutboxEventRepository outbox;
  private final ApplicationEventPublisher publisher;

  public OutboxPoller(OutboxEventRepository outbox, ApplicationEventPublisher publisher) {
    this.outbox = outbox;
    this.publisher = publisher;
  }

  @Scheduled(fixedDelayString = "${st6.outbox.poll-interval:5000}")
  @Transactional
  public void poll() {
    var batch = outbox.findUnpublished(PageRequest.of(0, BATCH_SIZE));
    if (batch.isEmpty()) return;
    for (var event : batch) {
      try {
        dispatch(event);
        event.setPublishedAt(Instant.now());
      } catch (RuntimeException ex) {
        event.setAttempts(event.getAttempts() + 1);
        event.setLastError(truncate(ex.getMessage()));
        log.warn("Outbox dispatch failed for {} ({}): {}", event.getId(), event.getEventType(), ex.toString());
      }
    }
  }

  private void dispatch(OutboxEvent event) {
    publisher.publishEvent(new OutboxDispatched(event.getEventType(), event.getAggregateId(), event.getPayload()));
  }

  private static String truncate(String s) {
    if (s == null) return null;
    return s.length() > 1000 ? s.substring(0, 1000) : s;
  }

  /** Re-published shape so listeners see the outbox row, not the raw entity. */
  public record OutboxDispatched(String eventType, java.util.UUID aggregateId, java.util.Map<String, Object> payload) {}
}
