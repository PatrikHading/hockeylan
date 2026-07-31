package com.norops.hockeylan.security;

import com.norops.hockeylan.exception.ApiErrorCode;
import com.norops.hockeylan.exception.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class RestAccessDeniedHandler
        implements AccessDeniedHandler {

    private static final int
            MAX_SAFE_PATH_LENGTH = 200;

    private final ObjectMapper objectMapper;

    @Override
    public void handle(
            HttpServletRequest request,
            HttpServletResponse response,
            AccessDeniedException exception
    ) throws IOException {
        ApiErrorResponse body =
                new ApiErrorResponse(
                        LocalDateTime.now(),
                        HttpStatus
                                .FORBIDDEN
                                .value(),
                        HttpStatus
                                .FORBIDDEN
                                .getReasonPhrase(),
                        ApiErrorCode.ACCESS_DENIED,
                        "Du saknar behörighet "
                                + "för åtgärden.",
                        safePath(request),
                        Map.of()
                );

        response.setStatus(
                HttpStatus
                        .FORBIDDEN
                        .value()
        );

        response.setContentType(
                MediaType
                        .APPLICATION_JSON_VALUE
        );

        response.setCharacterEncoding(
                "UTF-8"
        );

        response.setHeader(
                HttpHeaders.CACHE_CONTROL,
                "no-store"
        );

        objectMapper.writeValue(
                response.getWriter(),
                body
        );
    }

    private String safePath(
            HttpServletRequest request
    ) {
        String path =
                request.getRequestURI();

        if (path == null
                || path.isBlank()) {
            return "/api";
        }

        String sanitized =
                path
                        .replace("\r", "")
                        .replace("\n", "")
                        .replace("\t", "");

        if (sanitized.length()
                <= MAX_SAFE_PATH_LENGTH) {
            return sanitized;
        }

        return sanitized.substring(
                0,
                MAX_SAFE_PATH_LENGTH
        );
    }
}