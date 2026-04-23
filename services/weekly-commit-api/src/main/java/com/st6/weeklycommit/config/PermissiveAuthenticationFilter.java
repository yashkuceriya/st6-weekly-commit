package com.st6.weeklycommit.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Dev-only filter. Reads {@code X-Dev-User} header (defaulting to
 * {@code dev-ic@st6.local}) and seeds a Spring Security context with all
 * known scopes. This is what allows {@code @PreAuthorize} method security to
 * pass without requiring a real JWT during local development.
 *
 * <p>Production never loads this filter — it's gated by the {@code dev} +
 * {@code test} profile in {@link DevSecurityConfig}.
 */
public class PermissiveAuthenticationFilter extends OncePerRequestFilter {

  private static final List<SimpleGrantedAuthority> ALL_SCOPES =
      List.of(
          new SimpleGrantedAuthority("SCOPE_plan:write"),
          new SimpleGrantedAuthority("SCOPE_plan:lock"),
          new SimpleGrantedAuthority("SCOPE_plan:reconcile"),
          new SimpleGrantedAuthority("SCOPE_manager:review"),
          new SimpleGrantedAuthority("ROLE_USER"));

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {
    String user = request.getHeader("X-Dev-User");
    if (user == null || user.isBlank()) {
      user = "dev-ic@st6.local";
    }
    var auth = new UsernamePasswordAuthenticationToken(user, "n/a", ALL_SCOPES);
    SecurityContextHolder.getContext().setAuthentication(auth);
    chain.doFilter(request, response);
  }
}
