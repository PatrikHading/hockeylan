package com.norops.hockeylan.security;

import com.norops.hockeylan.exception.ApiErrorResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
@RequiredArgsConstructor
public class InMemoryRateLimitFilter
        extends OncePerRequestFilter {

    private static final String LOGIN_PATH =
            "/api/auth/login";

    private static final int MAX_CLIENT_KEY_LENGTH =
            64;

    private static final int MAX_RESPONSE_PATH_LENGTH =
            200;

    private final RateLimitProperties properties;

    private final ObjectMapper objectMapper;

    private final Map<String, TokenBucket> buckets =
            new ConcurrentHashMap<>();

    private final Object cleanupMonitor =
            new Object();

    @Override
    protected boolean shouldNotFilter(
            HttpServletRequest request
    ) {
        return !properties.isEnabled()
                || !request
                .getRequestURI()
                .startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        boolean loginRequest =
                isLoginRequest(request);

        String clientKey =
                buildClientKey(
                        request,
                        loginRequest
                );

        ensureCapacity();

        TokenBucket bucket =
                buckets.computeIfAbsent(
                        clientKey,
                        ignored ->
                                createBucket(
                                        loginRequest
                                )
                );

        if (!bucket.tryConsume()) {
            writeRateLimitResponse(
                    request,
                    response,
                    retryAfterSeconds(
                            loginRequest
                    )
            );

            return;
        }

        filterChain.doFilter(
                request,
                response
        );
    }

    private boolean isLoginRequest(
            HttpServletRequest request
    ) {
        return LOGIN_PATH.equals(
                request.getRequestURI()
        )
                && "POST".equalsIgnoreCase(
                request.getMethod()
        );
    }

    private String buildClientKey(
            HttpServletRequest request,
            boolean loginRequest
    ) {
        String scope =
                loginRequest
                        ? "login:"
                        : "api:";

        return scope
                + normalizeClientAddress(
                request.getRemoteAddr()
        );
    }

    private String normalizeClientAddress(
            String remoteAddress
    ) {
        if (remoteAddress == null
                || remoteAddress.isBlank()) {
            return "unknown";
        }

        String normalized =
                remoteAddress.trim();

        if (normalized.length()
                <= MAX_CLIENT_KEY_LENGTH) {
            return normalized;
        }

        return normalized.substring(
                0,
                MAX_CLIENT_KEY_LENGTH
        );
    }

    private TokenBucket createBucket(
            boolean loginRequest
    ) {
        if (loginRequest) {
            return new TokenBucket(
                    properties
                            .getLoginCapacity(),
                    properties
                            .getLoginRefillTokens(),
                    properties
                            .getLoginRefillPeriodSeconds()
            );
        }

        return new TokenBucket(
                properties
                        .getApiCapacity(),
                properties
                        .getApiRefillTokens(),
                properties
                        .getApiRefillPeriodSeconds()
        );
    }

    private int retryAfterSeconds(
            boolean loginRequest
    ) {
        if (loginRequest) {
            return properties
                    .getLoginRefillPeriodSeconds();
        }

        return properties
                .getApiRefillPeriodSeconds();
    }

    private void ensureCapacity() {
        if (buckets.size()
                < properties.getMaxEntries()) {
            return;
        }

        synchronized (cleanupMonitor) {
            if (buckets.size()
                    < properties.getMaxEntries()) {
                return;
            }

            removeExpiredEntries();

            if (buckets.size()
                    >= properties.getMaxEntries()) {
                removeOldestEntries();
            }
        }
    }

    private void removeExpiredEntries() {
        long cutoffTimestamp =
                System.currentTimeMillis()
                        - properties
                        .getIdleEntryTtlSeconds()
                        * 1000L;

        buckets
                .entrySet()
                .removeIf(
                        entry ->
                                entry
                                        .getValue()
                                        .getLastSeenTimestamp()
                                        < cutoffTimestamp
                );
    }

    private void removeOldestEntries() {
        int entriesToRemove =
                buckets.size()
                        - properties
                        .getMaxEntries()
                        + 1;

        if (entriesToRemove <= 0) {
            return;
        }

        buckets
                .entrySet()
                .stream()
                .sorted(
                        Comparator.comparingLong(
                                entry ->
                                        entry
                                                .getValue()
                                                .getLastSeenTimestamp()
                        )
                )
                .limit(entriesToRemove)
                .map(Map.Entry::getKey)
                .toList()
                .forEach(buckets::remove);
    }

    private void writeRateLimitResponse(
            HttpServletRequest request,
            HttpServletResponse response,
            int retryAfterSeconds
    ) throws IOException {
        ApiErrorResponse errorResponse =
                new ApiErrorResponse(
                        LocalDateTime.now(),
                        HttpStatus
                                .TOO_MANY_REQUESTS
                                .value(),
                        "Too Many Requests",
                        "För många anrop. "
                                + "Försök igen senare.",
                        safeResponsePath(
                                request
                        )
                );

        response.setStatus(
                HttpStatus
                        .TOO_MANY_REQUESTS
                        .value()
        );

        response.setContentType(
                MediaType.APPLICATION_JSON_VALUE
        );

        response.setCharacterEncoding(
                "UTF-8"
        );

        response.setHeader(
                HttpHeaders.RETRY_AFTER,
                String.valueOf(
                        retryAfterSeconds
                )
        );

        response.setHeader(
                HttpHeaders.CACHE_CONTROL,
                "no-store"
        );

        objectMapper.writeValue(
                response.getWriter(),
                errorResponse
        );
    }

    private String safeResponsePath(
            HttpServletRequest request
    ) {
        String path =
                request.getRequestURI();

        if (path == null
                || path.length()
                > MAX_RESPONSE_PATH_LENGTH
                || path.contains("\r")
                || path.contains("\n")) {
            return "/api";
        }

        return path;
    }

    private static final class TokenBucket {

        private final int capacity;

        private final int refillTokens;

        private final long refillPeriodMillis;

        private int availableTokens;

        private long lastRefillTimestamp;

        private volatile long lastSeenTimestamp;

        private TokenBucket(
                int capacity,
                int refillTokens,
                int refillPeriodSeconds
        ) {
            this.capacity =
                    capacity;

            this.refillTokens =
                    refillTokens;

            this.refillPeriodMillis =
                    refillPeriodSeconds
                            * 1000L;

            this.availableTokens =
                    capacity;

            this.lastRefillTimestamp =
                    System.currentTimeMillis();

            this.lastSeenTimestamp =
                    lastRefillTimestamp;
        }

        private synchronized boolean tryConsume() {
            long currentTimestamp =
                    System.currentTimeMillis();

            lastSeenTimestamp =
                    currentTimestamp;

            refill(
                    currentTimestamp
            );

            if (availableTokens <= 0) {
                return false;
            }

            availableTokens--;

            return true;
        }

        private void refill(
                long currentTimestamp
        ) {
            long elapsedMillis =
                    currentTimestamp
                            - lastRefillTimestamp;

            if (elapsedMillis
                    < refillPeriodMillis) {
                return;
            }

            long refillCycles =
                    elapsedMillis
                            / refillPeriodMillis;

            long requestedTokens =
                    (long) refillTokens
                            * refillCycles;

            int tokensToAdd =
                    (int) Math.min(
                            requestedTokens,
                            capacity
                    );

            availableTokens =
                    Math.min(
                            capacity,
                            availableTokens
                                    + tokensToAdd
                    );

            lastRefillTimestamp +=
                    refillCycles
                            * refillPeriodMillis;
        }

        private long getLastSeenTimestamp() {
            return lastSeenTimestamp;
        }
    }
}