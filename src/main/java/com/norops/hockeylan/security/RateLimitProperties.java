package com.norops.hockeylan.security;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

@Getter
@Setter
@Validated
@Component
@ConfigurationProperties(
        prefix = "app.rate-limit"
)
public class RateLimitProperties {

    private boolean enabled = true;

    @Min(1)
    @Max(10_000)
    private int apiCapacity = 120;

    @Min(1)
    @Max(10_000)
    private int apiRefillTokens = 120;

    @Min(1)
    @Max(86_400)
    private int apiRefillPeriodSeconds = 60;

    @Min(1)
    @Max(100)
    private int loginCapacity = 5;

    @Min(1)
    @Max(100)
    private int loginRefillTokens = 5;

    @Min(1)
    @Max(86_400)
    private int loginRefillPeriodSeconds = 300;

    @Min(60)
    @Max(86_400)
    private int idleEntryTtlSeconds = 900;

    @Min(100)
    @Max(1_000_000)
    private int maxEntries = 10_000;
}