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
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log =
            LoggerFactory.getLogger(
                    GlobalExceptionHandler.class
            );

    private static final int
            MAX_SAFE_PATH_LENGTH = 200;

    private static final String
            GENERIC_BUSINESS_MESSAGE =
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
                            + "får inte ligga före "
                            + "utlåningsdatumet."
            );

    private static final Map<String, String>
            SWEDISH_VALIDATION_MESSAGES =
            Map.ofEntries(
                    Map.entry(
                            "Equipment type is required",
                            "Typ av utrustning måste anges."
                    ),
                    Map.entry(
                            "Serial number is required",
                            "Serienummer måste anges."
                    ),
                    Map.entry(
                            "Serial number must be "
                                    + "between 2 and 50 characters",
                            "Serienumret måste innehålla "
                                    + "mellan 2 och 50 tecken."
                    ),
                    Map.entry(
                            "Serial number may only contain "
                                    + "letters, numbers, hyphens "
                                    + "and underscores",
                            "Serienumret får endast innehålla "
                                    + "bokstäver, siffror, "
                                    + "bindestreck och understreck."
                    ),
                    Map.entry(
                            "Equipment condition is required",
                            "Utrustningens skick måste anges."
                    ),
                    Map.entry(
                            "Name is required",
                            "Namn måste anges."
                    ),
                    Map.entry(
                            "Name must be between "
                                    + "2 and 100 characters",
                            "Namnet måste innehålla mellan "
                                    + "2 och 100 tecken."
                    ),
                    Map.entry(
                            "Name contains invalid characters",
                            "Namnet innehåller otillåtna tecken."
                    ),
                    Map.entry(
                            "Email is required",
                            "E-post måste anges."
                    ),
                    Map.entry(
                            "Email must be valid",
                            "Ange en giltig e-postadress."
                    ),
                    Map.entry(
                            "Phone number is required",
                            "Telefonnummer måste anges."
                    ),
                    Map.entry(
                            "Phone number must be between "
                                    + "6 and 30 characters",
                            "Telefonnumret måste innehålla "
                                    + "mellan 6 och 30 tecken."
                    ),
                    Map.entry(
                            "Phone number contains "
                                    + "invalid characters",
                            "Telefonnumret innehåller "
                                    + "otillåtna tecken."
                    ),
                    Map.entry(
                            "Alias name must be between "
                                    + "2 and 100 characters",
                            "Aliasnamnet måste innehålla "
                                    + "mellan 2 och 100 tecken."
                    ),
                    Map.entry(
                            "Alias name must not be blank",
                            "Aliasnamn måste anges."
                    ),
                    Map.entry(
                            "Expected return date must be "
                                    + "today or a future date",
                            "Förväntat återlämningsdatum "
                                    + "måste vara idag eller "
                                    + "ett framtida datum."
                    ),
                    Map.entry(
                            "Active status is required",
                            "Aktiv status måste anges."
                    ),
                    Map.entry(
                            "Username is required.",
                            "Användarnamn måste anges."
                    ),
                    Map.entry(
                            "Username may contain at most "
                                    + "100 characters.",
                            "Användarnamnet får innehålla "
                                    + "högst 100 tecken."
                    ),
                    Map.entry(
                            "Password is required.",
                            "Lösenord måste anges."
                    ),
                    Map.entry(
                            "Password is too long.",
                            "Lösenordet är för långt."
                    )
            );

    @ExceptionHandler(
            ResourceNotFoundException.class
    )
    public ResponseEntity<ApiErrorResponse>
    handleNotFound(
            ResourceNotFoundException exception,
            HttpServletRequest request
    ) {
        ApiErrorCode code =
                resolveNotFoundCode(
                        exception
                );

        return buildResponse(
                HttpStatus.NOT_FOUND,
                code,
                notFoundMessage(code),
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
                exception.getCode(),
                "Det finns redan en resurs "
                        + "med samma unika uppgifter.",
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
        ApiErrorCode code =
                resolveBusinessCode(
                        exception
                );

        return buildResponse(
                HttpStatus.CONFLICT,
                code,
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
                ApiErrorCode.INVALID_REQUEST,
                "Begäran kunde inte behandlas.",
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
        Map<String, String> fieldErrors =
                new LinkedHashMap<>();

        exception
                .getBindingResult()
                .getFieldErrors()
                .stream()
                .sorted(
                        Comparator.comparingInt(
                                this::validationPriority
                        )
                )
                .forEach(error ->
                        fieldErrors.putIfAbsent(
                                error.getField(),
                                translateValidationMessage(
                                        error.getDefaultMessage()
                                )
                        )
                );

        return buildResponse(
                HttpStatus.BAD_REQUEST,
                ApiErrorCode.VALIDATION_FAILED,
                "Kontrollera de markerade fälten.",
                request,
                fieldErrors
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
        return validationResponse(
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
        return validationResponse(
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
                ApiErrorCode.INVALID_REQUEST,
                "En eller flera parametrar "
                        + "innehåller ogiltiga värden.",
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
                ApiErrorCode.MALFORMED_REQUEST,
                "Request body saknas, har fel format "
                        + "eller innehåller ogiltiga värden.",
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
                ApiErrorCode.METHOD_NOT_ALLOWED,
                "HTTP-metoden stöds inte "
                        + "för denna endpoint.",
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
                safeMethod(request),
                safePath(request),
                exception
                        .getClass()
                        .getSimpleName()
        );

        return buildResponse(
                HttpStatus.CONFLICT,
                ApiErrorCode.DATA_CONFLICT,
                "Begäran står i konflikt "
                        + "med befintliga data.",
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
                ApiErrorCode.INVALID_CREDENTIALS,
                "Felaktigt användarnamn "
                        + "eller lösenord.",
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
                ApiErrorCode.ENDPOINT_NOT_FOUND,
                "Den begärda API-endpointen "
                        + "finns inte.",
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
                safeMethod(request),
                safePath(request),
                exception
                        .getClass()
                        .getSimpleName()
        );

        return buildResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                ApiErrorCode.INTERNAL_SERVER_ERROR,
                "Ett oväntat fel inträffade.",
                request
        );
    }

    private ResponseEntity<ApiErrorResponse>
    validationResponse(
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                ApiErrorCode.VALIDATION_FAILED,
                "En eller flera parametrar "
                        + "är ogiltiga.",
                request
        );
    }

    private ApiErrorCode resolveBusinessCode(
            BusinessRuleException exception
    ) {
        if (exception.getCode()
                != ApiErrorCode
                .BUSINESS_RULE_VIOLATION) {
            return exception.getCode();
        }

        return switch (
                String.valueOf(
                        exception.getMessage()
                )
                ) {
            case "Utrustningen är redan utlånad.",
                 "Utrustningen har redan "
                         + "ett aktivt lån." ->
                    ApiErrorCode
                            .EQUIPMENT_ALREADY_LOANED;

            case "Utrustningen är inaktiverad "
                         + "och kan inte lånas." ->
                    ApiErrorCode
                            .EQUIPMENT_INACTIVE;

            case "Lånet är redan återlämnat." ->
                    ApiErrorCode
                            .LOAN_ALREADY_RETURNED;

            default ->
                    ApiErrorCode
                            .BUSINESS_RULE_VIOLATION;
        };
    }

    private ApiErrorCode resolveNotFoundCode(
            ResourceNotFoundException exception
    ) {
        if (exception.getCode()
                != ApiErrorCode
                .RESOURCE_NOT_FOUND) {
            return exception.getCode();
        }

        String message =
                exception.getMessage();

        return message != null
                && message.startsWith(
                "Equipment not found"
        )
                ? ApiErrorCode
                .EQUIPMENT_NOT_FOUND
                : ApiErrorCode
                .RESOURCE_NOT_FOUND;
    }

    private String notFoundMessage(
            ApiErrorCode code
    ) {
        if (code
                == ApiErrorCode
                .EQUIPMENT_NOT_FOUND) {
            return "Utrustningen kunde inte hittas.";
        }

        return "Den begärda resursen "
                + "kunde inte hittas.";
    }

    private String safeBusinessMessage(
            String message
    ) {
        if (message != null
                && SAFE_BUSINESS_MESSAGES
                .contains(message)) {
            return message;
        }

        return GENERIC_BUSINESS_MESSAGE;
    }

    private int validationPriority(
            FieldError error
    ) {
        String validationCode =
                error.getCode();

        if (validationCode == null) {
            return 100;
        }

        return switch (validationCode) {
            case "NotBlank",
                 "NotNull",
                 "NotEmpty" -> 0;

            case "Email",
                 "Pattern",
                 "Future",
                 "FutureOrPresent",
                 "Past",
                 "PastOrPresent" -> 10;

            case "Size",
                 "Min",
                 "Max",
                 "DecimalMin",
                 "DecimalMax" -> 20;

            default -> 50;
        };
    }

    private String translateValidationMessage(
            String message
    ) {
        if (message == null
                || message.isBlank()) {
            return "Värdet är ogiltigt.";
        }

        return SWEDISH_VALIDATION_MESSAGES
                .getOrDefault(
                        message,
                        "Värdet är ogiltigt."
                );
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

        return removeControlCharacters(
                method
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
                removeControlCharacters(
                        path
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

    private String removeControlCharacters(
            String value
    ) {
        return value
                .replace("\r", "")
                .replace("\n", "")
                .replace("\t", "");
    }

    private ResponseEntity<ApiErrorResponse>
    buildResponse(
            HttpStatus status,
            ApiErrorCode code,
            String message,
            HttpServletRequest request
    ) {
        return buildResponse(
                status,
                code,
                message,
                request,
                Map.of()
        );
    }

    private ResponseEntity<ApiErrorResponse>
    buildResponse(
            HttpStatus status,
            ApiErrorCode code,
            String message,
            HttpServletRequest request,
            Map<String, String> fieldErrors
    ) {
        ApiErrorResponse response =
                new ApiErrorResponse(
                        LocalDateTime.now(),
                        status.value(),
                        status.getReasonPhrase(),
                        code,
                        message,
                        safePath(request),
                        fieldErrors
                );

        return ResponseEntity
                .status(status)
                .body(response);
    }
}