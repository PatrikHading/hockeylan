package com.norops.hockeylan.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class CorsConfigTest {

    private final CorsConfig corsConfig =
            new CorsConfig();

    @Test
    void createsExplicitNormalizedOriginAllowlist() {
        CorsConfigurationSource source =
                corsConfig
                        .corsConfigurationSource(
                                "http://LOCALHOST:5173/, "
                                        + "https://app.example.com"
                        );

        MockHttpServletRequest request =
                new MockHttpServletRequest(
                        "OPTIONS",
                        "/api/auth/login"
                );

        CorsConfiguration configuration =
                source.getCorsConfiguration(
                        request
                );

        assertEquals(
                List.of(
                        "http://localhost:5173",
                        "https://app.example.com"
                ),
                configuration
                        .getAllowedOrigins()
        );

        assertEquals(
                Boolean.TRUE,
                configuration
                        .getAllowCredentials()
        );

        assertEquals(
                List.of(
                        "Retry-After"
                ),
                configuration
                        .getExposedHeaders()
        );
    }

    @Test
    void rejectsWildcardOrigin() {
        assertThrows(
                IllegalStateException.class,
                () ->
                        corsConfig
                                .corsConfigurationSource(
                                        "https://*.example.com"
                                )
        );
    }

    @Test
    void rejectsOriginContainingPath() {
        assertThrows(
                IllegalStateException.class,
                () ->
                        corsConfig
                                .corsConfigurationSource(
                                        "https://app.example.com/admin"
                                )
        );
    }

    @Test
    void rejectsEmptyOriginList() {
        assertThrows(
                IllegalStateException.class,
                () ->
                        corsConfig
                                .corsConfigurationSource(
                                        " , "
                                )
        );
    }
}