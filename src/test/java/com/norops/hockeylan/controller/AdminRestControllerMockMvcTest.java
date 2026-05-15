package com.norops.hockeylan.controller;

import com.norops.hockeylan.exception.BusinessRuleException;
import com.norops.hockeylan.exception.DuplicateResourceException;
import com.norops.hockeylan.exception.GlobalExceptionHandler;
import com.norops.hockeylan.exception.ResourceNotFoundException;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AdminRestControllerMockMvcTest {

    private MockMvc mockMvc;

    @Mock
    private EquipmentService equipmentService;

    @Mock
    private LoanService loanService;

    @BeforeEach
    void setUp() {
        AdminRestController controller =
                new AdminRestController(equipmentService, loanService);

        ReflectionTestUtils.setField(
                controller,
                "qrBaseUrl",
                "http://localhost:5173"
        );

        mockMvc = MockMvcBuilders
                .standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setValidator(validator())
                .build();
    }

    @Test
    void addEquipmentShouldReturn409WhenSerialNumberAlreadyExists() throws Exception {
        when(equipmentService.addEquipment(any()))
                .thenThrow(new DuplicateResourceException(
                        "Equipment with serial number already exists: HELMET-001"
                ));

        String json = """
                {
                  "type": "HELMET",
                  "serialNumber": "HELMET-001",
                  "description": "Bauer hjälm"
                }
                """;

        mockMvc.perform(post("/api/admin/equipment")
                        .contentType(APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message").value("Resource already exists."))
                .andExpect(jsonPath("$.path").value("/api/admin/equipment"));
    }

    @Test
    void addEquipmentShouldReturn400ForMalformedJson() throws Exception {
        String malformedJson = """
                {
                  "type": "HELMET",
                  "serialNumber": "HELMET-001",
                }
                """;

        mockMvc.perform(post("/api/admin/equipment")
                        .contentType(APPLICATION_JSON)
                        .content(malformedJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Malformed JSON"))
                .andExpect(jsonPath("$.message")
                        .value("Request body is missing, malformed or contains invalid values."))
                .andExpect(jsonPath("$.path").value("/api/admin/equipment"));
    }

    @Test
    void addEquipmentShouldReturn400ForValidationError() throws Exception {
        String json = """
                {
                  "type": null,
                  "serialNumber": "",
                  "description": "Invalid equipment"
                }
                """;

        mockMvc.perform(post("/api/admin/equipment")
                        .contentType(APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Validation Error"))
                .andExpect(jsonPath("$.message").isNotEmpty())
                .andExpect(jsonPath("$.path").value("/api/admin/equipment"));
    }

    @Test
    void getQrCodeShouldReturn404WhenEquipmentDoesNotExist() throws Exception {
        when(equipmentService.getEquipmentById(99L))
                .thenThrow(new ResourceNotFoundException(
                        "Equipment not found with id: 99"
                ));

        mockMvc.perform(get("/api/admin/equipment/99/qr"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Requested resource was not found."))
                .andExpect(jsonPath("$.path").value("/api/admin/equipment/99/qr"));
    }

    @Test
    void markAsReturnedShouldReturn409WhenNoActiveLoanExists() throws Exception {
        Equipment equipment = new Equipment(
                EquipmentType.HELMET,
                "HELMET-001",
                "Bauer hjälm"
        );
        equipment.setId(1L);
        equipment.setAvailable(true);

        when(equipmentService.getEquipmentById(1L))
                .thenReturn(equipment);

        when(loanService.markReturned(equipment))
                .thenThrow(new BusinessRuleException(
                        "Inget aktivt lån hittades för denna utrustning."
                ));

        mockMvc.perform(put("/api/admin/equipment/1/returned"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Business Rule Violation"))
                .andExpect(jsonPath("$.message")
                        .value("Inget aktivt lån hittades för denna utrustning."))
                .andExpect(jsonPath("$.path").value("/api/admin/equipment/1/returned"));
    }

    private LocalValidatorFactoryBean validator() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();
        return validator;
    }
}