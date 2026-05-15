package com.norops.hockeylan.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;

class LoanTest {

    @Test
    void constructorShouldNormalizeBorrowerDataAndMarkLoanAsActive() {
        Equipment equipment = new Equipment(
                EquipmentType.SKATES,
                "skates-001",
                "CCM skridskor"
        );

        Loan loan = new Loan(
                equipment,
                "  Patrik Hading  ",
                "  PATRIK@example.COM  ",
                "  +46 70 123 45 67  "
        );

        assertSame(equipment, loan.getEquipment());
        assertEquals("Patrik Hading", loan.getBorrowerName());
        assertEquals("patrik@example.com", loan.getEmail());
        assertEquals("+46 70 123 45 67", loan.getPhoneNumber());
        assertFalse(loan.isReturned());
    }
}