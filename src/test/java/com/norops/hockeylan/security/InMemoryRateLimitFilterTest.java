package com.norops.hockeylan.security;

import com.norops.hockeylan.exception.ApiErrorCode;
import com.norops.hockeylan.exception.ApiErrorResponse;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import tools.jackson.databind.ObjectMapper;

import java.io.PrintWriter;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

class InMemoryRateLimitFilterTest {

    private RateLimitProperties properties;

    private ObjectMapper objectMapper;

    private FilterChain filterChain;

    private InMemoryRateLimitFilter filter;

    private ApiErrorResponse
            writtenErrorResponse;

    @BeforeEach
    void setUp() throws Exception {
        properties =
                new RateLimitProperties();

        properties.setEnabled(
                true
        );

        properties.setApiCapacity(
                3
        );

        properties.setApiRefillTokens(
                3
        );

        properties.setApiRefillPeriodSeconds(
                3600
        );

        properties.setLoginCapacity(
                2
        );

        properties.setLoginRefillTokens(
                2
        );

        properties.setLoginRefillPeriodSeconds(
                300
        );

        properties.setIdleEntryTtlSeconds(
                900
        );

        properties.setMaxEntries(
                100
        );

        objectMapper =
                mock(
                        ObjectMapper.class
                );

        doAnswer(invocation -> {
            PrintWriter writer =
                    invocation.getArgument(
                            0
                    );

            writtenErrorResponse =
                    invocation.getArgument(
                            1
                    );

            writer.write(
                    """
                    {
                      "status": 429,
                      "error": "Too Many Requests",
                      "code": "RATE_LIMIT_EXCEEDED",
                      "message": "För många anrop. Försök igen senare.",
                      "path": "/api/auth/login",
                      "fieldErrors": {}
                    }
                    """
            );

            writer.flush();

            return null;
        }).when(objectMapper)
                .writeValue(
                        any(PrintWriter.class),
                        any(ApiErrorResponse.class)
                );

        filterChain =
                mock(
                        FilterChain.class
                );

        filter =
                new InMemoryRateLimitFilter(
                        properties,
                        objectMapper
                );
    }

    @Test
    void blocksLoginAfterLoginCapacityIsConsumed()
            throws Exception {
        MockHttpServletResponse firstResponse =
                performRequest(
                        "/api/auth/login",
                        "POST",
                        "198.51.100.10",
                        null
                );

        MockHttpServletResponse secondResponse =
                performRequest(
                        "/api/auth/login",
                        "POST",
                        "198.51.100.10",
                        null
                );

        MockHttpServletResponse thirdResponse =
                performRequest(
                        "/api/auth/login",
                        "POST",
                        "198.51.100.10",
                        null
                );

        assertEquals(
                200,
                firstResponse.getStatus()
        );

        assertEquals(
                200,
                secondResponse.getStatus()
        );

        assertEquals(
                429,
                thirdResponse.getStatus()
        );

        assertEquals(
                "300",
                thirdResponse.getHeader(
                        HttpHeaders.RETRY_AFTER
                )
        );

        assertEquals(
                "no-store",
                thirdResponse.getHeader(
                        HttpHeaders.CACHE_CONTROL
                )
        );

        assertTrue(
                MediaType.APPLICATION_JSON
                        .isCompatibleWith(
                                MediaType.parseMediaType(
                                        thirdResponse
                                                .getContentType()
                                )
                        )
        );

        assertNotNull(
                writtenErrorResponse
        );

        assertEquals(
                429,
                writtenErrorResponse.status()
        );

        assertEquals(
                "Too Many Requests",
                writtenErrorResponse.error()
        );

        assertEquals(
                ApiErrorCode
                        .RATE_LIMIT_EXCEEDED,
                writtenErrorResponse.code()
        );

        assertEquals(
                "För många anrop. "
                        + "Försök igen senare.",
                writtenErrorResponse.message()
        );

        assertEquals(
                "/api/auth/login",
                writtenErrorResponse.path()
        );

        assertTrue(
                writtenErrorResponse
                        .fieldErrors()
                        .isEmpty()
        );
    }

    @Test
    void keepsSeparateLoginBucketsForDifferentClients()
            throws Exception {
        performRequest(
                "/api/auth/login",
                "POST",
                "198.51.100.20",
                null
        );

        performRequest(
                "/api/auth/login",
                "POST",
                "198.51.100.20",
                null
        );

        MockHttpServletResponse
                otherClientResponse =
                performRequest(
                        "/api/auth/login",
                        "POST",
                        "198.51.100.21",
                        null
                );

        assertEquals(
                200,
                otherClientResponse.getStatus()
        );
    }

