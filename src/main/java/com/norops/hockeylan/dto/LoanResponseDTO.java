package com.norops.hockeylan.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record LoanResponseDTO(
        Long id,
        EquipmentResponseDTO equipment,
        LocalDateTime loanDate,
        LocalDate expectedReturnDate,
        boolean returned,
        LocalDateTime returnedAt,
        boolean overdue,
        boolean returnedLate
) {
}