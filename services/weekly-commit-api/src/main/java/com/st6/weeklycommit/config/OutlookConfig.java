package com.st6.weeklycommit.config;

import com.st6.weeklycommit.integration.OutlookProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(OutlookProperties.class)
public class OutlookConfig {}