    @Test
    void keepsLoginAndApiBucketsSeparate()
            throws Exception {
        performRequest(
                "/api/auth/login",
                "POST",
                "198.51.100.30",
                null
        );

        performRequest(
                "/api/auth/login",
                "POST",
                "198.51.100.30",
                null
        );

        MockHttpServletResponse apiResponse =
                performRequest(
                        "/api/equipment/types",
                        "GET",
                        "198.51.100.30",
                        null
                );

        assertEquals(
                200,
                apiResponse.getStatus()
        );
    }

    @Test
    void ignoresClientSuppliedForwardedForHeader()
            throws Exception {
        performRequest(
                "/api/auth/login",
                "POST",
                "203.0.113.40",
                "198.51.100.1"
        );

        performRequest(
                "/api/auth/login",
                "POST",
                "203.0.113.40",
                "198.51.100.2"
        );

        MockHttpServletResponse thirdResponse =
                performRequest(
                        "/api/auth/login",
                        "POST",
                        "203.0.113.40",
                        "198.51.100.3"
                );

        assertEquals(
                429,
                thirdResponse.getStatus()
        );

        assertNotNull(
                writtenErrorResponse
        );

        assertEquals(
                ApiErrorCode
                        .RATE_LIMIT_EXCEEDED,
                writtenErrorResponse.code()
        );
    }

    @Test
    void fallsBackToSafePathForControlCharacters()
            throws Exception {
        performRequest(
                "/api/auth/login\r\nInjected",
                "POST",
                "203.0.113.45",
                null
        );

        performRequest(
                "/api/auth/login\r\nInjected",
                "POST",
                "203.0.113.45",
                null
        );

        /*
         * Den manipulerade sökvägen räknas inte som
         * login-endpoint och använder därför API-bucketen.
         * Två ytterligare anrop krävs för att nå gränsen.
         */
        performRequest(
                "/api/auth/login\r\nInjected",
                "POST",
                "203.0.113.45",
                null
        );

        MockHttpServletResponse blockedResponse =
                performRequest(
                        "/api/auth/login\r\nInjected",
                        "POST",
                        "203.0.113.45",
                        null
                );

        assertEquals(
                429,
                blockedResponse.getStatus()
        );

        assertNotNull(
                writtenErrorResponse
        );

        assertEquals(
                "/api",
                writtenErrorResponse.path()
        );
    }

    @Test
    void allowsRequestWhenRateLimitingIsDisabled()
            throws Exception {
        properties.setEnabled(
                false
        );

        MockHttpServletRequest request =
                request(
                        "/api/auth/login",
                        "POST",
                        "198.51.100.50",
                        null
                );

        MockHttpServletResponse response =
                new MockHttpServletResponse();

        assertTrue(
                filter.shouldNotFilter(
                        request
                )
        );

        filter.doFilter(
                request,
                response,
                filterChain
        );

        assertEquals(
                200,
                response.getStatus()
        );

        verify(
                filterChain
        ).doFilter(
                request,
                response
        );

        verify(
                objectMapper,
                never()
        ).writeValue(
                any(PrintWriter.class),
                any(ApiErrorResponse.class)
        );
    }

    private MockHttpServletResponse
    performRequest(
            String requestUri,
            String method,
            String remoteAddress,
            String forwardedFor
    ) throws Exception {
        MockHttpServletRequest request =
                request(
                        requestUri,
                        method,
                        remoteAddress,
                        forwardedFor
                );

        MockHttpServletResponse response =
                new MockHttpServletResponse();

        filter.doFilter(
                request,
                response,
                filterChain
        );

        return response;
    }

    private MockHttpServletRequest request(
            String requestUri,
            String method,
            String remoteAddress,
            String forwardedFor
    ) {
        MockHttpServletRequest request =
                new MockHttpServletRequest();

        request.setRequestURI(
                requestUri
        );

        request.setMethod(
                method
        );

        request.setRemoteAddr(
                remoteAddress
        );

        if (forwardedFor != null) {
            request.addHeader(
                    "X-Forwarded-For",
                    forwardedFor
            );
        }

        return request;
    }
}