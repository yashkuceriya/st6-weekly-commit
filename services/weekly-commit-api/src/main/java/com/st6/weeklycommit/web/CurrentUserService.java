package com.st6.weeklycommit.web;

import com.st6.weeklycommit.domain.AppUser;
import com.st6.weeklycommit.repository.AppUserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

/**
 * Resolves the current request's {@link AppUser} from auth context.
 *
 * <p>In dev/test profiles, the principal is a username string (set by
 * {@link com.st6.weeklycommit.config.PermissiveAuthenticationFilter} from
 * the {@code X-Dev-User} header). In prod, it's a JWT subject claim
 * mapped to an email by Auth0 Action.
 *
 * <p>Falls back to the seeded {@code dev-ic@st6.local} account if no
 * authenticated principal is present — production code paths never hit this
 * fallback because {@code SecurityConfig} requires authentication.
 */
@Service
public class CurrentUserService {

  private final AppUserRepository users;

  public CurrentUserService(AppUserRepository users) {
    this.users = users;
  }

  public AppUser require() {
    var auth = SecurityContextHolder.getContext().getAuthentication();
    var name = auth == null ? null : auth.getName();
    if (name == null || name.isBlank()) name = "dev-ic@st6.local";
    return users
        .findByEmail(name)
        .orElseThrow(() -> new IllegalStateException("No AppUser for principal: " + auth));
  }

  /** Optional override via header — useful for dev tooling that sets X-Dev-User. */
  public AppUser requireFromRequest(HttpServletRequest request) {
    var override = request.getHeader("X-Dev-User");
    if (override != null && !override.isBlank()) {
      return users
          .findByEmail(override)
          .orElseThrow(() -> new IllegalStateException("No AppUser for X-Dev-User: " + override));
    }
    return require();
  }
}
