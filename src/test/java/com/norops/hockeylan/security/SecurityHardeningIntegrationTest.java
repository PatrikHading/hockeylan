package com.norops.hockeylan.security;

import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityHardeningIntegrationTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer POSTGRES =
            new PostgreSQLContainer(
                    "postgres:17-alpine"
            );

    @Autowired
    private MockMvc mockMvc;

    @Test
    void csrfEndpointReturnsStrictNonHttpOnlyCookie()
            throws Exception {
        MvcResult result =
                mockMvc.perform(
                                get(
                                        "/api/auth/csrf"
                                )
                        )
                        .andExpect(
                                status().isOk()
                        )
                        .andExpect(
                                header().string(
                                        HttpHeaders
                                                .CACHE_CONTROL,
                                        "no-store"
                                )
                        )
                        .andExpect(
                                header().string(
                                        HttpHeaders.PRAGMA,
                                        "no-cache"
                                )
                        )
                        .andReturn();

        MockHttpServletResponse response =
                result.getResponse();

        Cookie csrfCookie =
                response.getCookie(
                        "XSRF-TOKEN"
                );

        assertNotNull(
                csrfCookie
        );

        assertEquals(
                "/",
                csrfCookie.getPath()
        );

        assertEquals(
                "Strict",
                csrfCookie.getAttribute(
                        "SameSite"
                )
        );

        assertFalse(
                csrfCookie.isHttpOnly()
        );

        assertFalse(
                csrfCookie.getSecure()
        );
    }

    @Test
    void sessionEndpointIsNotCacheable()
            throws Exception {
        mockMvc.perform(
                        get(
                                "/api/auth/session"
                        )
                )
                .andExpect(
                        status().isOk()
                )
                .andExpect(
                        header().string(
                                HttpHeaders
                                        .CACHE_CONTROL,
                                "no-store"
                        )
                )
                .andExpect(
                        header().string(
                                HttpHeaders.PRAGMA,
                                "no-cache"
                        )
                );
    }

    @Test
    void publicEndpointContainsSecurityHeaders()
            throws Exception {
        mockMvc.perform(
                        get(
                                "/api/equipment/types"
                        )
                )
                .andExpect(
                        status().isOk()
                )
                .andExpect(
                        header().string(
                                "X-Content-Type-Options",
                                "nosniff"
                        )
                )
                .andExpect(
                        header().string(
                                "X-Frame-Options",
                                "DENY"
                        )
                )
                .andExpect(
                        header().string(
                                "Referrer-Policy",
                                "no-referrer"
                        )
                )
                .andExpect(
                        header().string(
                                "Permissions-Policy",
                                "camera=(), "
                                        + "microphone=(), "
                                        + "geolocation=()"
                        )
                );
    }

    @Test
    void unknownApiEndpointIsNotAutomaticallyPublic()
            throws Exception {
        mockMvc.perform(
                        get(
                                "/api/not-allowed"
                        )
                )
                .andExpect(
                        status().isUnauthorized()
                )
                .andExpect(
                        jsonPath("$.status")
                                .value(401)
                )
                .andExpect(
                        jsonPath("$.error")
                                .value(
                                        "Unauthorized"
                                )
                )
                .andExpect(
                        jsonPath("$.code")
                                .value(
                                        "AUTHENTICATION_REQUIRED"
                                )
                )
                .andExpect(
                        jsonPath("$.message")
                                .value(
                                        "Du behöver logga in "
                                                + "som administratör."
                                )
                )
                .andExpect(
                        jsonPath("$.path")
                                .value(
                                        "/api/not-allowed"
                                )
                )
                .andExpect(
                        jsonPath("$.fieldErrors")
                                .isEmpty()
                )
                .andExpect(
                        header().string(
                                HttpHeaders
                                        .CACHE_CONTROL,
                                "no-store"
                        )
                );
    }

    @Test
    void publicEquipmentEndpointRemainsAccessible()
            throws Exception {
        mockMvc.perform(
                        get(
                                "/api/equipment/types"
                        )
                )
                .andExpect(
                        status().isOk()
                );
    }

    @Test
    void authenticatedAdminPostWithoutCsrfIsForbidden()
            throws Exception {
        mockMvc.perform(
                        post(
                                "/api/admin/equipment"
                        )
                                .with(
                                        user(
                                                "test-admin"
                                        )
                                                .authorities(
                                                        () ->
                                                                "ADMIN"
                                                )
                                )
                )
                .andExpect(
                        status().isForbidden()
                )
                .andExpect(
                        jsonPath("$.status")
                                .value(403)
                )
                .andExpect(
                        jsonPath("$.error")
                                .value(
                                        "Forbidden"
                                )
                )
                .andExpect(
                        jsonPath("$.code")
                                .value(
                                        "ACCESS_DENIED"
                                )
                )
                .andExpect(
                        jsonPath("$.message")
                                .value(
                                        "Du saknar behörighet "
                                                + "för åtgärden."
                                )
                )
                .andExpect(
                        jsonPath("$.fieldErrors")
                                .isEmpty()
                );
    }

    @Test
    void authenticatedLogoutWithoutCsrfIsForbidden()
            throws Exception {
        mockMvc.perform(
                        post(
                                "/api/auth/logout"
                        )
                                .with(
                                        user(
                                                "test-admin"
                                        )
                                                .authorities(
                                                        () ->
                                                                "ADMIN"
                                                )
                                )
                )
                .andExpect(
                        status().isForbidden()
                )
                .andExpect(
                        jsonPath("$.status")
                                .value(403)
                )
                .andExpect(
                        jsonPath("$.code")
                                .value(
                                        "ACCESS_DENIED"
                                )
                )
                .andExpect(
                        jsonPath("$.message")
                                .value(
                                        "Du saknar behörighet "
                                                + "för åtgärden."
                                )
                )
                .andExpect(
                        jsonPath("$.fieldErrors")
                                .isEmpty()
                );
    }

    @Test
    void anonymousLogoutWithoutCsrfIsForbidden()
            throws Exception {
        mockMvc.perform(
                        post(
                                "/api/auth/logout"
                        )
                )
                .andExpect(
                        status().isForbidden()
                )
                .andExpect(
                        jsonPath("$.status")
                                .value(403)
                )
                .andExpect(
                        jsonPath("$.code")
                                .value(
                                        "ACCESS_DENIED"
                                )
                )
                .andExpect(
                        jsonPath("$.message")
                                .value(
                                        "Du saknar behörighet "
                                                + "för åtgärden."
                                )
                )
                .andExpect(
                        jsonPath("$.fieldErrors")
                                .isEmpty()
                );
    }

    @Test
    void anonymousLogoutWithCsrfIsIdempotent()
            throws Exception {
        mockMvc.perform(
                        post(
                                "/api/auth/logout"
                        )
                                .with(csrf())
                )
                .andExpect(
                        status().isNoContent()
                )
                .andExpect(
                        header().string(
                                HttpHeaders
                                        .CACHE_CONTROL,
                                "no-store"
                        )
                );
    }
}