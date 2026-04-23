package com.st6.weeklycommit.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

  @Bean
  public OpenAPI weeklyCommitOpenApi() {
    return new OpenAPI()
        .info(
            new Info()
                .title("Weekly Commit Module API")
                .version("0.1.0")
                .description(
                    "Strategy-execution control layer that links every weekly commit to a"
                        + " Supporting Outcome in the Rally Cry → Defining Objective → Outcome"
                        + " hierarchy. Replaces 15Five for ~175+ employees.")
                .contact(new Contact().name("ST6 Engineering").email("eng@st6.local"))
                .license(new License().name("Internal — UNLICENSED")))
        .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
        .schemaRequirement(
            "bearerAuth",
            new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT"));
  }
}
