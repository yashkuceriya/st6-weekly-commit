package com.st6.weeklycommit.config;

import java.util.Optional;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Resolves the "current user" for JPA auditing fields ({@code @CreatedBy} /
 * {@code @LastModifiedBy}) on {@link com.st6.weeklycommit.domain.AbstractAuditingEntity}.
 *
 * Reads from {@link SecurityContextHolder} so it works the same way in both
 * dev (permissive filter seeds a username) and prod (Auth0 JWT subject).
 */
@Configuration
public class AuditingConfig {

  @Bean
  public AuditorAware<String> auditorProvider() {
    return () -> {
      var ctx = SecurityContextHolder.getContext();
      if (ctx == null || ctx.getAuthentication() == null) {
        return Optional.of("system");
      }
      var name = ctx.getAuthentication().getName();
      return Optional.of(name == null || name.isBlank() ? "system" : name);
    };
  }
}
