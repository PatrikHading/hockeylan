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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityIntegrationTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer POSTGRES =
            new PostgreSQLContainer(
                    "postgres:17-alpine"
            );

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
    void publicLoanGetEndpointRemainsAccessible()
            throws Exception {
        mockMvc.perform(
                        get(
                                "/api/loan/UNKNOWN"
                        )
                )
                .andExpect(
                        status().isNotFound()
                );
    }

    @Test
    void publicLoanPostEndpointNoLongerRegistersLoans()
            throws Exception {
        mockMvc.perform(
                        post(
                                "/api/loan/HELMET-001"
                        )
                                .with(csrf())
                                .contentType(
                                        MediaType.APPLICATION_JSON
                                )
                                .content(
                                        validLoanJson()
                                )
                )
                .andExpect(
                        status()
                                .isMethodNotAllowed()
                );
    }

    @Test
    void anonymousAdminEquipmentRequestReturns401()
            throws Exception {
        mockMvc.perform(
                        get(
                                "/api/admin/equipment"
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
                );
    }

    @Test
    void anonymousLoanHistoryRequestReturns401()
            throws Exception {
        mockMvc.perform(
                        get(
                                "/api/admin/loans"
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
                );
    }

    @Test
    void anonymousLoanRegistrationReturns401()
            throws Exception {
        mockMvc.perform(
                        post(
                                "/api/admin/loans/HELMET-001"
                        )
                                .with(csrf())
                                .contentType(
                                        MediaType.APPLICATION_JSON
                                )
                                .content(
                                        validLoanJson()
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
                );
    }

    @Test
    void authenticatedLoanRegistrationWithoutCsrfReturns403()
            throws Exception {
        MockHttpSession session =
                login();

        mockMvc.perform(
                        post(
                                "/api/admin/loans/HELMET-001"
                        )
                                .session(session)
                                .contentType(
                                        MediaType.APPLICATION_JSON
                                )
                                .content(
                                        validLoanJson()
                                )
                )
                .andExpect(
                        status().isForbidden()
                );
    }

    @Test
    void loginWithoutCsrfReturns403()
            throws Exception {
        mockMvc.perform(
                        post(
                                "/api/auth/login"
                        )
                                .contentType(
                                        MediaType.APPLICATION_JSON
                                )
                                .content(
                                        loginJson(
                                                "StrongTestPassword-123!"
                                        )
                                )
                )
                .andExpect(
                        status().isForbidden()
                );
    }

    @Test
    void invalidCredentialsReturn401()
            throws Exception {
        mockMvc.perform(
                        post(
                                "/api/auth/login"
                        )
                                .with(csrf())
                                .contentType(
                                        MediaType.APPLICATION_JSON
                                )
                                .content(
                                        loginJson(
                                                "wrong-password"
                                        )
                                )
                )
                .andExpect(
                        status()
                                .isUnauthorized()
                )
                .andExpect(
                        jsonPath("$.message")
                                .value(
                                        "Invalid username or password."
                                )
                );
    }

    @Test
    void authenticatedSessionCanAccessAdminEquipmentEndpoint()
            throws Exception {
        MockHttpSession session =
                login();

        mockMvc.perform(
                        get(
                                "/api/admin/equipment"
                        )
                                .session(session)
                )
                .andExpect(
                        status().isOk()
                );
    }

    @Test
    void authenticatedSessionCanAccessLoanHistoryEndpoint()
            throws Exception {
        MockHttpSession session =
                login();

        mockMvc.perform(
                        get(
                                "/api/admin/loans"
                        )
                                .session(session)
                )
                .andExpect(
                        status().isOk()
                )
                .andExpect(
                        jsonPath("$.content")
                                .isArray()
                )
                .andExpect(
                        jsonPath("$.content")
                                .isEmpty()
                )
                .andExpect(
                        jsonPath("$.page")
                                .value(0)
                )
                .andExpect(
                        jsonPath(
                                "$.totalElements"
                        ).value(0)
                );
    }

    @Test
    void logoutInvalidatesAdministratorSession()
            throws Exception {
        MockHttpSession session =
                login();

        mockMvc.perform(
                        post(
                                "/api/auth/logout"
                        )
                                .session(session)
                                .with(csrf())
                )
                .andExpect(
                        status().isNoContent()
                );

        assertTrue(
                session.isInvalid()
        );

        mockMvc.perform(
                        get(
                                "/api/admin/equipment"
                        )
                )
                .andExpect(
                        status().isUnauthorized()
                );
    }

    @Test
    void anonymousReturnRequestReturns401()
            throws Exception {
        mockMvc.perform(
                        put(
                                "/api/admin/loans/10/returned"
                        )
                                .with(csrf())
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
                );
    }

    @Test
    void authenticatedReturnWithoutCsrfReturns403()
            throws Exception {
        MockHttpSession session =
                login();

        mockMvc.perform(
                        put(
                                "/api/admin/loans/10/returned"
                        )
                                .session(session)
                )
                .andExpect(
                        status().isForbidden()
                );
    }

    private MockHttpSession login()
            throws Exception {
        MvcResult result =
                mockMvc.perform(
                                post(
                                        "/api/auth/login"
                                )
                                        .with(csrf())
                                        .contentType(
                                                MediaType.APPLICATION_JSON
                                        )
                                        .content(
                                                loginJson(
                                                        "StrongTestPassword-123!"
                                                )
                                        )
                        )
                        .andExpect(
                                status().isOk()
                        )
                        .andExpect(
                                jsonPath(
                                        "$.authenticated"
                                ).value(true)
                        )
                        .andExpect(
                                jsonPath(
                                        "$.username"
                                ).value(
                                        "test-admin"
                                )
                        )
                        .andReturn();

        return (MockHttpSession)
                result
                        .getRequest()
                        .getSession(false);
    }

    private String loginJson(
            String password
    ) {
        return """
                {
                  "username": "test-admin",
                  "password": "%s"
                }
                """.formatted(password);
    }

    private String validLoanJson() {
        return """
                {
                  "borrowerName": "Patrik Hading",
                  "email": "patrik@example.com",
                  "phoneNumber": "+46701234567",
                  "expectedReturnDate": "2030-06-01"
                }
                """;
    }
}