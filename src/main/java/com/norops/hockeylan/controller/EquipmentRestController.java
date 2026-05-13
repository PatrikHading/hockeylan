package com.norops.hockeylan.controller;

import com.norops.hockeylan.model.EquipmentType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/equipment")
public class EquipmentRestController {

    @GetMapping("/types")
    public ResponseEntity<List<String>> getEquipmentTypes() {
        List<String> equipmentTypes = Arrays.stream(EquipmentType.values())
                .map(Enum::name)
                .toList();

        return ResponseEntity.ok(equipmentTypes);
    }
}