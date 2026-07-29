package com.norops.hockeylan.controller;

import com.norops.hockeylan.exception.GlobalExceptionHandler;
import com.norops.hockeylan.model.Equipment;
import com.norops.hockeylan.model.EquipmentType;
import com.norops.hockeylan.model.Loan;
import com.norops.hockeylan.service.EquipmentService;
import com.norops.hockeylan.service.LoanService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class LoanRestControllerTest {

    private MockMvc mockMvc;

    @Mock
    private EquipmentService equipmentService;

    @Mock
    private LoanService loanService;

    @BeforeEach
    void setUp() {
        LoanRestController controller =
                new LoanRestController(
                        equipmentService,
                        loanService
                );

        mockMvc = MockMvcBuilders
                .standaloneSetup(controller)
                .setControllerAdvice(
                        new GlobalExceptionHandler()
                )
                .setValidator(validator())
                .build();
    }

    @Test
    void getEquipmentForLoanShouldReturnEquipment()
            throws Exception {
        Equipment equipment = new Equipment(
                EquipmentType.HELMET,
                "HELMET-001",
                "Bauer hjälm"
        );

        equipment.setId(1L);
        equipment.setAvailable(true);

        when(
                equipmentService.getEquipmentBySerialNumber(
                        "HELMET-001"
                )
        ).thenReturn(equipment);

        mockMvc.perform(get("/api/loan/HELMET-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.type").value("HELMET"))
                .andExpect(
                        jsonPath("$.serialNumber")
                                .value("HELMET-001")
                )
                .andExpect(
                        jsonPath("$.description")
                                .value("Bauer hjälm")
                )
                .andExpect(
                        jsonPath("$.available").value(true)
                );
    }

    @Test
    void registerLoanShouldReturn201WithoutPersonalData()
            throws Exception {
        Equipment equipment = new Equipment(
                EquipmentType.HELMET,
                "HELMET-001",
                "Bauer hjälm"
        );

        equipment.setId(1L);

        Loan loan = new Loan(
                equipment,
                "Patrik Hading",
                "patrik@example.com",
                "+46701234567"
        );

        loan.setId(10L);
        loan.setLoanDate(
                LocalDateTime.of(2026, 7, 28, 12, 30)
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
                  "phoneNumber": "+46701234567"
                }
                """;

        mockMvc.perform(post("/api/loan/HELMET-001")
                        .contentType(APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10L))
                .andExpect(
                        jsonPath("$.equipment.serialNumber")
                                .value("HELMET-001")
                )
                .andExpect(
                        jsonPath("$.loanDate")
                                .value("2026-07-28T12:30:00")
                )
                .andExpect(
                        jsonPath("$.returned").value(false)
                )
                .andExpect(
                        jsonPath("$.borrowerName").doesNotExist()
                )
                .andExpect(
                        jsonPath("$.email").doesNotExist()
                )
                .andExpect(
                        jsonPath("$.phoneNumber").doesNotExist()
                );
    }

    @Test
    void registerLoanShouldReturn400WhenRequestIsInvalid()
            throws Exception {
        String json = """
                {
                  "borrowerName": "",
                  "email": "not-valid-email",
                  "phoneNumber": ""
                }
                """;

        mockMvc.perform(post("/api/loan/HELMET-001")
                        .contentType(APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest());
    }

    private LocalValidatorFactoryBean validator() {
        LocalValidatorFactoryBean validator =
                new LocalValidatorFactoryBean();

        validator.afterPropertiesSet();

        return validator;
    }
}