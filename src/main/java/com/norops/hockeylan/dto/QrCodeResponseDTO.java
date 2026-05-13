package com.norops.hockeylan.dto;

public record QrCodeResponseDTO(
        String serialNumber,
        String loneUrl,
        String qrCodeBase64
) {
}
