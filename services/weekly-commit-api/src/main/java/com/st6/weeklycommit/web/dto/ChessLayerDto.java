package com.st6.weeklycommit.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ChessLayerDto(
    UUID id,
    String name,
    String description,
    String color,
    int displayOrder,
    BigDecimal weight,
    boolean isDefault,
    boolean active) {}
