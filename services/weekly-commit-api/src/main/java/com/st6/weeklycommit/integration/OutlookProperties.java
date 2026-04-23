package com.st6.weeklycommit.integration;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Outlook / Microsoft Graph configuration. Read from {@code application.yml}
 * under {@code st6.outlook.*}; safely defaults to disabled in dev.
 */
@ConfigurationProperties("st6.outlook")
public record OutlookProperties(
    boolean enabled,
    String tenantId,
    String clientId,
    String clientSecret,
    String senderUpn) {}
