package com.norops.hockeylan.dto;

import java.time.LocalDateTime;

public record LoanResponseDTO(
        Long id,
        EquipmentResponseDTO equipment,
        LocalDateTime loanDate,
        boolean returned
) {
}