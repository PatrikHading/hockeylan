package com.norops.hockeylan.security;

import com.norops.hockeylan.exception.ApiErrorCode;
import com.norops.hockeylan.exception.ApiErrorResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class RequestPayloadValidationFilter
        extends OncePerRequestFilter {

    private static final int
            MAX_SAFE_PATH_LENGTH = 200;

    private static final Set<String>
            METHODS_WITH_OPTIONAL_BODY =
            Set.of(
                    HttpMethod.POST.name(),
                    HttpMethod.PUT.name(),
                    HttpMethod.PATCH.name()
            );

    private final ObjectMapper objectMapper;

    @Value(
            "${app.request.max-json-payload-bytes:65536}"
    )
    private long maxJsonPayloadBytes;

    @Override
    protected boolean shouldNotFilter(
            HttpServletRequest request
    ) {
        return !request
                .getRequestURI()
                .startsWith(
                        "/api/"
                )
                || HttpMethod.OPTIONS.matches(
                request.getMethod()
        )
                || !METHODS_WITH_OPTIONAL_BODY
                .contains(
                        request.getMethod()
                );
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        if (!hasRequestBody(request)) {
            filterChain.doFilter(
                    request,
                    response
            );

            return;
        }

        if (!hasValidJsonContentType(request)) {
            writeErrorResponse(
                    response,
                    request,
                    HttpStatus
                            .UNSUPPORTED_MEDIA_TYPE,
                    ApiErrorCode
                            .UNSUPPORTED_MEDIA_TYPE,
                    "Content-Type måste vara "
                            + "application/json."
            );

            return;
        }

        if (request.getContentLengthLong()
                > maxJsonPayloadBytes) {
            writeErrorResponse(
                    response,
                    request,
                    HttpStatus
                            .CONTENT_TOO_LARGE,
                    ApiErrorCode
                            .PAYLOAD_TOO_LARGE,
                    "Begäran är för stor."
            );

            return;
        }

        filterChain.doFilter(
                request,
                response
        );
    }

    private boolean hasRequestBody(
            HttpServletRequest request
    ) {
        if (request.getContentLengthLong()
                > 0) {
            return true;
        }

        String transferEncoding =
                request.getHeader(
                        HttpHeaders
                                .TRANSFER_ENCODING
                );

        return transferEncoding != null
                && !transferEncoding.isBlank();
    }

    private boolean hasValidJsonContentType(
            HttpServletRequest request
    ) {
        String contentType =
                request.getContentType();

        if (contentType == null
                || contentType.isBlank()) {
            return false;
        }

        try {
            MediaType mediaType =
                    MediaType.parseMediaType(
                            contentType
                    );

            return MediaType
                    .APPLICATION_JSON
                    .isCompatibleWith(
                            mediaType
                    );
        } catch (
                IllegalArgumentException exception
        ) {
            return false;
        }
    }

    private void writeErrorResponse(
            HttpServletResponse response,
            HttpServletRequest request,
            HttpStatus status,
            ApiErrorCode code,
            String message
    ) throws IOException {
        ApiErrorResponse errorResponse =
                new ApiErrorResponse(
                        LocalDateTime.now(),
                        status.value(),
                        status.getReasonPhrase(),
                        code,
                        message,
                        safePath(request),
                        Map.of()
                );

        response.setStatus(
                status.value()
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
                errorResponse
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
                        .replace(
                                "\r",
                                ""
                        )
                        .replace(
                                "\n",
                                ""
                        )
                        .replace(
                                "\t",
                                ""
                        );

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