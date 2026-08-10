package com.norops.hockeylan.controller;

import com.norops.hockeylan.dto.LoanFormDTO;
import com.norops.hockeylan.exception.BusinessRuleException;
import com.norops.hockeylan.exception.GlobalExceptionHandler;
import com.norops.hockeylan.model.Equipment;
import com.norops.hockeylan.model.EquipmentType;
import com.norops.hockeylan.model.Loan;
import com.norops.hockeylan.service.LoanService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

import static org.hamcrest.Matchers.nullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminLoanRestControllerTest {

    private static final Clock FIXED_CLOCK =
            Clock.fixed(
                    Instant.parse(
                            "2026-07-30T10:00:00Z"
                    ),
                    ZoneId.of(
                            "Europe/Stockholm"
                    )
            );

    private MockMvc mockMvc;

    @Mock
    private LoanService loanService;

    @BeforeEach
    void setUp() {
        AdminLoanRestController controller =
                new AdminLoanRestController(
                        loanService,
                        FIXED_CLOCK
                );

        mockMvc =
                MockMvcBuilders
                        .standaloneSetup(
                                controller
                        )
                        .setControllerAdvice(
                                new GlobalExceptionHandler()
                        )
                        .setValidator(
                                validator()
                        )
                        .build();
    }

    @Test
    void registerLoanShouldReturnCreatedLoan()
            throws Exception {
        Loan loan =
                registeredLoan(
                        LocalDate.of(
                                2027,
                                4,
                                30
                        )
                );

        when(
                loanService.registerLoan(
                        eq("HELMET-001"),
                        any()
                )
        ).thenReturn(loan);

        String json = """
                {
                  "borrowerName": "Patrik Hading",
                  "email": "patrik@example.com",
                  "phoneNumber": "+46701234567",
                  "expectedReturnDate": "2027-04-30"
                }
                """;

        mockMvc.perform(
                        post(
                                "/api/admin/loans/HELMET-001"
                        )
                                .contentType(
                                        APPLICATION_JSON
                                )
                                .content(json)
                )
                .andExpect(
                        status().isCreated()
                )
                .andExpect(
                        jsonPath("$.id")
                                .value(10L)
                )
                .andExpect(
                        jsonPath(
                                "$.borrowerName"
                        ).value(
                                "Patrik Hading"
                        )
                )
                .andExpect(
                        jsonPath(
                                "$.expectedReturnDate"
                        ).value(
                                "2027-04-30"
                        )
                )
                .andExpect(
                        jsonPath("$.returned")
                                .value(false)
                )
                .andExpect(
                        jsonPath("$.overdue")
                                .value(false)
                )
                .andExpect(
                        jsonPath(
                                "$.returnedLate"
                        ).value(false)
                );
    }

    @Test
    void registerLoanShouldAcceptMissingDate()
            throws Exception {
        Loan loan =
                registeredLoan(null);

        when(
                loanService.registerLoan(
                        eq("HELMET-001"),
                        any()
                )
        ).thenReturn(loan);

        String json = """
                {
                  "borrowerName": "Patrik Hading",
                  "email": "patrik@example.com",
                  "phoneNumber": "+46701234567"
                }
                """;

        mockMvc.perform(
                        post(
                                "/api/admin/loans/HELMET-001"
                        )
                                .contentType(
                                        APPLICATION_JSON
                                )
                                .content(json)
                )
                .andExpect(
                        status().isCreated()
                )
                .andExpect(
                        jsonPath(
                                "$.expectedReturnDate"
                        ).value(
                                nullValue()
                        )
                )
                .andExpect(
                        jsonPath("$.overdue")
                                .value(false)
                )
                .andExpect(
                        jsonPath(
                                "$.returnedLate"
                        ).value(false)
                );

        verify(
                loanService
        ).registerLoan(
                eq("HELMET-001"),
                argThat(
                        dto ->
                                dto.getExpectedReturnDate()
                                        == null
                )
        );
    }

    @Test
    void registerLoanShouldAcceptExplicitNullDate()
            throws Exception {
        Loan loan =
                registeredLoan(null);

        when(
                loanService.registerLoan(
                        eq("HELMET-001"),
                        any()
                )
        ).thenReturn(loan);

        String json = """
                {
                  "borrowerName": "Patrik Hading",
                  "email": "patrik@example.com",
                  "phoneNumber": "+46701234567",
                  "expectedReturnDate": null
                }
                """;

        mockMvc.perform(
                        post(
                                "/api/admin/loans/HELMET-001"
                        )
                                .contentType(
                                        APPLICATION_JSON
                                )
                                .content(json)
                )
                .andExpect(
                        status().isCreated()
                )
                .andExpect(
                        jsonPath(
                                "$.expectedReturnDate"
                        ).value(
                                nullValue()
                        )
                );
    }

    @Test
    void registerLoanShouldAcceptAliasName()
            throws Exception {
        Loan loan =
                registeredLoan(null);

        when(
                loanService.registerLoan(
                        eq("HELMET-001"),
                        any()
                )
        ).thenReturn(loan);

        String json = """
                {
                  "borrowerName": "Patrik Hading",
                  "email": "patrik@example.com",
                  "phoneNumber": "+46701234567",
                  "aliasName": "Patrik",
                  "expectedReturnDate": null
                }
                """;

        mockMvc.perform(
                        post(
                                "/api/admin/loans/HELMET-001"
                        )
                                .contentType(
                                        APPLICATION_JSON
                                )
                                .content(json)
                )
                .andExpect(
                        status().isCreated()
                );

        verify(
                loanService
        ).registerLoan(
                eq("HELMET-001"),
                argThat(
                        dto ->
                                "Patrik".equals(
                                        dto.getAliasName()
                                )
                                        && dto
                                        .getExpectedReturnDate()
                                        == null
                )
        );
    }

    @Test
    void registerLoanShouldRejectPastDate()
            throws Exception {
        String json = """
                {
                  "borrowerName": "Patrik Hading",
                  "email": "patrik@example.com",
                  "phoneNumber": "+46701234567",
                  "expectedReturnDate": "2020-01-01"
                }
                """;

        mockMvc.perform(
                        post(
                                "/api/admin/loans/HELMET-001"
                        )
                                .contentType(
                                        APPLICATION_JSON
                                )
                                .content(json)
                )
                .andExpect(
                        status().isBadRequest()
                )
                .andExpect(
                        jsonPath("$.status")
                                .value(400)
                )
                .andExpect(
                        jsonPath("$.error")
                                .value(
                                        "Bad Request"
                                )
                )
                .andExpect(
                        jsonPath("$.code")
                                .value(
                                        "VALIDATION_FAILED"
                                )
                )
                .andExpect(
                        jsonPath("$.message")
                                .value(
                                        "Kontrollera de markerade fälten."
                                )
                )
                .andExpect(
                        jsonPath(
                                "$.fieldErrors.expectedReturnDate"
                        ).value(
                                "Förväntat återlämningsdatum "
                                        + "måste vara idag eller "
                                        + "ett framtida datum."
                        )
                );

        verify(
                loanService,
                never()
        ).registerLoan(
                any(),
                any()
        );
    }

    @Test
    void registerLoanShouldAcceptMultiYearDate()
            throws Exception {
        Loan loan =
                registeredLoan(
                        LocalDate.of(
                                2030,
                                6,
                                1
                        )
                );

        when(
                loanService.registerLoan(
                        eq("HELMET-001"),
                        any()
                )
        ).thenReturn(loan);

        String json = """
                {
                  "borrowerName": "Patrik Hading",
                  "email": "patrik@example.com",
                  "phoneNumber": "+46701234567",
                  "expectedReturnDate": "2030-06-01"
                }
                """;

        mockMvc.perform(
                        post(
                                "/api/admin/loans/HELMET-001"
                        )
                                .contentType(
                                        APPLICATION_JSON
                                )
                                .content(json)
                )
                .andExpect(
                        status().isCreated()
                )
                .andExpect(
                        jsonPath(
                                "$.expectedReturnDate"
                        ).value(
                                "2030-06-01"
                        )
                );
    }

    @Test
    void registerLoanShouldReturnConflictForUnavailableEquipment()
            throws Exception {
        when(
                loanService.registerLoan(
                        eq("HELMET-001"),
                        any()
                )
        ).thenThrow(
                new BusinessRuleException(
                        "Utrustningen är redan utlånad."
                )
        );

        String json = """
                {
                  "borrowerName": "Patrik Hading",
                  "email": "patrik@example.com",
                  "phoneNumber": "+46701234567",
                  "expectedReturnDate": "2027-04-30"
                }
                """;

        mockMvc.perform(
                        post(
                                "/api/admin/loans/HELMET-001"
                        )
                                .contentType(
                                        APPLICATION_JSON
                                )
                                .content(json)
                )
                .andExpect(
                        status().isConflict()
                )
                .andExpect(
                        jsonPath("$.status")
                                .value(409)
                )
                .andExpect(
                        jsonPath("$.error")
                                .value(
                                        "Conflict"
                                )
                )
                .andExpect(
                        jsonPath("$.code")
                                .value(
                                        "EQUIPMENT_ALREADY_LOANED"
                                )
                )
                .andExpect(
                        jsonPath("$.message")
                                .value(
                                        "Utrustningen är redan utlånad."
                                )
                )
                .andExpect(
                        jsonPath("$.fieldErrors")
                                .isEmpty()
                );
    }

    private Loan registeredLoan(
            LocalDate expectedReturnDate
    ) {
        Equipment equipment =
                new Equipment(
                        EquipmentType.HELMET,
                        "HELMET-001",
                        "Bauer hjälm"
                );

        equipment.setId(1L);
        equipment.setAvailable(false);

        Loan loan =
                new Loan(
                        equipment,
                        "Patrik Hading",
                        "patrik@example.com",
                        "+46701234567",
                        expectedReturnDate
                );

        loan.setId(10L);

        loan.setLoanDate(
                LocalDateTime.of(
                        2026,
                        7,
                        30,
                        12,
                        0
                )
        );

        return loan;
    }

    private LocalValidatorFactoryBean
    validator() {
        LocalValidatorFactoryBean validator =
                new LocalValidatorFactoryBean();

        validator.afterPropertiesSet();

        return validator;
    }
}