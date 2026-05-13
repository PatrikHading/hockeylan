package com.norops.hockeylan.exception;

import tools.jackson.databind.exc.InvalidFormatException;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleResourceNotFound(
            ResourceNotFoundException exception,
            HttpServletRequest request
    ) {
        return buildResponse(HttpStatus.NOT_FOUND, exception.getMessage(), request, null);
    }

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ApiErrorResponse> handleDuplicateResource(
            DuplicateResourceException exception,
            HttpServletRequest request
    ) {
        return buildResponse(HttpStatus.CONFLICT, exception.getMessage(), request, null);
    }

    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<ApiErrorResponse> handleBusinessRule(
            BusinessRuleException exception,
            HttpServletRequest request
    ) {
        return buildResponse(HttpStatus.CONFLICT, exception.getMessage(), request, null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidationError(
            MethodArgumentNotValidException exception,
            HttpServletRequest request
    ) {
        Map<String, String> validationErrors = new LinkedHashMap<>();

        exception.getBindingResult()
                .getFieldErrors()
                .forEach(error -> validationErrors.put(
                        error.getField(),
                        error.getDefaultMessage()
                ));

        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "Validation failed",
                request,
                validationErrors
        );
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleUnreadableMessage(
            HttpMessageNotReadableException exception,
            HttpServletRequest request
    ) {
        String message = "Request body is invalid or malformed";

        if (exception.getCause() instanceof InvalidFormatException invalidFormatException
                && invalidFormatException.getTargetType().isEnum()) {

            String fieldName = invalidFormatException.getPath().stream()
                    .findFirst()
                    .map(Object::toString)
                    .orElse("unknown");

            message = "Invalid enum value for field: " + fieldName;
        }

        return buildResponse(HttpStatus.BAD_REQUEST, message, request, null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGenericException(
            Exception exception,
            HttpServletRequest request
    ) {
        log.error("Unexpected error on path {}", request.getRequestURI(), exception);

        return buildResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred",
                request,
                null
        );
    }

    private ResponseEntity<ApiErrorResponse> buildResponse(
            HttpStatus status,
            String message,
            HttpServletRequest request,
            Map<String, String> validationErrors
    ) {
        ApiErrorResponse response = ApiErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(status.value())
                .error(status.getReasonPhrase())
                .message(message)
                .path(request.getRequestURI())
                .validationErrors(validationErrors)
                .build();

        return ResponseEntity.status(status).body(response);
    }
}