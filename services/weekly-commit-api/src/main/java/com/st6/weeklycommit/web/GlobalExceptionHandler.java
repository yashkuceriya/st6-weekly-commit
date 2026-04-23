package com.st6.weeklycommit.web;

import com.st6.weeklycommit.service.IllegalStateTransitionException;
import com.st6.weeklycommit.service.PlanValidationException;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Translates domain exceptions to consistent JSON error envelopes.
 *
 * <p>The 422 response for {@link PlanValidationException} carries the
 * commit-level field errors so the FE can render "Commit X is missing
 * Supporting Outcome" instead of a generic toast.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  public record FieldErrorPayload(String commitId, String field, String message) {}

  public record ErrorResponse(
      Instant timestamp,
      int status,
      String error,
      String message,
      String path,
      List<FieldErrorPayload> errors) {}

  @ExceptionHandler(PlanValidationException.class)
  public ResponseEntity<ErrorResponse> handleValidation(
      PlanValidationException ex, HttpServletRequest request) {
    var errors =
        ex.getErrors().stream()
            .map(e -> new FieldErrorPayload(e.commitId(), e.field(), e.message()))
            .toList();
    return ResponseEntity.unprocessableEntity()
        .body(error(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage(), request, errors));
  }

  @ExceptionHandler(IllegalStateTransitionException.class)
  public ResponseEntity<ErrorResponse> handleStateTransition(
      IllegalStateTransitionException ex, HttpServletRequest request) {
    return ResponseEntity.status(HttpStatus.CONFLICT)
        .body(error(HttpStatus.CONFLICT, ex.getMessage(), request, List.of()));
  }

  @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
  public ResponseEntity<ErrorResponse> handleOptimisticLock(
      ObjectOptimisticLockingFailureException ex, HttpServletRequest request) {
    return ResponseEntity.status(HttpStatus.CONFLICT)
        .body(
            error(
                HttpStatus.CONFLICT,
                "Stale write — someone updated this concurrently. Refresh and try again.",
                request,
                List.of()));
  }

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<ErrorResponse> handleBadInput(
      IllegalArgumentException ex, HttpServletRequest request) {
    return ResponseEntity.badRequest().body(error(HttpStatus.BAD_REQUEST, ex.getMessage(), request, List.of()));
  }

  @ExceptionHandler(SecurityException.class)
  public ResponseEntity<ErrorResponse> handleSecurity(
      SecurityException ex, HttpServletRequest request) {
    return ResponseEntity.status(HttpStatus.FORBIDDEN)
        .body(error(HttpStatus.FORBIDDEN, ex.getMessage(), request, List.of()));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ErrorResponse> handleBeanValidation(
      MethodArgumentNotValidException ex, HttpServletRequest request) {
    var errors =
        ex.getBindingResult().getFieldErrors().stream()
            .map(f -> new FieldErrorPayload(null, f.getField(), f.getDefaultMessage()))
            .toList();
    return ResponseEntity.badRequest()
        .body(error(HttpStatus.BAD_REQUEST, "Validation failed.", request, errors));
  }

  @ExceptionHandler(IllegalStateException.class)
  public ResponseEntity<ErrorResponse> handleIllegalState(
      IllegalStateException ex, HttpServletRequest request) {
    return ResponseEntity.status(HttpStatus.CONFLICT)
        .body(error(HttpStatus.CONFLICT, ex.getMessage(), request, List.of()));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<Map<String, Object>> handleUnexpected(
      Exception ex, HttpServletRequest request) {
    log.error("Unhandled exception at {} {}", request.getMethod(), request.getRequestURI(), ex);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(
            Map.of(
                "timestamp", Instant.now().toString(),
                "status", 500,
                "error", "Internal Server Error",
                "path", request.getRequestURI()));
  }

  private static ErrorResponse error(
      HttpStatus status, String message, HttpServletRequest request, List<FieldErrorPayload> errors) {
    return new ErrorResponse(
        Instant.now(),
        status.value(),
        status.getReasonPhrase(),
        message,
        request.getRequestURI(),
        errors);
  }
}
