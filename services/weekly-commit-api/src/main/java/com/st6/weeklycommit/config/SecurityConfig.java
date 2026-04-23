package com.st6.weeklycommit.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.List;

/**
 * Production security: JWT bearer tokens validated against the configured
 * Auth0 issuer. Scopes ({@code plan:write}, {@code plan:lock},
 * {@code plan:reconcile}, {@code manager:review}) become Spring authorities
 * with {@code SCOPE_} prefix and are enforced via {@code @PreAuthorize} on
 * the relevant controller methods.
 *
 * The dev profile is wired in {@link DevSecurityConfig} and bypasses JWT.
 */
@Configuration
@EnableMethodSecurity(prePostEnabled = true)
@Profile("!dev & !test")
public class SecurityConfig {

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http.csrf(csrf -> csrf.disable())
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth ->
            auth.requestMatchers("/actuator/health/**", "/actuator/info", "/actuator/prometheus")
                .permitAll()
                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html")
                .permitAll()
                .anyRequest()
                .authenticated())
        .oauth2ResourceServer(oauth ->
            oauth.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())));
    return http.build();
  }

  @Bean
  public JwtDecoder jwtDecoder(
      org.springframework.boot.autoconfigure.security.oauth2.resource.OAuth2ResourceServerProperties props) {
    return NimbusJwtDecoder.withIssuerLocation(props.getJwt().getIssuerUri()).build();
  }

  @Bean
  public CorsFilter corsFilter() {
    var config = new CorsConfiguration();
    config.setAllowedOriginPatterns(List.of("https://*.st6.local", "http://localhost:*"));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
    config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
    config.setAllowCredentials(true);
    config.setMaxAge(3600L);
    var source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return new CorsFilter(source);
  }

  private JwtAuthenticationConverter jwtAuthenticationConverter() {
    var grantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
    grantedAuthoritiesConverter.setAuthorityPrefix("SCOPE_");
    grantedAuthoritiesConverter.setAuthoritiesClaimName("scope");
    var jwtConverter = new JwtAuthenticationConverter();
    jwtConverter.setJwtGrantedAuthoritiesConverter(grantedAuthoritiesConverter);
    jwtConverter.setPrincipalClaimName("sub");
    return jwtConverter;
  }

  @SuppressWarnings("unused")
  private void requireConfig(Customizer<HttpSecurity> _placeholder) {
    // marker for static analyzers; intentionally unused
  }
}
