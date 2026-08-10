package com.norops.hockeylan.controller;

import com.norops.hockeylan.dto.BorrowerAliasResponseDTO;
import com.norops.hockeylan.dto.BorrowerAliasSummaryDTO;
import com.norops.hockeylan.exception.GlobalExceptionHandler;
import com.norops.hockeylan.exception.ResourceNotFoundException;
import com.norops.hockeylan.service.BorrowerAliasService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class BorrowerAliasRestControllerTest {

    private MockMvc mockMvc;

    @Mock
    private BorrowerAliasService
            borrowerAliasService;

    @BeforeEach
    void setUp() {
        BorrowerAliasRestController
                controller =
                new BorrowerAliasRestController(
                        borrowerAliasService
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
    void getAliasesShouldReturnSummaryList()
            throws Exception {
        when(
                borrowerAliasService
                        .getAliasSummaries()
        ).thenReturn(
                List.of(
                        new BorrowerAliasSummaryDTO(
                                1L,
                                "Patrik"
                        ),
                        new BorrowerAliasSummaryDTO(
                                2L,
                                "Tränare U12"
                        )
                )
        );

        mockMvc.perform(
                        get(
                                "/api/admin/borrower-aliases"
                        )
                )
                .andExpect(
                        status().isOk()
                )
                .andExpect(
                        jsonPath("$[0].id")
                                .value(1L)
                )
                .andExpect(
                        jsonPath(
                                "$[0].aliasName"
                        ).value("Patrik")
                )
                .andExpect(
                        jsonPath(
                                "$[0].borrowerName"
                        ).doesNotExist()
                )
                .andExpect(
                        jsonPath(
                                "$[0].email"
                        ).doesNotExist()
                )
                .andExpect(
                        jsonPath(
                                "$[0].phoneNumber"
                        ).doesNotExist()
                )
                .andExpect(
                        jsonPath("$[1].id")
                                .value(2L)
                )
                .andExpect(
                        jsonPath(
                                "$[1].aliasName"
                        ).value(
                                "Tränare U12"
                        )
                );

        verify(
                borrowerAliasService
        ).getAliasSummaries();
    }

    @Test
    void getAliasesShouldReturnEmptyList()
            throws Exception {
        when(
                borrowerAliasService
                        .getAliasSummaries()
        ).thenReturn(
                List.of()
        );

        mockMvc.perform(
                        get(
                                "/api/admin/borrower-aliases"
                        )
                )
                .andExpect(
                        status().isOk()
                )
                .andExpect(
                        jsonPath("$")
                                .isArray()
                )
                .andExpect(
                        jsonPath("$")
                                .isEmpty()
                );
    }

    @Test
    void getAliasShouldReturnSelectedAliasDetails()
            throws Exception {
        when(
                borrowerAliasService
                        .getAlias(7L)
        ).thenReturn(
                new BorrowerAliasResponseDTO(
                        7L,
                        "Patrik",
                        "Patrik Hading",
                        "patrik@example.com",
                        "0701234567"
                )
        );

        mockMvc.perform(
                        get(
                                "/api/admin/borrower-aliases/7"
                        )
                )
                .andExpect(
                        status().isOk()
                )
                .andExpect(
                        jsonPath("$.id")
                                .value(7L)
                )
                .andExpect(
                        jsonPath(
                                "$.aliasName"
                        ).value("Patrik")
                )
                .andExpect(
                        jsonPath(
                                "$.borrowerName"
                        ).value(
                                "Patrik Hading"
                        )
                )
                .andExpect(
                        jsonPath("$.email")
                                .value(
                                        "patrik@example.com"
                                )
                )
                .andExpect(
                        jsonPath(
                                "$.phoneNumber"
                        ).value(
                                "0701234567"
                        )
                );

        verify(
                borrowerAliasService
        ).getAlias(7L);
    }

    @Test
    void getAliasShouldReturnNotFoundForUnknownAlias()
            throws Exception {
        when(
                borrowerAliasService
                        .getAlias(999L)
        ).thenThrow(
                new ResourceNotFoundException(
                        "Alias not found with id: 999"
                )
        );

        mockMvc.perform(
                        get(
                                "/api/admin/borrower-aliases/999"
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
                        jsonPath("$.code")
                                .value(
                                        "RESOURCE_NOT_FOUND"
                                )
                );
    }
}