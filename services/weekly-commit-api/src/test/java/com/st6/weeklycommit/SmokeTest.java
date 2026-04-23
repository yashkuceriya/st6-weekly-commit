package com.st6.weeklycommit;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.annotation.DirtiesContext;

@org.springframework.boot.test.context.SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class SmokeTest extends AbstractIntegrationTest {

  @LocalServerPort int port;

  @Autowired TestRestTemplate restTemplate;

  @Test
  void healthEndpointReturnsOk() {
    var response = restTemplate.getForObject("http://localhost:" + port + "/api/health", String.class);
    assertThat(response).contains("\"status\":\"OK\"").contains("weekly-commit-api");
  }

  @Test
  void actuatorHealthIsExposed() {
    var response = restTemplate.getForObject("http://localhost:" + port + "/api/actuator/health", String.class);
    assertThat(response).contains("UP");
  }
}
