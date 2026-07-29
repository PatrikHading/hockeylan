package com.norops.hockeylan.controller;

import com.norops.hockeylan.exception.GlobalExceptionHandler;
import com.norops.hockeylan.model.Equipment;
import com.norops.hockeylan.model.EquipmentType;
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
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AdminRestControllerTest {

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
                .setValidator(validator())
                .build();
    }

    @Test
    void getAllEquipmentShouldReturnEquipmentList()
            throws Exception {
        Equipment equipment = new Equipment(
                EquipmentType.STICK,
                "STICK-001",
                "CCM klubba"
        );

        equipment.setId(1L);
        equipment.setAvailable(true);

        when(equipmentService.getAllEquipment())
                .thenReturn(List.of(equipment));

        mockMvc.perform(get("/api/admin/equipment"))
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$[0].id")
                                .value(1L)
                )
                .andExpect(
                        jsonPath("$[0].type")
                                .value("STICK")
                )
                .andExpect(
                        jsonPath("$[0].serialNumber")
                                .value("STICK-001")
                )
                .andExpect(
                        jsonPath("$[0].description")
                                .value("CCM klubba")
                )
                .andExpect(
                        jsonPath("$[0].available")
                                .value(true)
                );
    }

    @Test
    void addEquipmentShouldReturn201()
            throws Exception {
        Equipment savedEquipment = new Equipment(
                EquipmentType.HELMET,
                "HELMET-001",
                "Bauer hjälm"
        );

        savedEquipment.setId(1L);

        when(equipmentService.addEquipment(any()))
                .thenReturn(savedEquipment);

        String json = """
                {
                  "type": "HELMET",
                  "serialNumber": "HELMET-001",
                  "description": "Bauer hjälm"
                }
                """;

        mockMvc.perform(
                        post("/api/admin/equipment")
                                .contentType(APPLICATION_JSON)
                                .content(json)
                )
                .andExpect(status().isCreated())
                .andExpect(
                        jsonPath("$.id")
                                .value(1L)
                )
                .andExpect(
                        jsonPath("$.type")
                                .value("HELMET")
                )
                .andExpect(
                        jsonPath("$.serialNumber")
                                .value("HELMET-001")
                )
                .andExpect(
                        jsonPath("$.description")
                                .value("Bauer hjälm")
                )
                .andExpect(
                        jsonPath("$.available")
                                .value(true)
                );
    }

    @Test
    void addEquipmentShouldReturn400WhenRequestIsInvalid()
            throws Exception {
        String json = """
                {
                  "type": null,
                  "serialNumber": "",
                  "description": "Missing type and serial number"
                }
                """;

        mockMvc.perform(
                        post("/api/admin/equipment")
                                .contentType(APPLICATION_JSON)
                                .content(json)
                )
                .andExpect(status().isBadRequest());
    }

    @Test
    void getQrCodeShouldReturnQrCodeData()
            throws Exception {
        Equipment equipment = new Equipment(
                EquipmentType.SKATES,
                "SKATES-001",
                "CCM skridskor"
        );

        equipment.setId(2L);
        equipment.setAvailable(true);

        when(equipmentService.getEquipmentById(2L))
                .thenReturn(equipment);

        mockMvc.perform(
                        get("/api/admin/equipment/2/qr")
                )
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.serialNumber")
                                .value("SKATES-001")
                )
                .andExpect(
                        jsonPath("$.type")
                                .value("SKATES")
                )
                .andExpect(
                        jsonPath("$.description")
                                .value("CCM skridskor")
                )
                .andExpect(
                        jsonPath("$.available")
                                .value(true)
                )
                .andExpect(
                        jsonPath("$.loanUrl")
                                .value(
                                        "http://localhost:5173/loan/SKATES-001"
                                )
                )
                .andExpect(
                        jsonPath("$.qrCodeBase64")
                                .isNotEmpty()
                );
    }

    private LocalValidatorFactoryBean validator() {
        LocalValidatorFactoryBean validator =
                new LocalValidatorFactoryBean();

        validator.afterPropertiesSet();

        return validator;
    }
}