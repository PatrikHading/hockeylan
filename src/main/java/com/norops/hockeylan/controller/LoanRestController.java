package com.norops.hockeylan.controller;

import com.norops.hockeylan.dto.LoanFormDTO;
import com.norops.hockeylan.model.Equipment;
import com.norops.hockeylan.model.Loan;
import com.norops.hockeylan.service.EquipmentService;
import com.norops.hockeylan.service.LoanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/loan")
@RequiredArgsConstructor
public class LoanRestController {

    private final EquipmentService equipmentService;
    private final LoanService loanService;

    @GetMapping("/{serialNumber}")
    public Equipment getEquipmentForLoan(@PathVariable String serialNumber) {
        return equipmentService.getEquipmentBySerialNumber(serialNumber);
    }

    @PostMapping("/{serialNumber}")
    public Loan registerLoan(
            @PathVariable String serialNumber,
            @Valid @RequestBody LoanFormDTO loanFormDTO
    ) {
        return loanService.registerLoan(serialNumber, loanFormDTO);
    }


}
