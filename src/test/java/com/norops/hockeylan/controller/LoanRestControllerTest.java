package com.norops.hockeylan.controller;

import com.norops.hockeylan.exception.GlobalExceptionHandler;
import com.norops.hockeylan.model.Equipment;
import com.norops.hockeylan.model.EquipmentType;
import com.norops.hockeylan.service.EquipmentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class LoanRestControllerTest {

    private MockMvc mockMvc;

    @Mock
    private EquipmentService
            equipmentService;

    @BeforeEach
    void setUp() {
        LoanRestController controller =
                new LoanRestController(
                        equipmentService
                );

        mockMvc = MockMvcBuilders
                .standaloneSetup(
                        controller
                )
                .setControllerAdvice(
                        new GlobalExceptionHandler()
                )
                .build();
    }

    @Test
    void getEquipmentForLoanShouldReturnEquipment()
            throws Exception {
        Equipment equipment =
                new Equipment(
                        EquipmentType.HELMET,
                        "HELMET-001",
                        "Bauer hjälm"
                );

        equipment.setId(1L);
        equipment.setAvailable(true);

        when(
                equipmentService
                        .getEquipmentBySerialNumber(
                                "HELMET-001"
                        )
        ).thenReturn(equipment);

        mockMvc.perform(
                        get(
                                "/api/loan/HELMET-001"
                        )
                )
                .andExpect(
                        status().isOk()
                )
                .andExpect(
                        jsonPath("$.id")
                                .value(1L)
                )
                .andExpect(
                        jsonPath("$.type")
                                .value(
                                        "HELMET"
                                )
                )
                .andExpect(
                        jsonPath(
                                "$.serialNumber"
                        ).value(
                                "HELMET-001"
                        )
                )
                .andExpect(
                        jsonPath(
                                "$.available"
                        ).value(true)
                );
    }

    @Test
    void publicPostShouldNoLongerRegisterLoan()
            throws Exception {
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
                                "/api/loan/HELMET-001"
                        )
                                .contentType(
                                        APPLICATION_JSON
                                )
                                .content(json)
                )
                .andExpect(
                        status()
                                .isMethodNotAllowed()
                );
    }
}