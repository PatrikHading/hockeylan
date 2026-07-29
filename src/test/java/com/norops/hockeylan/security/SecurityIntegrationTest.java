package com.norops.hockeylan.security;

import com.norops.hockeylan.model.Admin;
import com.norops.hockeylan.repository.AdminRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityIntegrationTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer POSTGRES =
            new PostgreSQLContainer("postgres:17-alpine");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        adminRepository.deleteAllInBatch();

        adminRepository.saveAndFlush(
                new Admin(
                        "test-admin",
                        passwordEncoder.encode(
                                "StrongTestPassword-123!"
                        )
                )
        );
    }

    @Test
    void publicEquipmentEndpointRemainsAccessible()
            throws Exception {
        mockMvc.perform(get("/api/equipment/types"))
                .andExpect(status().isOk());
    }

    @Test
    void publicLoanEndpointIsNotRejectedAsUnauthorized()
            throws Exception {
        mockMvc.perform(get("/api/loan/UNKNOWN"))
                .andExpect(status().isNotFound());
    }

    @Test
    void anonymousAdminEquipmentRequestReturns401()
            throws Exception {
        mockMvc.perform(get("/api/admin/equipment"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(
                        jsonPath("$.error")
                                .value("Unauthorized")
                );
    }

    @Test
    void anonymousActiveLoanRequestReturns401()
            throws Exception {
        mockMvc.perform(get("/api/admin/loans/active"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(
                        jsonPath("$.error")
                                .value("Unauthorized")
                );
    }

    @Test
    void loginWithoutCsrfReturns403()
            throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "test-admin",
                                  "password": "StrongTestPassword-123!"
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void invalidCredentialsReturn401()
            throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "test-admin",
                                  "password": "wrong-password"
                                }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(
                        jsonPath("$.message")
                                .value("Invalid username or password.")
                );
    }

    @Test
    void authenticatedSessionCanAccessAdminEquipmentEndpoint()
            throws Exception {
        MockHttpSession session = login();

        mockMvc.perform(get("/api/admin/equipment")
                        .session(session))
                .andExpect(status().isOk());
    }

    @Test
    void authenticatedSessionCanAccessActiveLoansEndpoint()
            throws Exception {
        MockHttpSession session = login();

        mockMvc.perform(get("/api/admin/loans/active")
                        .session(session))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }

    @Test
    void logoutInvalidatesAdministratorSession()
            throws Exception {
        MockHttpSession session = login();

        mockMvc.perform(post("/api/auth/logout")
                        .session(session)
                        .with(csrf()))
                .andExpect(status().isNoContent());

        assertTrue(session.isInvalid());

        mockMvc.perform(get("/api/admin/equipment"))
                .andExpect(status().isUnauthorized());
    }

    private MockHttpSession login() throws Exception {
        MvcResult result =
                mockMvc.perform(post("/api/auth/login")
                                .with(csrf())
                                .contentType(
                                        MediaType.APPLICATION_JSON
                                )
                                .content("""
                                        {
                                          "username": "test-admin",
                                          "password": "StrongTestPassword-123!"
                                        }
                                        """))
                        .andExpect(status().isOk())
                        .andExpect(
                                jsonPath("$.authenticated")
                                        .value(true)
                        )
                        .andExpect(
                                jsonPath("$.username")
                                        .value("test-admin")
                        )
                        .andReturn();

        return (MockHttpSession) result
                .getRequest()
                .getSession(false);
    }
}