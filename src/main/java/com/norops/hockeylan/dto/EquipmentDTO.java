package com.norops.hockeylan.dto;

import com.norops.hockeylan.model.EquipmentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EquipmentDTO {

    @NotNull(message = "Equipment type is required")
    private EquipmentType type;

    @NotBlank(message = "Serial number is required")
    @Size(min = 2, max = 50, message = "Serial number must be between 2 and 50 characters")
    @Pattern(
            regexp = "^[A-Za-z0-9\\-_]+$",
            message = "Serial number may only contain letters, numbers, hyphen and underscore"
    )
    private String serialNumber;

    @Size(max = 300, message = "Description must be max 300 characters")
    private String description;
}