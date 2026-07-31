package com.norops.hockeylan.controller;

import com.norops.hockeylan.dto.AuthSessionResponse;
import com.norops.hockeylan.dto.CsrfTokenResponse;
import com.norops.hockeylan.dto.LoginRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager
            authenticationManager;

    private final SecurityContextRepository
            securityContextRepository;

    private final SessionAuthenticationStrategy
            sessionAuthenticationStrategy;

    @GetMapping("/csrf")
    public ResponseEntity<CsrfTokenResponse>
    csrf(
            CsrfToken csrfToken
    ) {
        CsrfTokenResponse response =
                new CsrfTokenResponse(
                        csrfToken.getToken(),
                        csrfToken.getHeaderName()
                );

        return noStoreResponse(
                response
        );
    }

    @GetMapping("/session")
    public ResponseEntity<AuthSessionResponse>
    session(
            Authentication authentication
    ) {
        boolean authenticated =
                authentication != null
                        && authentication
                        .isAuthenticated()
                        && !(authentication
                        instanceof
                        AnonymousAuthenticationToken);

        AuthSessionResponse response =
                new AuthSessionResponse(
                        authenticated,
                        authenticated
                                ? authentication
                                .getName()
                                : null
                );

        return noStoreResponse(
                response
        );
    }

    @PostMapping("/login")
    public ResponseEntity<AuthSessionResponse>
    login(
            @Valid
            @RequestBody
            LoginRequest loginRequest,

            HttpServletRequest request,

            HttpServletResponse response
    ) {
        Authentication authentication =
                authenticationManager
                        .authenticate(
                                UsernamePasswordAuthenticationToken
                                        .unauthenticated(
                                                loginRequest
                                                        .username()
                                                        .trim(),
                                                loginRequest
                                                        .password()
                                        )
                        );

        sessionAuthenticationStrategy
                .onAuthentication(
                        authentication,
                        request,
                        response
                );

        SecurityContext securityContext =
                SecurityContextHolder
                        .createEmptyContext();

        securityContext.setAuthentication(
                authentication
        );

        SecurityContextHolder.setContext(
                securityContext
        );

        securityContextRepository
                .saveContext(
                        securityContext,
                        request,
                        response
                );

        AuthSessionResponse authResponse =
                new AuthSessionResponse(
                        true,
                        authentication.getName()
                );

        return noStoreResponse(
                authResponse
        );
    }

    private <T> ResponseEntity<T>
    noStoreResponse(
            T body
    ) {
        return ResponseEntity
                .ok()
                .cacheControl(
                        CacheControl
                                .noStore()
                )
                .header(
                        HttpHeaders.PRAGMA,
                        "no-cache"
                )
                .body(
                        body
                );
    }
}