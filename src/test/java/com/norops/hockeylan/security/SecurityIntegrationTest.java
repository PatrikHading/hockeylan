package com.norops.hockeylan.security;

import com.norops.hockeylan.model.Admin;
import com.norops.hockeylan.model.AgeCategory;
import com.norops.hockeylan.model.Equipment;
import com.norops.hockeylan.model.EquipmentCondition;
import com.norops.hockeylan.model.EquipmentType;
import com.norops.hockeylan.model.Loan;
import com.norops.hockeylan.repository.AdminRepository;
import com.norops.hockeylan.repository.EquipmentRepository;
import com.norops.hockeylan.repository.LoanRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
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
    private EquipmentRepository
            equipmentRepository;

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        loanRepository.deleteAllInBatch();
        equipmentRepository.deleteAllInBatch();
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
                )
                .andExpect(
                        jsonPath("$.status")
                                .value(404)
                )
                .andExpect(
                        jsonPath("$.code")
                                .value(
                                        "EQUIPMENT_NOT_FOUND"
                                )
                )
                .andExpect(
                        jsonPath("$.message")
                                .value(
                                        "Utrustningen kunde inte hittas."
                                )
                );
    }

    @Test
    void anonymousPublicLoanPostIsRejected()
            throws Exception {
        mockMvc.perform(
                        post(
                                "/api/loan/HELMET-001"
                        )
                                .with(csrf())
                                .contentType(
                                        MediaType
                                                .APPLICATION_JSON
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
                                        "/api/loan/HELMET-001"
                                )
                )
                .andExpect(
                        jsonPath("$.fieldErrors")
                                .isEmpty()
                )
                .andExpect(
                        header().string(
                                HttpHeaders.CACHE_CONTROL,
                                "no-store"
                        )
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
                                        "/api/admin/equipment"
                                )
                )
                .andExpect(
                        jsonPath("$.fieldErrors")
                                .isEmpty()
                )
                .andExpect(
                        header().string(
                                HttpHeaders.CACHE_CONTROL,
                                "no-store"
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
                        jsonPath("$.fieldErrors")
                                .isEmpty()
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
                                        MediaType
                                                .APPLICATION_JSON
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
                        jsonPath("$.fieldErrors")
                                .isEmpty()
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
                                        MediaType
                                                .APPLICATION_JSON
                                )
                                .content(
                                        validLoanJson()
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
    void loginWithoutCsrfReturns403()
            throws Exception {
        mockMvc.perform(
                        post(
                                "/api/auth/login"
                        )
                                .contentType(
                                        MediaType
                                                .APPLICATION_JSON
                                )
                                .content(
                                        loginJson(
                                                "StrongTestPassword-123!"
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
    void invalidCredentialsReturn401()
            throws Exception {
        mockMvc.perform(
                        post(
                                "/api/auth/login"
                        )
                                .with(csrf())
                                .contentType(
                                        MediaType
                                                .APPLICATION_JSON
                                )
                                .content(
                                        loginJson(
                                                "wrong-password"
                                        )
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
                                        "INVALID_CREDENTIALS"
                                )
                )
                .andExpect(
                        jsonPath("$.message")
                                .value(
                                        "Felaktigt användarnamn "
                                                + "eller lösenord."
                                )
                )
                .andExpect(
                        jsonPath("$.path")
                                .value(
                                        "/api/auth/login"
                                )
                )
                .andExpect(
                        jsonPath("$.fieldErrors")
                                .isEmpty()
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
    void authenticatedAdministratorCanCompleteFullLoanLifecycle()
            throws Exception {
        Equipment equipment =
                equipmentRepository
                        .saveAndFlush(
                                new Equipment(
                                        EquipmentType
                                                .HELMET,
                                        "FLOW-HELMET-001",
                                        "M",
                                        "Bauer",
                                        "Re-Akt 150",
                                        EquipmentCondition
                                                .GOOD,
                                        AgeCategory
                                                .JUNIOR,
                                        "Hylla A2",
                                        "Hjälm för komplett "
                                                + "flödestest"
                                )
                        );

        MockHttpSession session =
                login();

        MvcResult registrationResult =
                mockMvc.perform(
                                post(
                                        "/api/admin/loans/{serialNumber}",
                                        equipment
                                                .getSerialNumber()
                                )
                                        .session(session)
                                        .with(csrf())
                                        .contentType(
                                                MediaType
                                                        .APPLICATION_JSON
                                        )
                                        .content(
                                                validLoanJson()
                                        )
                        )
                        .andExpect(
                                status().isCreated()
                        )
                        .andExpect(
                                jsonPath("$.id")
                                        .isNumber()
                        )
                        .andExpect(
                                jsonPath(
                                        "$.equipment.serialNumber"
                                ).value(
                                        "FLOW-HELMET-001"
                                )
                        )
                        .andExpect(
                                jsonPath(
                                        "$.borrowerName"
                                ).value(
                                        "Patrik Hading"
                                )
                        )
                        .andExpect(
                                jsonPath("$.returned")
                                        .value(false)
                        )
                        .andReturn();

        JsonNode registrationJson =
                objectMapper.readTree(
                        registrationResult
                                .getResponse()
                                .getContentAsString()
                );

        long loanId =
                registrationJson
                        .get("id")
                        .longValue();

        mockMvc.perform(
                        get(
                                "/api/loan/{serialNumber}",
                                equipment
                                        .getSerialNumber()
                        )
                )
                .andExpect(
                        status().isOk()
                )
                .andExpect(
                        jsonPath("$.available")
                                .value(false)
                )
                .andExpect(
                        jsonPath("$.active")
                                .value(true)
                );

        mockMvc.perform(
                        get(
                                "/api/admin/loans"
                        )
                                .session(session)
                                .param(
                                        "status",
                                        "ACTIVE"
                                )
                )
                .andExpect(
                        status().isOk()
                )
                .andExpect(
                        jsonPath(
                                "$.totalElements"
                        ).value(1)
                )
                .andExpect(
                        jsonPath(
                                "$.content[0].id"
                        ).value(loanId)
                )
                .andExpect(
                        jsonPath(
                                "$.content[0].returned"
                        ).value(false)
                );

        mockMvc.perform(
                        put(
                                "/api/admin/loans/{loanId}/returned",
                                loanId
                        )
                                .session(session)
                                .with(csrf())
                )
                .andExpect(
                        status().isOk()
                )
                .andExpect(
                        jsonPath("$.id")
                                .value(loanId)
                )
                .andExpect(
                        jsonPath("$.returned")
                                .value(true)
                )
                .andExpect(
                        jsonPath("$.returnedAt")
                                .isNotEmpty()
                );

        mockMvc.perform(
                        get(
                                "/api/loan/{serialNumber}",
                                equipment
                                        .getSerialNumber()
                        )
                )
                .andExpect(
                        status().isOk()
                )
                .andExpect(
                        jsonPath("$.available")
                                .value(true)
                );

        mockMvc.perform(
                        get(
                                "/api/admin/loans"
                        )
                                .session(session)
                                .param(
                                        "status",
                                        "RETURNED"
                                )
                )
                .andExpect(
                        status().isOk()
                )
                .andExpect(
                        jsonPath(
                                "$.totalElements"
                        ).value(1)
                )
                .andExpect(
                        jsonPath(
                                "$.content[0].id"
                        ).value(loanId)
                )
                .andExpect(
                        jsonPath(
                                "$.content[0].returned"
                        ).value(true)
                );

        Equipment updatedEquipment =
                equipmentRepository
                        .findById(
                                equipment.getId()
                        )
                        .orElseThrow();

        Loan returnedLoan =
                loanRepository
                        .findById(loanId)
                        .orElseThrow();

        assertThat(
                updatedEquipment.isAvailable()
        ).isTrue();

        assertThat(
                returnedLoan.isReturned()
        ).isTrue();

        assertThat(
                returnedLoan.getReturnedAt()
        ).isNotNull();
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
                        jsonPath("$.fieldErrors")
                                .isEmpty()
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

    private MockHttpSession login()
            throws Exception {
        MvcResult result =
                mockMvc.perform(
                                post(
                                        "/api/auth/login"
                                )
                                        .with(csrf())
                                        .contentType(
                                                MediaType
                                                        .APPLICATION_JSON
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
                                jsonPath("$.username")
                                        .value(
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
                  "expectedReturnDate": "%s"
                }
                """.formatted(
                LocalDate
                        .now()
                        .plusYears(1)
        );
    }
}