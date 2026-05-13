package com.norops.hockeylan.dto;

public record QrCodeResponseDTO(
        String serialNumber,
        String loanUrl,
        String qrCodeBase64
) {
}
