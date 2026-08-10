package com.norops.hockeylan.dto;

public record BorrowerAliasResponseDTO(
        Long id,
        String aliasName,
        String borrowerName,
        String email,
        String phoneNumber
) {
}