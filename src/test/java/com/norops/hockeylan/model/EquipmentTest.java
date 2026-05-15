package com.norops.hockeylan.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class EquipmentTest {

    @Test
    void constructorShouldNormalizeSerialNumberAndDescription() {
        Equipment equipment = new Equipment(
                EquipmentType.HELMET,
                "  helmet-001  ",
                "  Bauer hjälm medium  "
        );

        assertEquals(EquipmentType.HELMET, equipment.getType());
        assertEquals("HELMET-001", equipment.getSerialNumber());
        assertEquals("Bauer hjälm medium", equipment.getDescription());
        assertTrue(equipment.isAvailable());
    }

    @Test
    void constructorShouldConvertBlankDescriptionToNull() {
        Equipment equipment = new Equipment(
                EquipmentType.STICK,
                "stick-001",
                "   "
        );

        assertNull(equipment.getDescription());
    }
}