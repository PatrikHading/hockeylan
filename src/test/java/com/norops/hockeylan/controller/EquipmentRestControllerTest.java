package com.norops.hockeylan.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.hamcrest.Matchers.hasItems;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class EquipmentRestControllerTest {

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        EquipmentRestController controller = new EquipmentRestController();

        mockMvc = MockMvcBuilders
                .standaloneSetup(controller)
                .build();
    }

    @Test
    void getEquipmentTypesShouldReturnAllEquipmentTypes() throws Exception {
        mockMvc.perform(get("/api/equipment/types"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasItems(
                        "COMPLETE_KIT",
                        "HELMET",
                        "SKATES",
                        "STICK"
                )));
    }
}