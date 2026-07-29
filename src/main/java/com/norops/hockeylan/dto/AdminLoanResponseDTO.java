package com.norops.hockeylan.dto;

import java.time.LocalDateTime;

public record AdminLoanResponseDTO(
        Long id,
        EquipmentResponseDTO equipment,
        String borrowerName,
        String email,
        String phoneNumber,
        LocalDateTime loanDate,
        boolean returned
) {
}