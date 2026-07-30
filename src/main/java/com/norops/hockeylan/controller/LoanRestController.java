package com.norops.hockeylan.controller;

import com.norops.hockeylan.dto.EquipmentResponseDTO;
import com.norops.hockeylan.mapper.EquipmentMapper;
import com.norops.hockeylan.model.Equipment;
import com.norops.hockeylan.service.EquipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/loan")
@RequiredArgsConstructor
public class LoanRestController {

    private final EquipmentService
            equipmentService;

    @GetMapping("/{serialNumber}")
    public ResponseEntity<
            EquipmentResponseDTO
            > getEquipmentForLoan(
            @PathVariable
            String serialNumber
    ) {
        Equipment equipment =
                equipmentService
                        .getEquipmentBySerialNumber(
                                serialNumber
                        );

        return ResponseEntity.ok(
                EquipmentMapper
                        .toResponseDTO(
                                equipment
                        )
        );
    }
}