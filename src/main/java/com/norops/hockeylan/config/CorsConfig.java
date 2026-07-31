package com.norops.hockeylan.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.net.URI;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource
    corsConfigurationSource(
            @Value(
                    "${app.cors.allowed-origins}"
            )
            String configuredOrigins
    ) {
        List<String> allowedOrigins =
                Arrays
                        .stream(
                                configuredOrigins
                                        .split(",")
                        )
                        .map(
                                String::trim
                        )
                        .filter(
                                origin ->
                                        !origin.isBlank()
                        )
                        .map(
                                this::validateAndNormalizeOrigin
                        )
                        .distinct()
                        .toList();

        if (allowedOrigins.isEmpty()) {
            throw new IllegalStateException(
                    "At least one explicit "
                            + "CORS origin must "
                            + "be configured"
            );
        }

        CorsConfiguration configuration =
                new CorsConfiguration();

        configuration.setAllowedOrigins(
                allowedOrigins
        );

        configuration.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "OPTIONS"
                )
        );

        configuration.setAllowedHeaders(
                List.of(
                        "Content-Type",
                        "Accept",
                        "X-XSRF-TOKEN"
                )
        );

        configuration.setExposedHeaders(
                List.of(
                        "Retry-After"
                )
        );

        configuration.setAllowCredentials(
                true
        );

        configuration.setMaxAge(
                600L
        );

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/api/**",
                configuration
        );

        return source;
    }

    private String validateAndNormalizeOrigin(
            String configuredOrigin
    ) {
        if (configuredOrigin.contains("*")) {
            throw new IllegalStateException(
                    "CORS wildcard origins "
                            + "are not permitted"
            );
        }

        URI origin;

        try {
            origin =
                    URI.create(
                            configuredOrigin
                    );
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException(
                    "Invalid CORS origin",
                    exception
            );
        }

        String scheme =
                origin.getScheme();

        boolean validScheme =
                "http".equalsIgnoreCase(
                        scheme
                )
                        || "https"
                        .equalsIgnoreCase(
                                scheme
                        );

        String path =
                origin.getPath();

        boolean rootPath =
                path == null
                        || path.isEmpty()
                        || "/".equals(
                        path
                );

        if (!validScheme
                || origin.getHost() == null
                || origin.getUserInfo() != null
                || !rootPath
                || origin.getQuery() != null
                || origin.getFragment() != null) {
            throw new IllegalStateException(
                    "CORS origins must be "
                            + "explicit HTTP(S) "
                            + "origins without "
                            + "paths, queries or "
                            + "fragments"
            );
        }

        String normalizedOrigin =
                scheme.toLowerCase(
                        Locale.ROOT
                )
                        + "://"
                        + origin
                        .getHost()
                        .toLowerCase(
                                Locale.ROOT
                        );

        if (origin.getPort() != -1) {
            normalizedOrigin +=
                    ":"
                            + origin
                            .getPort();
        }

        return normalizedOrigin;
    }
}