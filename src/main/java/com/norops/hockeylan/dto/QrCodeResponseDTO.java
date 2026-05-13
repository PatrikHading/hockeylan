package com.norops.hockeylan.dto;

import com.norops.hockeylan.model.EquipmentType;

public record QrCodeResponseDTO(
        String serialNumber,
        EquipmentType type,
        String description,
        boolean available,
        String loanUrl,
        String qrCodeBase64
) {
}