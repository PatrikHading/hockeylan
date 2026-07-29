package com.norops.hockeylan.dto;

import com.norops.hockeylan.model.AgeCategory;
import com.norops.hockeylan.model.EquipmentCondition;
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

    @NotNull(
            message =
                    "Equipment type is required"
    )
    private EquipmentType type;

    @NotBlank(
            message =
                    "Serial number is required"
    )
    @Size(
            min = 2,
            max = 50,
            message =
                    "Serial number must be between 2 and 50 characters"
    )
    @Pattern(
            regexp = "^[A-Za-z0-9\\-_]+$",
            message =
                    "Serial number may only contain letters, numbers, hyphen and underscore"
    )
    private String serialNumber;

    @Size(
            max = 50,
            message =
                    "Size must be max 50 characters"
    )
    private String size;

    @Size(
            max = 100,
            message =
                    "Brand must be max 100 characters"
    )
    private String brand;

    @Size(
            max = 100,
            message =
                    "Model must be max 100 characters"
    )
    private String model;

    @NotNull(
            message =
                    "Equipment condition is required"
    )
    private EquipmentCondition condition;

    private AgeCategory ageCategory;

    @Size(
            max = 100,
            message =
                    "Storage location must be max 100 characters"
    )
    private String storageLocation;

    @Size(
            max = 500,
            message =
                    "Description must be max 500 characters"
    )
    private String description;
}