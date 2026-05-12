package com.norops.hockeylan.dto;

import com.norops.hockeylan.model.EquipmentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EquipmentDTO {

    @NotNull(message = "Equipment type is required")
    private EquipmentType type;

    @NotBlank(message = "Serial number is required")
    @Size(max = 100, message = "Serial number must be max 100 characters")
    private String serialNumber;

    @Size(max = 500, message = "Description must be max 500 characters")
    private String description;
}
