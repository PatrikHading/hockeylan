package com.norops.hockeylan.controller;

import com.norops.hockeylan.model.EquipmentType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;

@RestController
public class EquipmentRestController {

    @GetMapping("/api/equipment/types")
    public List<String> getEquipmentTypes() {
        return Arrays.stream(EquipmentType.values())
                .map(Enum::name)
                .toList();
    }
}