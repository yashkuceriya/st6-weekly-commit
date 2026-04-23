package com.st6.weeklycommit.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.List;

/**
 * Dev / test profile: no JWT enforcement. Endpoints are wide-open so the
 * frontend works without an Auth0 tenant. The "current user" is resolved by
 * {@code AuditingConfig#auditorProvider} from a request header
 * ({@code X-Dev-User}) instead of a JWT principal.
 *
 * Method-security annotations still bind, but a permissive
 * {@link PermissiveAuthenticationFilter} marks the user as authenticated with
 * all scopes so {@code @PreAuthorize("hasAuthority('SCOPE_plan:lock')")}
 * passes in dev.
 */
@Configuration
@EnableMethodSecurity(prePostEnabled = true)
@Profile({"dev", "test"})
public class DevSecurityConfig {

  @Bean
  public SecurityFilterChain devSecurityFilterChain(HttpSecurity http) throws Exception {
    http.csrf(csrf -> csrf.disable())
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
        .addFilterBefore(
            new PermissiveAuthenticationFilter(),
            org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class);
    return http.build();
  }

  @Bean
  public CorsFilter devCorsFilter() {
    var config = new CorsConfiguration();
    config.setAllowedOriginPatterns(List.of("*"));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
    config.setAllowedHeaders(List.of("*"));
    config.setAllowCredentials(true);
    config.setMaxAge(3600L);
    var source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return new CorsFilter(source);
  }
}
