package com.norops.hockeylan.security;

import tools.jackson.databind.ObjectMapper;
import com.norops.hockeylan.exception.ApiErrorResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
public class InMemoryRateLimitFilter extends OncePerRequestFilter {

    private final RateLimitProperties properties;
    private final ObjectMapper objectMapper;

    private final Map<String, TokenBucket> buckets = new ConcurrentHashMap<>();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !properties.isEnabled() || !request.getRequestURI().startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String clientKey = resolveClientKey(request);

        TokenBucket bucket = buckets.computeIfAbsent(
                clientKey,
                key -> new TokenBucket(
                        properties.getCapacity(),
                        properties.getRefillTokens(),
                        properties.getRefillPeriodSeconds()
                )
        );

        if (!bucket.tryConsume()) {
            writeRateLimitResponse(request, response);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String resolveClientKey(HttpServletRequest request) {
        return request.getRemoteAddr();
    }

    private void writeRateLimitResponse(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {

        ApiErrorResponse errorResponse = new ApiErrorResponse(
                LocalDateTime.now(),
                HttpStatus.TOO_MANY_REQUESTS.value(),
                "Too Many Requests",
                "För många anrop. Försök igen om en stund.",
                request.getRequestURI()
        );

        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        objectMapper.writeValue(response.getWriter(), errorResponse);
    }

    private static class TokenBucket {

        private final int capacity;
        private final int refillTokens;
        private final long refillPeriodMillis;

        private int tokens;
        private long lastRefillTimestamp;

        private TokenBucket(int capacity, int refillTokens, int refillPeriodSeconds) {
            this.capacity = capacity;
            this.refillTokens = refillTokens;
            this.refillPeriodMillis = refillPeriodSeconds * 1000L;
            this.tokens = capacity;
            this.lastRefillTimestamp = System.currentTimeMillis();
        }

        private synchronized boolean tryConsume() {
            refill();

            if (tokens <= 0) {
                return false;
            }

            tokens--;
            return true;
        }

        private void refill() {
            long now = System.currentTimeMillis();
            long elapsed = now - lastRefillTimestamp;

            if (elapsed < refillPeriodMillis) {
                return;
            }

            long refillCycles = elapsed / refillPeriodMillis;
            int tokensToAdd = Math.toIntExact(Math.min(
                    (long) refillTokens * refillCycles,
                    capacity
            ));

            tokens = Math.min(capacity, tokens + tokensToAdd);
            lastRefillTimestamp = now;
        }
    }
}