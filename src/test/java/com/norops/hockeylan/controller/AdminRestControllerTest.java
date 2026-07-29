package com.norops.hockeylan.controller;

import com.norops.hockeylan.exception.GlobalExceptionHandler;
import com.norops.hockeylan.model.AgeCategory;
import com.norops.hockeylan.model.Equipment;
import com.norops.hockeylan.model.EquipmentCondition;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminRestControllerTest {

    private MockMvc mockMvc;

    @Mock
    private EquipmentService
            equipmentService;

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
    void getAllEquipmentShouldReturnExtendedEquipmentList()
            throws Exception {
        Equipment equipment =
                completeEquipment();

        when(
                equipmentService.searchEquipment(
                        null,
                        null,
                        null,
                        null,
                        null,
                        null
                )
        ).thenReturn(
                List.of(equipment)
        );

        mockMvc.perform(
                        get("/api/admin/equipment")
                )
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$[0].id")
                                .value(1L)
                )
                .andExpect(
                        jsonPath("$[0].type")
                                .value("HELMET")
                )
                .andExpect(
                        jsonPath(
                                "$[0].serialNumber"
                        ).value("HELMET-001")
                )
                .andExpect(
                        jsonPath("$[0].size")
                                .value("M")
                )
                .andExpect(
                        jsonPath("$[0].brand")
                                .value("Bauer")
                )
                .andExpect(
                        jsonPath("$[0].model")
                                .value("Re-Akt 150")
                )
                .andExpect(
                        jsonPath("$[0].condition")
                                .value("GOOD")
                )
                .andExpect(
                        jsonPath(
                                "$[0].ageCategory"
                        ).value("JUNIOR")
                )
                .andExpect(
                        jsonPath(
                                "$[0].storageLocation"
                        ).value("Hylla A2")
                )
                .andExpect(
                        jsonPath(
                                "$[0].description"
                        ).value("Svart hjälm")
                )
                .andExpect(
                        jsonPath("$[0].available")
                                .value(true)
                )
                .andExpect(
                        jsonPath("$[0].active")
                                .value(true)
                );
    }

    @Test
    void getAllEquipmentShouldPassFiltersToService()
            throws Exception {
        when(
                equipmentService.searchEquipment(
                        any(),
                        any(),
                        any(),
                        any(),
                        any(),
                        any()
                )
        ).thenReturn(List.of());

        mockMvc.perform(
                        get("/api/admin/equipment")
                                .param(
                                        "query",
                                        "bauer"
                                )
                                .param(
                                        "type",
                                        "HELMET"
                                )
                                .param(
                                        "condition",
                                        "GOOD"
                                )
                                .param(
                                        "ageCategory",
                                        "JUNIOR"
                                )
                                .param(
                                        "active",
                                        "true"
                                )
                                .param(
                                        "available",
                                        "false"
                                )
                )
                .andExpect(status().isOk());

        verify(equipmentService)
                .searchEquipment(
                        eq("bauer"),
                        eq(EquipmentType.HELMET),
                        eq(
                                EquipmentCondition.GOOD
                        ),
                        eq(AgeCategory.JUNIOR),
                        eq(true),
                        eq(false)
                );
    }

    @Test
    void getEquipmentByIdShouldReturnEquipment()
            throws Exception {
        Equipment equipment =
                completeEquipment();

        when(
                equipmentService
                        .getEquipmentById(1L)
        ).thenReturn(equipment);

        mockMvc.perform(
                        get(
                                "/api/admin/equipment/1"
                        )
                )
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.id")
                                .value(1L)
                )
                .andExpect(
                        jsonPath("$.serialNumber")
                                .value("HELMET-001")
                )
                .andExpect(
                        jsonPath("$.condition")
                                .value("GOOD")
                )
                .andExpect(
                        jsonPath("$.active")
                                .value(true)
                );
    }

    @Test
    void addEquipmentShouldReturn201WithAllFields()
            throws Exception {
        Equipment savedEquipment =
                completeEquipment();

        when(
                equipmentService
                        .addEquipment(any())
        ).thenReturn(savedEquipment);

        String json = """
                {
                  "type": "HELMET",
                  "serialNumber": "HELMET-001",
                  "size": "M",
                  "brand": "Bauer",
                  "model": "Re-Akt 150",
                  "condition": "GOOD",
                  "ageCategory": "JUNIOR",
                  "storageLocation": "Hylla A2",
                  "description": "Svart hjälm"
                }
                """;

        mockMvc.perform(
                        post(
                                "/api/admin/equipment"
                        )
                                .contentType(
                                        APPLICATION_JSON
                                )
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
                        jsonPath("$.size")
                                .value("M")
                )
                .andExpect(
                        jsonPath("$.brand")
                                .value("Bauer")
                )
                .andExpect(
                        jsonPath("$.model")
                                .value("Re-Akt 150")
                )
                .andExpect(
                        jsonPath("$.condition")
                                .value("GOOD")
                )
                .andExpect(
                        jsonPath("$.ageCategory")
                                .value("JUNIOR")
                )
                .andExpect(
                        jsonPath(
                                "$.storageLocation"
                        ).value("Hylla A2")
                )
                .andExpect(
                        jsonPath("$.description")
                                .value("Svart hjälm")
                )
                .andExpect(
                        jsonPath("$.available")
                                .value(true)
                )
                .andExpect(
                        jsonPath("$.active")
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
                  "condition": null,
                  "description": "Ogiltig utrustning"
                }
                """;

        mockMvc.perform(
                        post(
                                "/api/admin/equipment"
                        )
                                .contentType(
                                        APPLICATION_JSON
                                )
                                .content(json)
                )
                .andExpect(
                        status().isBadRequest()
                );
    }

    @Test
    void updateEquipmentShouldReturnUpdatedEquipment()
            throws Exception {
        Equipment updatedEquipment =
                completeEquipment();

        updatedEquipment.setSize("L");
        updatedEquipment.setCondition(
                EquipmentCondition.WORN
        );
        updatedEquipment.setStorageLocation(
                "Hylla C3"
        );

        when(
                equipmentService.updateEquipment(
                        eq(1L),
                        any()
                )
        ).thenReturn(updatedEquipment);

        String json = """
                {
                  "type": "HELMET",
                  "serialNumber": "HELMET-001",
                  "size": "L",
                  "brand": "Bauer",
                  "model": "Re-Akt 150",
                  "condition": "WORN",
                  "ageCategory": "JUNIOR",
                  "storageLocation": "Hylla C3",
                  "description": "Svart hjälm"
                }
                """;

        mockMvc.perform(
                        put(
                                "/api/admin/equipment/1"
                        )
                                .contentType(
                                        APPLICATION_JSON
                                )
                                .content(json)
                )
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.id")
                                .value(1L)
                )
                .andExpect(
                        jsonPath("$.size")
                                .value("L")
                )
                .andExpect(
                        jsonPath("$.condition")
                                .value("WORN")
                )
                .andExpect(
                        jsonPath(
                                "$.storageLocation"
                        ).value("Hylla C3")
                );
    }

    @Test
    void updateEquipmentActiveStatusShouldDeactivateEquipment()
            throws Exception {
        Equipment equipment =
                completeEquipment();

        equipment.setActive(false);

        when(
                equipmentService
                        .updateActiveStatus(
                                1L,
                                false
                        )
        ).thenReturn(equipment);

        String json = """
                {
                  "active": false
                }
                """;

        mockMvc.perform(
                        put(
                                "/api/admin/equipment/1/active"
                        )
                                .contentType(
                                        APPLICATION_JSON
                                )
                                .content(json)
                )
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.id")
                                .value(1L)
                )
                .andExpect(
                        jsonPath("$.active")
                                .value(false)
                )
                .andExpect(
                        jsonPath("$.available")
                                .value(true)
                );
    }

    @Test
    void updateEquipmentActiveStatusShouldReactivateEquipment()
            throws Exception {
        Equipment equipment =
                completeEquipment();

        when(
                equipmentService
                        .updateActiveStatus(
                                1L,
                                true
                        )
        ).thenReturn(equipment);

        String json = """
                {
                  "active": true
                }
                """;

        mockMvc.perform(
                        put(
                                "/api/admin/equipment/1/active"
                        )
                                .contentType(
                                        APPLICATION_JSON
                                )
                                .content(json)
                )
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.active")
                                .value(true)
                );
    }

    @Test
    void updateEquipmentActiveStatusShouldReturn400WhenStatusIsMissing()
            throws Exception {
        mockMvc.perform(
                        put(
                                "/api/admin/equipment/1/active"
                        )
                                .contentType(
                                        APPLICATION_JSON
                                )
                                .content("{}")
                )
                .andExpect(
                        status().isBadRequest()
                );
    }

    @Test
    void getQrCodeShouldReturnExtendedQrCodeData()
            throws Exception {
        Equipment equipment =
                completeEquipment();

        when(
                equipmentService
                        .getEquipmentById(1L)
        ).thenReturn(equipment);

        mockMvc.perform(
                        get(
                                "/api/admin/equipment/1/qr"
                        )
                )
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.serialNumber")
                                .value("HELMET-001")
                )
                .andExpect(
                        jsonPath("$.type")
                                .value("HELMET")
                )
                .andExpect(
                        jsonPath("$.size")
                                .value("M")
                )
                .andExpect(
                        jsonPath("$.brand")
                                .value("Bauer")
                )
                .andExpect(
                        jsonPath("$.model")
                                .value("Re-Akt 150")
                )
                .andExpect(
                        jsonPath("$.condition")
                                .value("GOOD")
                )
                .andExpect(
                        jsonPath("$.ageCategory")
                                .value("JUNIOR")
                )
                .andExpect(
                        jsonPath("$.description")
                                .value("Svart hjälm")
                )
                .andExpect(
                        jsonPath("$.available")
                                .value(true)
                )
                .andExpect(
                        jsonPath("$.active")
                                .value(true)
                )
                .andExpect(
                        jsonPath("$.storageLocation")
                                .doesNotExist()
                )
                .andExpect(
                        jsonPath("$.loanUrl")
                                .value(
                                        "http://localhost:5173/loan/HELMET-001"
                                )
                )
                .andExpect(
                        jsonPath("$.qrCodeBase64")
                                .isNotEmpty()
                );
    }

    private Equipment completeEquipment() {
        Equipment equipment =
                new Equipment(
                        EquipmentType.HELMET,
                        "HELMET-001",
                        "M",
                        "Bauer",
                        "Re-Akt 150",
                        EquipmentCondition.GOOD,
                        AgeCategory.JUNIOR,
                        "Hylla A2",
                        "Svart hjälm"
                );

        equipment.setId(1L);

        return equipment;
    }

    private LocalValidatorFactoryBean
    validator() {
        LocalValidatorFactoryBean validator =
                new LocalValidatorFactoryBean();

        validator.afterPropertiesSet();

        return validator;
    }
}