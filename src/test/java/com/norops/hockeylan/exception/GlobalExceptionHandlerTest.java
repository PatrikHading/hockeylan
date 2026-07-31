package com.norops.hockeylan.exception;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;

    private MockHttpServletRequest request;

    @BeforeEach
    void setUp() {
        handler =
                new GlobalExceptionHandler();

        request =
                new MockHttpServletRequest(
                        "POST",
                        "/api/admin/loans"
                );
    }

    @Test
    void alreadyLoanedEquipmentGetsStableCode() {
        ApiErrorResponse body =
                requireBody(
                        handler.handleBusinessRule(
                                new BusinessRuleException(
                                        "Utrustningen är redan utlånad."
                                ),
                                request
                        )
                );

        assertEquals(
                ApiErrorCode
                        .EQUIPMENT_ALREADY_LOANED,
                body.code()
        );

        assertEquals(
                "Utrustningen är redan utlånad.",
                body.message()
        );

        assertTrue(
                body.fieldErrors().isEmpty()
        );
    }

    @Test
    void inactiveEquipmentGetsStableCode() {
        ApiErrorResponse body =
                requireBody(
                        handler.handleBusinessRule(
                                new BusinessRuleException(
                                        "Utrustningen är inaktiverad "
                                                + "och kan inte lånas."
                                ),
                                request
                        )
                );

        assertEquals(
                ApiErrorCode.EQUIPMENT_INACTIVE,
                body.code()
        );
    }

    @Test
    void returnedLoanGetsStableCode() {
        ApiErrorResponse body =
                requireBody(
                        handler.handleBusinessRule(
                                new BusinessRuleException(
                                        "Lånet är redan återlämnat."
                                ),
                                request
                        )
                );

        assertEquals(
                ApiErrorCode.LOAN_ALREADY_RETURNED,
                body.code()
        );
    }

    @Test
    void explicitBusinessCodeIsPreserved() {
        ApiErrorResponse body =
                requireBody(
                        handler.handleBusinessRule(
                                new BusinessRuleException(
                                        ApiErrorCode
                                                .EQUIPMENT_INACTIVE,
                                        "Utrustningen är inaktiverad "
                                                + "och kan inte lånas."
                                ),
                                request
                        )
                );

        assertEquals(
                ApiErrorCode.EQUIPMENT_INACTIVE,
                body.code()
        );
    }

    @Test
    void unknownBusinessMessageIsNotExposed() {
        String sensitiveMessage =
                "Borrower email is "
                        + "patrik@example.com";

        ApiErrorResponse body =
                requireBody(
                        handler.handleBusinessRule(
                                new BusinessRuleException(
                                        sensitiveMessage
                                ),
                                request
                        )
                );

        assertEquals(
                ApiErrorCode
                        .BUSINESS_RULE_VIOLATION,
                body.code()
        );

        assertEquals(
                "Åtgärden kan inte genomföras "
                        + "i objektets nuvarande status.",
                body.message()
        );

        assertFalse(
                body.message().contains(
                        "patrik@example.com"
                )
        );
    }

    @Test
    void equipmentNotFoundGetsEquipmentCode() {
        ApiErrorResponse body =
                requireBody(
                        handler.handleNotFound(
                                new ResourceNotFoundException(
                                        "Equipment not found "
                                                + "with serial number: "
                                                + "UNKNOWN-001"
                                ),
                                request
                        )
                );

        assertEquals(
                ApiErrorCode.EQUIPMENT_NOT_FOUND,
                body.code()
        );

        assertEquals(
                "Utrustningen kunde inte hittas.",
                body.message()
        );
    }

    @Test
    void genericMissingResourceGetsGenericCode() {
        ApiErrorResponse body =
                requireBody(
                        handler.handleNotFound(
                                new ResourceNotFoundException(
                                        "Loan not found with id: 1"
                                ),
                                request
                        )
                );

        assertEquals(
                ApiErrorCode.RESOURCE_NOT_FOUND,
                body.code()
        );

        assertEquals(
                "Den begärda resursen "
                        + "kunde inte hittas.",
                body.message()
        );
    }

    @Test
    void explicitNotFoundCodeIsPreserved() {
        ApiErrorResponse body =
                requireBody(
                        handler.handleNotFound(
                                new ResourceNotFoundException(
                                        ApiErrorCode
                                                .EQUIPMENT_NOT_FOUND,
                                        "Internal equipment "
                                                + "lookup failed"
                                ),
                                request
                        )
                );

        assertEquals(
                ApiErrorCode.EQUIPMENT_NOT_FOUND,
                body.code()
        );
    }

    @Test
    void duplicateResourceGetsStableCode() {
        ApiErrorResponse body =
                requireBody(
                        handler.handleDuplicateResource(
                                new DuplicateResourceException(
                                        "Equipment with serial "
                                                + "number already exists"
                                ),
                                request
                        )
                );

        assertEquals(
                ApiErrorCode.DUPLICATE_RESOURCE,
                body.code()
        );

        assertEquals(
                "Det finns redan en resurs "
                        + "med samma unika uppgifter.",
                body.message()
        );
    }

    @Test
    void validationReturnsSwedishFieldErrors() {
        BeanPropertyBindingResult bindingResult =
                new BeanPropertyBindingResult(
                        new Object(),
                        "equipmentDTO"
                );

        bindingResult.addError(
                fieldError(
                        "equipmentDTO",
                        "serialNumber",
                        "NotBlank",
                        "Serial number is required"
                )
        );

        bindingResult.addError(
                fieldError(
                        "equipmentDTO",
                        "condition",
                        "NotNull",
                        "Equipment condition is required"
                )
        );

        ApiErrorResponse body =
                handleValidation(
                        bindingResult
                );

        assertEquals(
                ApiErrorCode.VALIDATION_FAILED,
                body.code()
        );

        assertEquals(
                "Kontrollera de markerade fälten.",
                body.message()
        );

        assertEquals(
                Map.of(
                        "serialNumber",
                        "Serienummer måste anges.",
                        "condition",
                        "Utrustningens skick måste anges."
                ),
                body.fieldErrors()
        );
    }

    @Test
    void requiredErrorIsPrioritizedBeforeSizeError() {
        BeanPropertyBindingResult bindingResult =
                new BeanPropertyBindingResult(
                        new Object(),
                        "equipmentDTO"
                );

        /*
         * Längdfelet läggs avsiktligt in först.
         * Handlern ska ändå prioritera NotBlank.
         */
        bindingResult.addError(
                fieldError(
                        "equipmentDTO",
                        "serialNumber",
                        "Size",
                        "Serial number must be "
                                + "between 2 and 50 characters"
                )
        );

        bindingResult.addError(
                fieldError(
                        "equipmentDTO",
                        "serialNumber",
                        "NotBlank",
                        "Serial number is required"
                )
        );

        ApiErrorResponse body =
                handleValidation(
                        bindingResult
                );

        assertEquals(
                1,
                body.fieldErrors().size()
        );

        assertEquals(
                "Serienummer måste anges.",
                body.fieldErrors().get(
                        "serialNumber"
                )
        );
    }

    @Test
    void firstEqualPriorityErrorForFieldIsRetained() {
        BeanPropertyBindingResult bindingResult =
                new BeanPropertyBindingResult(
                        new Object(),
                        "loanFormDTO"
                );

        bindingResult.addError(
                fieldError(
                        "loanFormDTO",
                        "email",
                        "NotBlank",
                        "Email is required"
                )
        );

        bindingResult.addError(
                fieldError(
                        "loanFormDTO",
                        "email",
                        "NotEmpty",
                        "Email must be valid"
                )
        );

        ApiErrorResponse body =
                handleValidation(
                        bindingResult
                );

        assertEquals(
                1,
                body.fieldErrors().size()
        );

        assertEquals(
                "E-post måste anges.",
                body.fieldErrors().get(
                        "email"
                )
        );
    }

    @Test
    void unknownValidationMessageIsNotExposed() {
        BeanPropertyBindingResult bindingResult =
                new BeanPropertyBindingResult(
                        new Object(),
                        "loanFormDTO"
                );

        bindingResult.addError(
                fieldError(
                        "loanFormDTO",
                        "borrowerName",
                        "Custom",
                        "Sensitive internal rule "
                                + "for patrik@example.com"
                )
        );

        ApiErrorResponse body =
                handleValidation(
                        bindingResult
                );

        assertEquals(
                "Värdet är ogiltigt.",
                body.fieldErrors().get(
                        "borrowerName"
                )
        );

        assertFalse(
                body.fieldErrors()
                        .get("borrowerName")
                        .contains(
                                "patrik@example.com"
                        )
        );
    }

    @Test
    void databaseExceptionMessageIsNotReturned() {
        String sensitiveMessage =
                "duplicate email "
                        + "patrik@example.com";

        ApiErrorResponse body =
                requireBody(
                        handler
                                .handleDataIntegrityViolation(
                                        new DataIntegrityViolationException(
                                                sensitiveMessage
                                        ),
                                        request
                                )
                );

        assertEquals(
                ApiErrorCode.DATA_CONFLICT,
                body.code()
        );

        assertEquals(
                "Begäran står i konflikt "
                        + "med befintliga data.",
                body.message()
        );

        assertFalse(
                body.message().contains(
                        "patrik@example.com"
                )
        );
    }

    @Test
    void genericExceptionMessageIsNotReturned() {
        String sensitiveMessage =
                "Failed to process phone "
                        + "+46701234567";

        ApiErrorResponse body =
                requireBody(
                        handler.handleGenericException(
                                new RuntimeException(
                                        sensitiveMessage
                                ),
                                request
                        )
                );

        assertEquals(
                ApiErrorCode.INTERNAL_SERVER_ERROR,
                body.code()
        );

        assertEquals(
                "Ett oväntat fel inträffade.",
                body.message()
        );

        assertFalse(
                body.message().contains(
                        "+46701234567"
                )
        );
    }

    @Test
    void responsePathRemovesControlCharacters() {
        request.setRequestURI(
                "/api/test\r\nInjected-Header"
        );

        ApiErrorResponse body =
                requireBody(
                        handler.handleGenericException(
                                new RuntimeException(
                                        "test"
                                ),
                                request
                        )
                );

        assertFalse(
                body.path().contains("\r")
        );

        assertFalse(
                body.path().contains("\n")
        );
    }

    @Test
    void responsePathIsLimitedToSafeLength() {
        request.setRequestURI(
                "/api/" + "a".repeat(300)
        );

        ApiErrorResponse body =
                requireBody(
                        handler.handleGenericException(
                                new RuntimeException(
                                        "test"
                                ),
                                request
                        )
                );

        assertEquals(
                200,
                body.path().length()
        );
    }

    @Test
    void fieldErrorsCanNeverBeNull() {
        ApiErrorResponse response =
                new ApiErrorResponse(
                        null,
                        500,
                        "Internal Server Error",
                        ApiErrorCode
                                .INTERNAL_SERVER_ERROR,
                        "Ett oväntat fel inträffade.",
                        "/api/test",
                        null
                );

        assertNotNull(
                response.fieldErrors()
        );

        assertTrue(
                response.fieldErrors().isEmpty()
        );
    }

    @Test
    void fieldErrorsAreImmutable() {
        ApiErrorResponse response =
                new ApiErrorResponse(
                        null,
                        400,
                        "Bad Request",
                        ApiErrorCode
                                .VALIDATION_FAILED,
                        "Kontrollera fälten.",
                        "/api/test",
                        Map.of(
                                "email",
                                "E-post måste anges."
                        )
                );

        assertThrows(
                UnsupportedOperationException.class,
                () ->
                        response
                                .fieldErrors()
                                .put(
                                        "name",
                                        "Namn måste anges."
                                )
        );
    }

    private ApiErrorResponse handleValidation(
            BeanPropertyBindingResult bindingResult
    ) {
        MethodArgumentNotValidException exception =
                new MethodArgumentNotValidException(
                        null,
                        bindingResult
                );

        return requireBody(
                handler.handleValidation(
                        exception,
                        request
                )
        );
    }

    private FieldError fieldError(
            String objectName,
            String field,
            String validationCode,
            String defaultMessage
    ) {
        return new FieldError(
                objectName,
                field,
                null,
                false,
                new String[]{
                        validationCode
                },
                null,
                defaultMessage
        );
    }

    private ApiErrorResponse requireBody(
            ResponseEntity<ApiErrorResponse> response
    ) {
        assertNotNull(response);
        assertNotNull(response.getBody());

        return response.getBody();
    }
}