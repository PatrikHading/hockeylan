package com.norops.hockeylan.mapper;

import com.norops.hockeylan.dto.EquipmentResponseDTO;
import com.norops.hockeylan.model.Equipment;

public final class EquipmentMapper {

    private EquipmentMapper() {
    }

    public static EquipmentResponseDTO toResponseDTO(
            Equipment equipment
    ) {
        return new EquipmentResponseDTO(
                equipment.getId(),
                equipment.getType(),
                equipment.getSerialNumber(),
                equipment.getSize(),
                equipment.getBrand(),
                equipment.getModel(),
                equipment.getCondition(),
                equipment.getAgeCategory(),
                equipment.getStorageLocation(),
                equipment.getDescription(),
                equipment.isAvailable(),
                equipment.isActive(),
                equipment.getCreatedDate(),
                equipment.getUpdatedDate()
        );
    }
}