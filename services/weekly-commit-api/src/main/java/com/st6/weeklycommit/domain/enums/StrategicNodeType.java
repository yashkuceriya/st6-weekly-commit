package com.st6.weeklycommit.domain.enums;

/**
 * RCDO hierarchy level. The discriminator on {@code strategic_node.type}.
 * RALLY_CRY is always the root (parent_id IS NULL); SUPPORTING_OUTCOME is
 * the only level a {@link com.st6.weeklycommit.domain.WeeklyCommit} may
 * reference.
 */
public enum StrategicNodeType {
  RALLY_CRY,
  DEFINING_OBJECTIVE,
  OUTCOME,
  SUPPORTING_OUTCOME
}
