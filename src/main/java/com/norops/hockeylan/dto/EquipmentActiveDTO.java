package com.norops.hockeylan.dto;

import jakarta.validation.constraints.NotNull;

public record EquipmentActiveDTO(
        @NotNull(
                message =
                        "Active status is required"
        )
        Boolean active
) {
}