package com.norops.hockeylan.controller;

import com.norops.hockeylan.dto.EquipmentResponseDTO;
import com.norops.hockeylan.dto.LoanFormDTO;
import com.norops.hockeylan.dto.LoanResponseDTO;
import com.norops.hockeylan.mapper.EquipmentMapper;
import com.norops.hockeylan.mapper.LoanMapper;
import com.norops.hockeylan.model.Equipment;
import com.norops.hockeylan.model.Loan;
import com.norops.hockeylan.service.EquipmentService;
import com.norops.hockeylan.service.LoanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/loan")
@RequiredArgsConstructor
public class LoanRestController {

    private final EquipmentService equipmentService;
    private final LoanService loanService;

    @GetMapping("/{serialNumber}")
    public ResponseEntity<EquipmentResponseDTO> getEquipmentforLoan(@PathVariable String serialNumber) {
        Equipment equipment = equipmentService.getEquipmentBySerialNumber(serialNumber);

        return ResponseEntity.ok(EquipmentMapper.toResponseDTO(equipment));
    }

    @PostMapping("/{serialNumber}")
    public ResponseEntity<LoanResponseDTO> registerLoan(
            @PathVariable String serialNumber,
            @Valid @RequestBody LoanFormDTO loanFormDTO
    ) {
        Loan loan = loanService.registerLoan(serialNumber, loanFormDTO);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(LoanMapper.toResponseDTO(loan));
    }

}
