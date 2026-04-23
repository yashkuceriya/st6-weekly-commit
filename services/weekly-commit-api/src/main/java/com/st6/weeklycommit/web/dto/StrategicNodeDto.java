package com.st6.weeklycommit.web.dto;

import com.st6.weeklycommit.domain.enums.StrategicNodeType;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record StrategicNodeDto(
    UUID id,
    StrategicNodeType type,
    UUID parentId,
    String title,
    String description,
    UUID owningTeamId,
    boolean active,
    LocalDate activeFrom,
    LocalDate activeUntil,
    int displayOrder,
    List<StrategicNodeDto> children) {}
