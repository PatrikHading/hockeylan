package com.norops.hockeylan.controller;

import com.norops.hockeylan.exception.DuplicateResourceException;
import com.norops.hockeylan.exception.GlobalExceptionHandler;
import com.norops.hockeylan.exception.ResourceNotFoundException;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminRestControllerMockMvcTest {

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
    void addEquipmentShouldReturn409WhenSerialNumberAlreadyExists()
            throws Exception {
        when(
                equipmentService
                        .addEquipment(any())
        ).thenThrow(
                new DuplicateResourceException(
                        "Equipment with serial number already exists: HELMET-001"
                )
        );

        mockMvc.perform(
                        post(
                                "/api/admin/equipment"
                        )
                                .contentType(
                                        APPLICATION_JSON
                                )
                                .content(
                                        validEquipmentJson()
                                )
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
                                .value("Conflict")
                )
                .andExpect(
                        jsonPath("$.message")
                                .value(
                                        "Resource already exists."
                                )
                )
                .andExpect(
                        jsonPath("$.path")
                                .value(
                                        "/api/admin/equipment"
                                )
                );
    }

    @Test
    void updateEquipmentShouldReturn409WhenSerialNumberAlreadyExists()
            throws Exception {
        when(
                equipmentService.updateEquipment(
                        eq(2L),
                        any()
                )
        ).thenThrow(
                new DuplicateResourceException(
                        "Equipment with serial number already exists: HELMET-001"
                )
        );

        mockMvc.perform(
                        put(
                                "/api/admin/equipment/2"
                        )
                                .contentType(
                                        APPLICATION_JSON
                                )
                                .content(
                                        validEquipmentJson()
                                )
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
                                .value("Conflict")
                )
                .andExpect(
                        jsonPath("$.message")
                                .value(
                                        "Resource already exists."
                                )
                )
                .andExpect(
                        jsonPath("$.path")
                                .value(
                                        "/api/admin/equipment/2"
                                )
                );
    }

    @Test
    void addEquipmentShouldReturn400ForMalformedJson()
            throws Exception {
        String malformedJson = """
                {
                  "type": "HELMET",
                  "serialNumber": "HELMET-001",
                  "condition": "GOOD",
                }
                """;

        mockMvc.perform(
                        post(
                                "/api/admin/equipment"
                        )
                                .contentType(
                                        APPLICATION_JSON
                                )
                                .content(
                                        malformedJson
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
                                        "Malformed JSON"
                                )
                )
                .andExpect(
                        jsonPath("$.message")
                                .value(
                                        "Request body is missing, malformed or contains invalid values."
                                )
                )
                .andExpect(
                        jsonPath("$.path")
                                .value(
                                        "/api/admin/equipment"
                                )
                );
    }

    @Test
    void addEquipmentShouldReturn400ForValidationError()
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
                )
                .andExpect(
                        jsonPath("$.status")
                                .value(400)
                )
                .andExpect(
                        jsonPath("$.error")
                                .value(
                                        "Validation Error"
                                )
                )
                .andExpect(
                        jsonPath("$.message")
                                .isNotEmpty()
                )
                .andExpect(
                        jsonPath("$.path")
                                .value(
                                        "/api/admin/equipment"
                                )
                );
    }

    @Test
    void addEquipmentShouldReturn400ForInvalidEnumValue()
            throws Exception {
        String json = """
                {
                  "type": "HELMET",
                  "serialNumber": "HELMET-001",
                  "condition": "BROKEN",
                  "ageCategory": "JUNIOR"
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
                )
                .andExpect(
                        jsonPath("$.status")
                                .value(400)
                )
                .andExpect(
                        jsonPath("$.error")
                                .value(
                                        "Malformed JSON"
                                )
                );
    }

    @Test
    void addEquipmentShouldReturn400WhenBrandIsTooLong()
            throws Exception {
        String longBrand = "B".repeat(101);

        String json = """
                {
                  "type": "HELMET",
                  "serialNumber": "HELMET-001",
                  "brand": "%s",
                  "condition": "GOOD"
                }
                """.formatted(longBrand);

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
                )
                .andExpect(
                        jsonPath("$.status")
                                .value(400)
                )
                .andExpect(
                        jsonPath("$.error")
                                .value(
                                        "Validation Error"
                                )
                )
                .andExpect(
                        jsonPath("$.message")
                                .value(
                                        "brand: Brand must be max 100 characters"
                                )
                );
    }

    @Test
    void getEquipmentByIdShouldReturn404WhenEquipmentDoesNotExist()
            throws Exception {
        when(
                equipmentService
                        .getEquipmentById(99L)
        ).thenThrow(
                new ResourceNotFoundException(
                        "Equipment not found with id: 99"
                )
        );

        mockMvc.perform(
                        get(
                                "/api/admin/equipment/99"
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
                        jsonPath("$.error")
                                .value("Not Found")
                )
                .andExpect(
                        jsonPath("$.message")
                                .value(
                                        "Requested resource was not found."
                                )
                )
                .andExpect(
                        jsonPath("$.path")
                                .value(
                                        "/api/admin/equipment/99"
                                )
                );
    }

    @Test
    void updateEquipmentShouldReturn404WhenEquipmentDoesNotExist()
            throws Exception {
        when(
                equipmentService.updateEquipment(
                        eq(99L),
                        any()
                )
        ).thenThrow(
                new ResourceNotFoundException(
                        "Equipment not found with id: 99"
                )
        );

        mockMvc.perform(
                        put(
                                "/api/admin/equipment/99"
                        )
                                .contentType(
                                        APPLICATION_JSON
                                )
                                .content(
                                        validEquipmentJson()
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
                        jsonPath("$.path")
                                .value(
                                        "/api/admin/equipment/99"
                                )
                );
    }

    @Test
    void updateActiveStatusShouldReturn404WhenEquipmentDoesNotExist()
            throws Exception {
        when(
                equipmentService
                        .updateActiveStatus(
                                99L,
                                false
                        )
        ).thenThrow(
                new ResourceNotFoundException(
                        "Equipment not found with id: 99"
                )
        );

        mockMvc.perform(
                        put(
                                "/api/admin/equipment/99/active"
                        )
                                .contentType(
                                        APPLICATION_JSON
                                )
                                .content(
                                        """
                                        {
                                          "active": false
                                        }
                                        """
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
                        jsonPath("$.path")
                                .value(
                                        "/api/admin/equipment/99/active"
                                )
                );
    }

    @Test
    void getQrCodeShouldReturn404WhenEquipmentDoesNotExist()
            throws Exception {
        when(
                equipmentService
                        .getEquipmentById(99L)
        ).thenThrow(
                new ResourceNotFoundException(
                        "Equipment not found with id: 99"
                )
        );

        mockMvc.perform(
                        get(
                                "/api/admin/equipment/99/qr"
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
                        jsonPath("$.error")
                                .value("Not Found")
                )
                .andExpect(
                        jsonPath("$.message")
                                .value(
                                        "Requested resource was not found."
                                )
                )
                .andExpect(
                        jsonPath("$.path")
                                .value(
                                        "/api/admin/equipment/99/qr"
                                )
                );
    }

    private String validEquipmentJson() {
        return """
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
    }

    private LocalValidatorFactoryBean
    validator() {
        LocalValidatorFactoryBean validator =
                new LocalValidatorFactoryBean();

        validator.afterPropertiesSet();

        return validator;
    }
}