package com.norops.hockeylan.dto;

import com.norops.hockeylan.model.EquipmentType;
import java.time.LocalDateTime;

public record EquipmentResponseDTO(
        Long id,
        EquipmentType type,
        String serialNumber,
        String description,
        boolean available,
        LocalDateTime createdDate
) {
}
