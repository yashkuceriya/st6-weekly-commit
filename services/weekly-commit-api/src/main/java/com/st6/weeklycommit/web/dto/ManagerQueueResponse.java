package com.st6.weeklycommit.web.dto;

import org.springframework.data.domain.Page;

public record ManagerQueueResponse(TeamRollupDto rollup, Page<ExceptionCardDto> exceptions) {}
