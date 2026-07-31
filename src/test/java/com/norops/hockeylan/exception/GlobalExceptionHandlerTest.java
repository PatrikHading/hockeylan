package com.norops.hockeylan.exception;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;

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
    void knownBusinessMessageRemainsAvailable() {
        ResponseEntity<ApiErrorResponse> response =
                handler.handleBusinessRule(
                        new BusinessRuleException(
                                "Utrustningen är redan utlånad."
                        ),
                        request
                );

        assertEquals(
                409,
                response.getStatusCode().value()
        );

        assertNotNull(
                response.getBody()
        );

        assertEquals(
                "Utrustningen är redan utlånad.",
                response
                        .getBody()
                        .message()
        );
    }

    @Test
    void unknownBusinessMessageIsNotExposed() {
        String sensitiveMessage =
                "Borrower email is "
                        + "patrik@example.com";

        ResponseEntity<ApiErrorResponse> response =
                handler.handleBusinessRule(
                        new BusinessRuleException(
                                sensitiveMessage
                        ),
                        request
                );

        assertNotNull(
                response.getBody()
        );

        assertEquals(
                "Åtgärden kan inte genomföras "
                        + "i objektets nuvarande status.",
                response
                        .getBody()
                        .message()
        );

        assertFalse(
                response
                        .getBody()
                        .message()
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

        ResponseEntity<ApiErrorResponse> response =
                handler
                        .handleDataIntegrityViolation(
                                new DataIntegrityViolationException(
                                        sensitiveMessage
                                ),
                                request
                        );

        assertNotNull(
                response.getBody()
        );

        assertEquals(
                "Request conflicts with existing data.",
                response
                        .getBody()
                        .message()
        );

        assertFalse(
                response
                        .getBody()
                        .message()
                        .contains(
                                "patrik@example.com"
                        )
        );
    }

    @Test
    void genericExceptionMessageIsNotReturned() {
        String sensitiveMessage =
                "Failed to process phone "
                        + "+46701234567";

        ResponseEntity<ApiErrorResponse> response =
                handler.handleGenericException(
                        new RuntimeException(
                                sensitiveMessage
                        ),
                        request
                );

        assertNotNull(
                response.getBody()
        );

        assertEquals(
                "Ett oväntat fel inträffade.",
                response
                        .getBody()
                        .message()
        );

        assertFalse(
                response
                        .getBody()
                        .message()
                        .contains(
                                "+46701234567"
                        )
        );
    }

    @Test
    void responsePathRemovesControlCharacters() {
        request.setRequestURI(
                "/api/test\r\nInjected-Header"
        );

        ResponseEntity<ApiErrorResponse> response =
                handler.handleGenericException(
                        new RuntimeException(
                                "test"
                        ),
                        request
                );

        assertNotNull(
                response.getBody()
        );

        assertFalse(
                response
                        .getBody()
                        .path()
                        .contains(
                                "\r"
                        )
        );

        assertFalse(
                response
                        .getBody()
                        .path()
                        .contains(
                                "\n"
                        )
        );
    }
}