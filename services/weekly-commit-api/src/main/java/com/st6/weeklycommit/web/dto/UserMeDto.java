package com.st6.weeklycommit.web.dto;

import java.util.List;
import java.util.UUID;

public record UserMeDto(
    UUID id,
    String email,
    String displayName,
    UUID managerId,
    UUID teamId,
    List<String> roles) {}
