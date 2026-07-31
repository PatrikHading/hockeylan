package com.norops.hockeylan.exception;

import java.time.LocalDateTime;
import java.util.Map;

public record ApiErrorResponse(
        LocalDateTime timestamp,
        int status,
        String error,
        ApiErrorCode code,
        String message,
        String path,
        Map<String, String> fieldErrors
) {

    public ApiErrorResponse {
        fieldErrors =
                fieldErrors == null
                        ? Map.of()
                        : Map.copyOf(
                        fieldErrors
                );
    }
}