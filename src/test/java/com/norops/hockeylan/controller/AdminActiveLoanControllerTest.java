package com.norops.hockeylan.controller;

import com.norops.hockeylan.exception.BusinessRuleException;
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
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AdminActiveLoanControllerTest {

    private MockMvc mockMvc;

    @Mock
    private EquipmentService equipmentService;

    @Mock
    private LoanService loanService;

    @BeforeEach
    void setUp() {
        AdminRestController controller =
                new AdminRestController(
                        equipmentService,
                        loanService
                );

        ReflectionTestUtils.setField(
                controller,
                "qrBaseUrl",
                "http://localhost:5173"
        );

        mockMvc = MockMvcBuilders
                .standaloneSetup(controller)
                .setControllerAdvice(
                        new GlobalExceptionHandler()
                )
                .build();
    }

    @Test
    void getActiveLoansShouldReturnAdminLoanData()
            throws Exception {
        Loan loan = activeLoan();

        when(loanService.getActiveLoans())
                .thenReturn(List.of(loan));

        mockMvc.perform(get("/api/admin/loans/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(10L))
                .andExpect(jsonPath("$[0].borrowerName")
                        .value("Patrik Hading"))
                .andExpect(jsonPath("$[0].loanDate")
                        .value("2026-07-28T12:30:00"))
                .andExpect(jsonPath("$[0].returned")
                        .value(false))
                .andExpect(jsonPath("$[0].returnedAt")
                        .doesNotExist());
    }

    @Test
    void markLoanReturnedShouldReturnTimestamp()
            throws Exception {
        Loan loan = activeLoan();
        loan.registerReturn(
                LocalDateTime.of(2026, 7, 29, 10, 15)
        );
        loan.getEquipment().setAvailable(true);

        when(loanService.markReturned(10L))
                .thenReturn(loan);

        mockMvc.perform(
                        put("/api/admin/loans/10/returned")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10L))
                .andExpect(jsonPath("$.returned").value(true))
                .andExpect(jsonPath("$.returnedAt")
                        .value("2026-07-29T10:15:00"))
                .andExpect(jsonPath("$.equipment.available")
                        .value(true));
    }

    @Test
    void duplicateReturnShouldProduce409()
            throws Exception {
        when(loanService.markReturned(10L))
                .thenThrow(new BusinessRuleException(
                        "Lånet är redan återlämnat."
                ));

        mockMvc.perform(
                        put("/api/admin/loans/10/returned")
                )
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message")
                        .value("Lånet är redan återlämnat."));
    }

    @Test
    void legacyEquipmentReturnEndpointShouldBeRemoved()
            throws Exception {
        mockMvc.perform(
                        put("/api/admin/equipment/1/returned")
                )
                .andExpect(status().isNotFound());
    }

    private Loan activeLoan() {
        Equipment equipment = new Equipment(
                EquipmentType.HELMET,
                "HELMET-001",
                "Bauer hjälm"
        );

        equipment.setId(1L);
        equipment.setAvailable(false);

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

        return loan;
    }
}