package com.norops.hockeylan.dto;

import com.norops.hockeylan.model.AgeCategory;
import com.norops.hockeylan.model.EquipmentCondition;
import com.norops.hockeylan.model.EquipmentType;

public record QrCodeResponseDTO(
        String serialNumber,
        EquipmentType type,
        String size,
        String brand,
        String model,
        EquipmentCondition condition,
        AgeCategory ageCategory,
        String description,
        boolean available,
        boolean active,
        String loanUrl,
        String qrCodeBase64
) {
}