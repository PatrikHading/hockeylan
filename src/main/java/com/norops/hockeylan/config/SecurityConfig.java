package com.norops.hockeylan.config;

import com.norops.hockeylan.security.RestAccessDeniedHandler;
import com.norops.hockeylan.security.RestAuthenticationEntryPoint;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.session.ChangeSessionIdAuthenticationStrategy;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.security.web.header.writers.StaticHeadersWriter;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private static final long HSTS_MAX_AGE_SECONDS =
            31_536_000L;

    private final RestAuthenticationEntryPoint
            authenticationEntryPoint;

    private final RestAccessDeniedHandler
            accessDeniedHandler;

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            AuthenticationProvider authenticationProvider,
            @Value(
                    "${server.servlet.session.cookie.secure:false}"
            )
            boolean secureCookies
    ) throws Exception {
        CookieCsrfTokenRepository
                csrfTokenRepository =
                CookieCsrfTokenRepository
                        .withHttpOnlyFalse();

        csrfTokenRepository
                .setCookieCustomizer(
                        cookieBuilder ->
                                cookieBuilder
                                        .path("/")
                                        .httpOnly(
                                                false
                                        )
                                        .secure(
                                                secureCookies
                                        )
                                        .sameSite(
                                                "Strict"
                                        )
                );

        http
                .cors(
                        Customizer
                                .withDefaults()
                )
                .csrf(
                        csrf ->
                                csrf
                                        .spa()
                                        .csrfTokenRepository(
                                                csrfTokenRepository
                                        )
                )
                .authenticationProvider(
                        authenticationProvider
                )
                .securityContext(
                        context ->
                                context
                                        .securityContextRepository(
                                                securityContextRepository()
                                        )
                )
                .sessionManagement(
                        session ->
                                session
                                        .sessionCreationPolicy(
                                                SessionCreationPolicy
                                                        .IF_REQUIRED
                                        )
                                        .sessionFixation(
                                                fixation ->
                                                        fixation
                                                                .changeSessionId()
                                        )
                )
                .requestCache(
                        requestCache ->
                                requestCache
                                        .disable()
                )
                .headers(
                        headers ->
                                headers
                                        .contentTypeOptions(
                                                Customizer
                                                        .withDefaults()
                                        )
                                        .frameOptions(
                                                frameOptions ->
                                                        frameOptions
                                                                .deny()
                                        )
                                        .referrerPolicy(
                                                referrerPolicy ->
                                                        referrerPolicy
                                                                .policy(
                                                                        ReferrerPolicyHeaderWriter
                                                                                .ReferrerPolicy
                                                                                .NO_REFERRER
                                                                )
                                        )
                                        .httpStrictTransportSecurity(
                                                hsts ->
                                                        hsts
                                                                .includeSubDomains(
                                                                        true
                                                                )
                                                                .maxAgeInSeconds(
                                                                        HSTS_MAX_AGE_SECONDS
                                                                )
                                        )
                                        .addHeaderWriter(
                                                new StaticHeadersWriter(
                                                        "Permissions-Policy",
                                                        "camera=(), "
                                                                + "microphone=(), "
                                                                + "geolocation=()"
                                                )
                                        )
                )
                .authorizeHttpRequests(
                        authorize ->
                                authorize
                                        .requestMatchers(
                                                HttpMethod.OPTIONS,
                                                "/api/**"
                                        )
                                        .permitAll()
                                        .requestMatchers(
                                                HttpMethod.GET,
                                                "/api/auth/csrf",
                                                "/api/auth/session"
                                        )
                                        .permitAll()
                                        .requestMatchers(
                                                HttpMethod.POST,
                                                "/api/auth/login"
                                        )
                                        .permitAll()
                                        .requestMatchers(
                                                HttpMethod.GET,
                                                "/api/equipment/types"
                                        )
                                        .permitAll()
                                        .requestMatchers(
                                                HttpMethod.GET,
                                                "/api/loan/*"
                                        )
                                        .permitAll()
                                        .requestMatchers(
                                                "/api/admin/**"
                                        )
                                        .hasAuthority(
                                                "ADMIN"
                                        )
                                        .anyRequest()
                                        .denyAll()
                )
                .exceptionHandling(
                        exceptions ->
                                exceptions
                                        .authenticationEntryPoint(
                                                authenticationEntryPoint
                                        )
                                        .accessDeniedHandler(
                                                accessDeniedHandler
                                        )
                )
                .logout(
                        logout ->
                                logout
                                        .logoutUrl(
                                                "/api/auth/logout"
                                        )
                                        .invalidateHttpSession(
                                                true
                                        )
                                        .clearAuthentication(
                                                true
                                        )
                                        .deleteCookies(
                                                "JSESSIONID",
                                                "XSRF-TOKEN"
                                        )
                                        .logoutSuccessHandler(
                                                (
                                                        request,
                                                        response,
                                                        authentication
                                                ) -> {
                                                    response.setStatus(
                                                            HttpServletResponse
                                                                    .SC_NO_CONTENT
                                                    );

                                                    response.setContentType(
                                                            MediaType
                                                                    .APPLICATION_JSON_VALUE
                                                    );

                                                    response.setHeader(
                                                            HttpHeaders
                                                                    .CACHE_CONTROL,
                                                            "no-store"
                                                    );
                                                }
                                        )
                );

        return http.build();
    }

    @Bean
    public AuthenticationProvider
    authenticationProvider(
            UserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder
    ) {
        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider(
                        userDetailsService
                );

        provider.setPasswordEncoder(
                passwordEncoder
        );

        provider.setHideUserNotFoundExceptions(
                true
        );

        return provider;
    }

    @Bean
    public AuthenticationManager
    authenticationManager(
            AuthenticationConfiguration
                    authenticationConfiguration
    ) throws Exception {
        return authenticationConfiguration
                .getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(
                12
        );
    }

    @Bean
    public SecurityContextRepository
    securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    public SessionAuthenticationStrategy
    sessionAuthenticationStrategy() {
        return new ChangeSessionIdAuthenticationStrategy();
    }
}