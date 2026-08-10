package com.norops.hockeylan.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BorrowerAliasSecurityIntegrationTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer POSTGRES =
            new PostgreSQLContainer(
                    "postgres:17-alpine"
            );

    @Autowired
    private MockMvc mockMvc;

    @Test
    void anonymousUserShouldNotAccessAliasList()
            throws Exception {
        mockMvc.perform(
                        get(
                                "/api/admin/borrower-aliases"
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
                        jsonPath("$.code")
                                .value(
                                        "AUTHENTICATION_REQUIRED"
                                )
                );
    }

    @Test
    void anonymousUserShouldNotAccessAliasDetails()
            throws Exception {
        mockMvc.perform(
                        get(
                                "/api/admin/borrower-aliases/1"
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
                        jsonPath("$.code")
                                .value(
                                        "AUTHENTICATION_REQUIRED"
                                )
                );
    }

    @Test
    void userWithoutAdminAuthorityShouldNotAccessAliases()
            throws Exception {
        mockMvc.perform(
                        get(
                                "/api/admin/borrower-aliases"
                        )
                                .with(
                                        user("test-user")
                                                .authorities(
                                                        new SimpleGrantedAuthority(
                                                                "USER"
                                                        )
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
                );
    }

    @Test
    void adminShouldAccessAliasList()
            throws Exception {
        mockMvc.perform(
                        get(
                                "/api/admin/borrower-aliases"
                        )
                                .with(
                                        user("test-admin")
                                                .authorities(
                                                        new SimpleGrantedAuthority(
                                                                "ADMIN"
                                                        )
                                                )
                                )
                )
                .andExpect(
                        status().isOk()
                )
                .andExpect(
                        jsonPath("$")
                                .isArray()
                );
    }
}