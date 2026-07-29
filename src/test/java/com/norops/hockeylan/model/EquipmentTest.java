package com.norops.hockeylan.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class EquipmentTest {

    @Test
    void extendedConstructorShouldNormalizeAllTextFields() {
        Equipment equipment = new Equipment(
                EquipmentType.HELMET,
                "  helmet-001  ",
                "  M  ",
                "  Bauer  ",
                "  Re-Akt 150  ",
                EquipmentCondition.GOOD,
                AgeCategory.JUNIOR,
                "  Hylla A2  ",
                "  Svart hjälm med visir  "
        );

        assertAll(
                () -> assertEquals(
                        EquipmentType.HELMET,
                        equipment.getType()
                ),
                () -> assertEquals(
                        "HELMET-001",
                        equipment.getSerialNumber()
                ),
                () -> assertEquals(
                        "M",
                        equipment.getSize()
                ),
                () -> assertEquals(
                        "Bauer",
                        equipment.getBrand()
                ),
                () -> assertEquals(
                        "Re-Akt 150",
                        equipment.getModel()
                ),
                () -> assertEquals(
                        EquipmentCondition.GOOD,
                        equipment.getCondition()
                ),
                () -> assertEquals(
                        AgeCategory.JUNIOR,
                        equipment.getAgeCategory()
                ),
                () -> assertEquals(
                        "Hylla A2",
                        equipment.getStorageLocation()
                ),
                () -> assertEquals(
                        "Svart hjälm med visir",
                        equipment.getDescription()
                ),
                () -> assertTrue(
                        equipment.isAvailable()
                ),
                () -> assertTrue(
                        equipment.isActive()
                )
        );
    }

    @Test
    void extendedConstructorShouldConvertBlankOptionalTextToNull() {
        Equipment equipment = new Equipment(
                EquipmentType.STICK,
                "stick-001",
                "   ",
                "\t",
                "",
                EquipmentCondition.WORN,
                null,
                "  ",
                "\n"
        );

        assertAll(
                () -> assertEquals(
                        "STICK-001",
                        equipment.getSerialNumber()
                ),
                () -> assertNull(
                        equipment.getSize()
                ),
                () -> assertNull(
                        equipment.getBrand()
                ),
                () -> assertNull(
                        equipment.getModel()
                ),
                () -> assertNull(
                        equipment.getAgeCategory()
                ),
                () -> assertNull(
                        equipment.getStorageLocation()
                ),
                () -> assertNull(
                        equipment.getDescription()
                ),
                () -> assertEquals(
                        EquipmentCondition.WORN,
                        equipment.getCondition()
                )
        );
    }

    @Test
    void extendedConstructorShouldUseGoodConditionWhenConditionIsNull() {
        Equipment equipment = new Equipment(
                EquipmentType.SKATES,
                "skates-001",
                "42",
                "CCM",
                "Jetspeed",
                null,
                AgeCategory.SENIOR,
                "Hylla B1",
                null
        );

        assertEquals(
                EquipmentCondition.GOOD,
                equipment.getCondition()
        );
    }

    @Test
    void legacyConstructorShouldRemainCompatible() {
        Equipment equipment = new Equipment(
                EquipmentType.COMPLETE_KIT,
                "  kit-001  ",
                "  Komplett juniorutrustning  "
        );

        assertAll(
                () -> assertEquals(
                        EquipmentType.COMPLETE_KIT,
                        equipment.getType()
                ),
                () -> assertEquals(
                        "KIT-001",
                        equipment.getSerialNumber()
                ),
                () -> assertEquals(
                        "Komplett juniorutrustning",
                        equipment.getDescription()
                ),
                () -> assertEquals(
                        EquipmentCondition.GOOD,
                        equipment.getCondition()
                ),
                () -> assertNull(
                        equipment.getSize()
                ),
                () -> assertNull(
                        equipment.getBrand()
                ),
                () -> assertNull(
                        equipment.getModel()
                ),
                () -> assertNull(
                        equipment.getAgeCategory()
                ),
                () -> assertNull(
                        equipment.getStorageLocation()
                ),
                () -> assertTrue(
                        equipment.isAvailable()
                ),
                () -> assertTrue(
                        equipment.isActive()
                )
        );
    }
}