package com.norops.hockeylan.dto;

import com.norops.hockeylan.model.AgeCategory;
import com.norops.hockeylan.model.EquipmentCondition;
import com.norops.hockeylan.model.EquipmentType;

import java.time.LocalDateTime;

public record EquipmentResponseDTO(
        Long id,
        EquipmentType type,
        String serialNumber,
        String size,
        String brand,
        String model,
        EquipmentCondition condition,
        AgeCategory ageCategory,
        String storageLocation,
        String description,
        boolean available,
        boolean active,
        LocalDateTime createdDate,
        LocalDateTime updatedDate
) {
}