package com.norops.hockeylan.controller;

import com.norops.hockeylan.dto.LoanHistoryStatus;
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
import org.springframework.data.domain.PageImpl;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminActiveLoanControllerTest {

    private MockMvc mockMvc;

    @Mock
    private EquipmentService
            equipmentService;

    @Mock
    private LoanService loanService;

    @BeforeEach
    void setUp() {
        Clock fixedClock =
                Clock.fixed(
                        Instant.parse(
                                "2026-08-01T12:00:00Z"
                        ),
                        ZoneOffset.UTC
                );

        AdminRestController controller =
                new AdminRestController(
                        equipmentService,
                        loanService,
                        fixedClock
                );

        ReflectionTestUtils.setField(
                controller,
                "qrBaseUrl",
                "http://localhost:5173"
        );

        mockMvc =
                MockMvcBuilders
                        .standaloneSetup(
                                controller
                        )
                        .setControllerAdvice(
                                new GlobalExceptionHandler()
                        )
                        .build();
    }

    @Test
    void historyShouldReturnPagedAdminLoanData()
            throws Exception {
        Loan loan =
                activeLoan();

        when(
                loanService.getLoanHistory(
                        LoanHistoryStatus.ACTIVE,
                        LocalDate.of(
                                2026,
                                7,
                                1
                        ),
                        LocalDate.of(
                                2026,
                                7,
                                31
                        ),
                        "HELMET-001",
                        EquipmentType.HELMET,
                        "Patrik",
                        0,
                        20
                )
        ).thenReturn(
                new PageImpl<>(
                        List.of(loan)
                )
        );

        mockMvc.perform(
                        get(
                                "/api/admin/loans"
                        )
                                .param(
                                        "status",
                                        "ACTIVE"
                                )
                                .param(
                                        "from",
                                        "2026-07-01"
                                )
                                .param(
                                        "to",
                                        "2026-07-31"
                                )
                                .param(
                                        "serialNumber",
                                        "HELMET-001"
                                )
                                .param(
                                        "equipmentType",
                                        "HELMET"
                                )
                                .param(
                                        "borrower",
                                        "Patrik"
                                )
                                .param(
                                        "page",
                                        "0"
                                )
                                .param(
                                        "size",
                                        "20"
                                )
                )
                .andExpect(
                        status().isOk()
                )
                .andExpect(
                        jsonPath(
                                "$.content[0].id"
                        ).value(10)
                )
                .andExpect(
                        jsonPath(
                                "$.content[0].borrowerName"
                        ).value(
                                "Patrik Hading"
                        )
                )
                .andExpect(
                        jsonPath(
                                "$.content[0].expectedReturnDate"
                        ).value(
                                "2026-08-31"
                        )
                )
                .andExpect(
                        jsonPath(
                                "$.content[0].returned"
                        ).value(false)
                )
                .andExpect(
                        jsonPath(
                                "$.content[0].overdue"
                        ).value(false)
                )
                .andExpect(
                        jsonPath(
                                "$.content[0].returnedLate"
                        ).value(false)
                )
                .andExpect(
                        jsonPath("$.page")
                                .value(0)
                )
                .andExpect(
                        jsonPath("$.size")
                                .value(1)
                )
                .andExpect(
                        jsonPath(
                                "$.totalElements"
                        ).value(1)
                )
                .andExpect(
                        jsonPath("$.first")
                                .value(true)
                )
                .andExpect(
                        jsonPath("$.last")
                                .value(true)
                );
    }

    @Test
    void historyShouldPassOverdueStatusToService()
            throws Exception {
        when(
                loanService.getLoanHistory(
                        LoanHistoryStatus.OVERDUE,
                        null,
                        null,
                        null,
                        null,
                        null,
                        0,
                        20
                )
        ).thenReturn(
                new PageImpl<>(
                        List.of()
                )
        );

        mockMvc.perform(
                        get(
                                "/api/admin/loans"
                        )
                                .param(
                                        "status",
                                        "OVERDUE"
                                )
                )
                .andExpect(
                        status().isOk()
                )
                .andExpect(
                        jsonPath("$.content")
                                .isEmpty()
                );
    }

    @Test
    void historyShouldRejectPageSizeOver100()
            throws Exception {
        when(
                loanService.getLoanHistory(
                        LoanHistoryStatus.ALL,
                        null,
                        null,
                        null,
                        null,
                        null,
                        0,
                        101
                )
        ).thenThrow(
                new IllegalArgumentException(
                        "Page size must be "
                                + "between 1 and 100."
                )
        );

        mockMvc.perform(
                        get(
                                "/api/admin/loans"
                        )
                                .param(
                                        "size",
                                        "101"
                                )
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
                                        "INVALID_REQUEST"
                                )
                )
                .andExpect(
                        jsonPath("$.message")
                                .value(
                                        "Begäran kunde inte behandlas."
                                )
                )
                .andExpect(
                        jsonPath("$.path")
                                .value(
                                        "/api/admin/loans"
                                )
                )
                .andExpect(
                        jsonPath("$.fieldErrors")
                                .isEmpty()
                );
    }

    @Test
    void historyShouldRejectInvalidStatus()
            throws Exception {
        mockMvc.perform(
                        get(
                                "/api/admin/loans"
                        )
                                .param(
                                        "status",
                                        "UNKNOWN"
                                )
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
                                        "INVALID_REQUEST"
                                )
                )
                .andExpect(
                        jsonPath("$.message")
                                .value(
                                        "En eller flera parametrar "
                                                + "innehåller ogiltiga värden."
                                )
                )
                .andExpect(
                        jsonPath("$.path")
                                .value(
                                        "/api/admin/loans"
                                )
                )
                .andExpect(
                        jsonPath("$.fieldErrors")
                                .isEmpty()
                );
    }

    private Loan activeLoan() {
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
                        LocalDate.of(
                                2026,
                                8,
                                31
                        )
                );

        loan.setId(10L);

        loan.setLoanDate(
                LocalDateTime.of(
                        2026,
                        7,
                        28,
                        12,
                        30
                )
        );

        return loan;
    }
}