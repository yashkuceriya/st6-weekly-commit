package com.st6.weeklycommit.service;

import java.util.List;

/**
 * Thrown when a state-machine transition would violate a guard. Carries
 * field-level errors so the API can surface them per commit (the FE renders
 * "missing supporting outcome on commit X" instead of a generic toast).
 */
public class PlanValidationException extends RuntimeException {

  public record FieldError(String commitId, String field, String message) {}

  private final List<FieldError> errors;

  public PlanValidationException(String message, List<FieldError> errors) {
    super(message);
    this.errors = List.copyOf(errors);
  }

  public List<FieldError> getErrors() {
    return errors;
  }
}
