package com.norops.hockeylan.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final int MAX_SAFE_PATH_LENGTH =
            200;

    private static final String GENERIC_BUSINESS_MESSAGE =
            "Åtgärden kan inte genomföras "
                    + "i objektets nuvarande status.";

    private static final Set<String>
            SAFE_BUSINESS_MESSAGES =
            Set.of(
                    "Lånet är redan återlämnat.",
                    "Utrustningen är inaktiverad "
                            + "och kan inte lånas.",
                    "Utrustningen är redan utlånad.",
                    "Utrustningen har redan "
                            + "ett aktivt lån.",
                    "Låneformulär saknas.",
                    "Namn måste anges.",
                    "E-post måste anges.",
                    "Telefonnummer måste anges.",
                    "Förväntat återlämningsdatum "
                            + "måste anges.",
                    "Förväntat återlämningsdatum "
                            + "får inte ligga före "
                            + "utlåningsdatumet."
            );

    private static final Logger log =
            LoggerFactory.getLogger(
                    GlobalExceptionHandler.class
            );

    @ExceptionHandler(
            ResourceNotFoundException.class
    )
    public ResponseEntity<ApiErrorResponse>
    handleNotFound(
            ResourceNotFoundException exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.NOT_FOUND,
                "Not Found",
                "Requested resource was not found.",
                request
        );
    }

    @ExceptionHandler(
            DuplicateResourceException.class
    )
    public ResponseEntity<ApiErrorResponse>
    handleDuplicateResource(
            DuplicateResourceException exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.CONFLICT,
                "Conflict",
                "Resource already exists.",
                request
        );
    }

    @ExceptionHandler(
            BusinessRuleException.class
    )
    public ResponseEntity<ApiErrorResponse>
    handleBusinessRule(
            BusinessRuleException exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.CONFLICT,
                "Business Rule Violation",
                safeBusinessMessage(
                        exception.getMessage()
                ),
                request
        );
    }

    @ExceptionHandler({
            IllegalArgumentException.class,
            IllegalStateException.class
    })
    public ResponseEntity<ApiErrorResponse>
    handleBadRequest(
            RuntimeException exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "Bad Request",
                "Request could not be processed.",
                request
        );
    }

    @ExceptionHandler(
            MethodArgumentNotValidException.class
    )
    public ResponseEntity<ApiErrorResponse>
    handleValidation(
            MethodArgumentNotValidException exception,
            HttpServletRequest request
    ) {
        String message =
                exception
                        .getBindingResult()
                        .getFieldErrors()
                        .stream()
                        .map(
                                error ->
                                        error.getField()
                                                + ": "
                                                + error
                                                .getDefaultMessage()
                        )
                        .collect(
                                Collectors.joining(
                                        ", "
                                )
                        );

        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "Validation Error",
                message,
                request
        );
    }

    @ExceptionHandler(
            HandlerMethodValidationException.class
    )
    public ResponseEntity<ApiErrorResponse>
    handleMethodValidation(
            HandlerMethodValidationException exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "Validation Error",
                "One or more request parameters "
                        + "are invalid.",
                request
        );
    }

    @ExceptionHandler(
            ConstraintViolationException.class
    )
    public ResponseEntity<ApiErrorResponse>
    handleConstraintViolation(
            ConstraintViolationException exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "Constraint Violation",
                "One or more request parameters "
                        + "are invalid.",
                request
        );
    }

    @ExceptionHandler(
            MethodArgumentTypeMismatchException.class
    )
    public ResponseEntity<ApiErrorResponse>
    handleTypeMismatch(
            MethodArgumentTypeMismatchException exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "Invalid Parameter",
                "One or more request parameters "
                        + "contain invalid values.",
                request
        );
    }

    @ExceptionHandler(
            HttpMessageNotReadableException.class
    )
    public ResponseEntity<ApiErrorResponse>
    handleUnreadableMessage(
            HttpMessageNotReadableException exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "Malformed JSON",
                "Request body is missing, "
                        + "malformed or contains "
                        + "invalid values.",
                request
        );
    }

    @ExceptionHandler(
            HttpRequestMethodNotSupportedException.class
    )
    public ResponseEntity<ApiErrorResponse>
    handleMethodNotSupported(
            HttpRequestMethodNotSupportedException exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.METHOD_NOT_ALLOWED,
                "Method Not Allowed",
                "The requested HTTP method is not "
                        + "supported for this endpoint.",
                request
        );
    }

    @ExceptionHandler(
            DataIntegrityViolationException.class
    )
    public ResponseEntity<ApiErrorResponse>
    handleDataIntegrityViolation(
            DataIntegrityViolationException exception,
            HttpServletRequest request
    ) {
        log.warn(
                "Database constraint violation; "
                        + "method={}, path={}, type={}",
                safeMethod(
                        request
                ),
                safePath(
                        request
                ),
                exception
                        .getClass()
                        .getSimpleName()
        );

        return buildResponse(
                HttpStatus.CONFLICT,
                "Conflict",
                "Request conflicts with "
                        + "existing data.",
                request
        );
    }

    @ExceptionHandler(
            AuthenticationException.class
    )
    public ResponseEntity<ApiErrorResponse>
    handleAuthenticationFailure(
            AuthenticationException exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.UNAUTHORIZED,
                "Unauthorized",
                "Invalid username or password.",
                request
        );
    }

    @ExceptionHandler({
            NoHandlerFoundException.class,
            NoResourceFoundException.class
    })
    public ResponseEntity<ApiErrorResponse>
    handleEndpointNotFound(
            Exception exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.NOT_FOUND,
                "Not Found",
                "Requested endpoint was not found.",
                request
        );
    }

    @ExceptionHandler(
            Exception.class
    )
    public ResponseEntity<ApiErrorResponse>
    handleGenericException(
            Exception exception,
            HttpServletRequest request
    ) {
        log.error(
                "Unexpected request failure; "
                        + "method={}, path={}, type={}",
                safeMethod(
                        request
                ),
                safePath(
                        request
                ),
                exception
                        .getClass()
                        .getSimpleName()
        );

        return buildResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Internal Server Error",
                "Ett oväntat fel inträffade.",
                request
        );
    }

    private String safeBusinessMessage(
            String message
    ) {
        if (message != null
                && SAFE_BUSINESS_MESSAGES
                .contains(
                        message
                )) {
            return message;
        }

        return GENERIC_BUSINESS_MESSAGE;
    }

    private String safeMethod(
            HttpServletRequest request
    ) {
        String method =
                request.getMethod();

        if (method == null
                || method.isBlank()) {
            return "UNKNOWN";
        }

        return method
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

    private ResponseEntity<ApiErrorResponse>
    buildResponse(
            HttpStatus status,
            String error,
            String message,
            HttpServletRequest request
    ) {
        ApiErrorResponse response =
                new ApiErrorResponse(
                        LocalDateTime.now(),
                        status.value(),
                        error,
                        message,
                        safePath(
                                request
                        )
                );

        return ResponseEntity
                .status(
                        status
                )
                .body(
                        response
                );
    }
}