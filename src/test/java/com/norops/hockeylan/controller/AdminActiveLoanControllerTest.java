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
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
                .andExpect(
                        jsonPath("$[0].borrowerName")
                                .value("Patrik Hading")
                )
                .andExpect(
                        jsonPath("$[0].email")
                                .value("patrik@example.com")
                )
                .andExpect(
                        jsonPath("$[0].phoneNumber")
                                .value("+46701234567")
                )
                .andExpect(
                        jsonPath("$[0].equipment.type")
                                .value("HELMET")
                )
                .andExpect(
                        jsonPath("$[0].equipment.serialNumber")
                                .value("HELMET-001")
                )
                .andExpect(
                        jsonPath("$[0].loanDate")
                                .value("2026-07-28T12:30:00")
                )
                .andExpect(
                        jsonPath("$[0].returned").value(false)
                );
    }

    @Test
    void markLoanReturnedShouldReturnUpdatedLoan()
            throws Exception {
        Loan loan = activeLoan();
        loan.setReturned(true);
        loan.getEquipment().setAvailable(true);

        when(loanService.markReturned(10L))
                .thenReturn(loan);

        mockMvc.perform(
                        put("/api/admin/loans/10/returned")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10L))
                .andExpect(
                        jsonPath("$.returned").value(true)
                )
                .andExpect(
                        jsonPath("$.equipment.available")
                                .value(true)
                );
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
        loan.setReturned(false);

        return loan;
    }
}