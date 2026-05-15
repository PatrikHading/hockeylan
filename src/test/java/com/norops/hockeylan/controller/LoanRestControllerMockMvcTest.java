package com.norops.hockeylan.controller;

import com.norops.hockeylan.exception.BusinessRuleException;
import com.norops.hockeylan.exception.GlobalExceptionHandler;
import com.norops.hockeylan.exception.ResourceNotFoundException;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class LoanRestControllerMockMvcTest {

    private MockMvc mockMvc;

    @Mock
    private EquipmentService equipmentService;

    @Mock
    private LoanService loanService;

    @BeforeEach
    void setUp() {
        LoanRestController controller =
                new LoanRestController(equipmentService, loanService);

        mockMvc = MockMvcBuilders
                .standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setValidator(validator())
                .build();
    }

    @Test
    void getEquipmentForLoanShouldReturn404WhenEquipmentDoesNotExist() throws Exception {
        when(equipmentService.getEquipmentBySerialNumber("UNKNOWN"))
                .thenThrow(new ResourceNotFoundException(
                        "Equipment not found with serial number: UNKNOWN"
                ));

        mockMvc.perform(get("/api/loan/UNKNOWN"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Requested resource was not found."))
                .andExpect(jsonPath("$.path").value("/api/loan/UNKNOWN"));
    }

    @Test
    void registerLoanShouldReturn409WhenEquipmentIsAlreadyLoaned() throws Exception {
        when(loanService.registerLoan(eq("HELMET-001"), any()))
                .thenThrow(new BusinessRuleException(
                        "Utrustningen är redan utlånad."
                ));

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
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Business Rule Violation"))
                .andExpect(jsonPath("$.message").value("Utrustningen är redan utlånad."))
                .andExpect(jsonPath("$.path").value("/api/loan/HELMET-001"));
    }

    @Test
    void registerLoanShouldReturn404WhenEquipmentDoesNotExist() throws Exception {
        when(loanService.registerLoan(eq("UNKNOWN"), any()))
                .thenThrow(new ResourceNotFoundException(
                        "Equipment not found with serial number: UNKNOWN"
                ));

        String json = """
                {
                  "borrowerName": "Patrik Hading",
                  "email": "patrik@example.com",
                  "phoneNumber": "+46701234567"
                }
                """;

        mockMvc.perform(post("/api/loan/UNKNOWN")
                        .contentType(APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Requested resource was not found."))
                .andExpect(jsonPath("$.path").value("/api/loan/UNKNOWN"));
    }

    @Test
    void registerLoanShouldReturn400ForMalformedJson() throws Exception {
        String malformedJson = """
                {
                  "borrowerName": "Patrik Hading",
                  "email": "patrik@example.com",
                  "phoneNumber": "+46701234567",
                }
                """;

        mockMvc.perform(post("/api/loan/HELMET-001")
                        .contentType(APPLICATION_JSON)
                        .content(malformedJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Malformed JSON"))
                .andExpect(jsonPath("$.message")
                        .value("Request body is missing, malformed or contains invalid values."))
                .andExpect(jsonPath("$.path").value("/api/loan/HELMET-001"));
    }

    @Test
    void registerLoanShouldReturn400ForValidationError() throws Exception {
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
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Validation Error"))
                .andExpect(jsonPath("$.message").isNotEmpty())
                .andExpect(jsonPath("$.path").value("/api/loan/HELMET-001"));
    }

    private LocalValidatorFactoryBean validator() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();
        return validator;
    }
}