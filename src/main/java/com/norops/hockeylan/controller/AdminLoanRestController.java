package com.norops.hockeylan.controller;

import com.norops.hockeylan.dto.AdminLoanResponseDTO;
import com.norops.hockeylan.dto.LoanFormDTO;
import com.norops.hockeylan.mapper.LoanMapper;
import com.norops.hockeylan.model.Loan;
import com.norops.hockeylan.service.LoanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Clock;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/loans")
@RequiredArgsConstructor
public class AdminLoanRestController {

    private final LoanService
            loanService;

    private final Clock applicationClock;

    @PostMapping("/{serialNumber}")
    public ResponseEntity<
            AdminLoanResponseDTO
            > registerLoan(
            @PathVariable
            String serialNumber,

            @Valid
            @RequestBody
            LoanFormDTO loanFormDTO
    ) {
        Loan loan =
                loanService.registerLoan(
                        serialNumber,
                        loanFormDTO
                );

        LocalDate currentDate =
                LocalDate.now(
                        applicationClock
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        LoanMapper
                                .toAdminResponseDTO(
                                        loan,
                                        currentDate
                                )
                );
    }
}