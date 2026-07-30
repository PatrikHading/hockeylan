package com.norops.hockeylan.model;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LoanTest {

    @Test
    void constructorShouldNormalizeBorrowerData() {
        Equipment equipment =
                equipment();

        Loan loan = new Loan(
                equipment,
                "  Patrik Hading  ",
                "  PATRIK@EXAMPLE.COM  ",
                "  +46 70 123 45 67  ",
                LocalDate.of(
                        2027,
                        4,
                        30
                )
        );

        assertEquals(
                "Patrik Hading",
                loan.getBorrowerName()
        );

        assertEquals(
                "patrik@example.com",
                loan.getEmail()
        );

        assertEquals(
                "+46 70 123 45 67",
                loan.getPhoneNumber()
        );

        assertEquals(
                LocalDate.of(
                        2027,
                        4,
                        30
                ),
                loan.getExpectedReturnDate()
        );

        assertFalse(
                loan.isReturned()
        );
    }

    @Test
    void activeLoanShouldBeOverdueAfterExpectedDate() {
        Loan loan = loanWithExpectedDate(
                LocalDate.of(
                        2026,
                        7,
                        29
                )
        );

        assertTrue(
                loan.isOverdue(
                        LocalDate.of(
                                2026,
                                7,
                                30
                        )
                )
        );
    }

    @Test
    void activeLoanShouldNotBeOverdueOnExpectedDate() {
        Loan loan = loanWithExpectedDate(
                LocalDate.of(
                        2026,
                        7,
                        30
                )
        );

        assertFalse(
                loan.isOverdue(
                        LocalDate.of(
                                2026,
                                7,
                                30
                        )
                )
        );
    }

    @Test
    void returnedLoanShouldNeverBeCurrentlyOverdue() {
        Loan loan = loanWithExpectedDate(
                LocalDate.of(
                        2026,
                        7,
                        29
                )
        );

        loan.setLoanDate(
                LocalDateTime.of(
                        2026,
                        7,
                        20,
                        10,
                        0
                )
        );

        loan.registerReturn(
                LocalDateTime.of(
                        2026,
                        7,
                        30,
                        12,
                        0
                )
        );

        assertFalse(
                loan.isOverdue(
                        LocalDate.of(
                                2026,
                                7,
                                31
                        )
                )
        );

        assertTrue(
                loan.wasReturnedLate()
        );
    }

    @Test
    void returnOnExpectedDateShouldNotBeLate() {
        Loan loan = loanWithExpectedDate(
                LocalDate.of(
                        2026,
                        7,
                        30
                )
        );

        loan.setLoanDate(
                LocalDateTime.of(
                        2026,
                        7,
                        20,
                        10,
                        0
                )
        );

        loan.registerReturn(
                LocalDateTime.of(
                        2026,
                        7,
                        30,
                        23,
                        59
                )
        );

        assertFalse(
                loan.wasReturnedLate()
        );
    }

    @Test
    void registerReturnShouldRejectTimeBeforeLoanTime() {
        Loan loan = loanWithExpectedDate(
                LocalDate.of(
                        2026,
                        8,
                        1
                )
        );

        loan.setLoanDate(
                LocalDateTime.of(
                        2026,
                        7,
                        30,
                        12,
                        0
                )
        );

        assertThrows(
                IllegalArgumentException.class,
                () -> loan.registerReturn(
                        LocalDateTime.of(
                                2026,
                                7,
                                30,
                                11,
                                59
                        )
                )
        );
    }

    @Test
    void registerReturnShouldRejectSecondReturn() {
        Loan loan = loanWithExpectedDate(
                LocalDate.of(
                        2026,
                        8,
                        1
                )
        );

        loan.setLoanDate(
                LocalDateTime.of(
                        2026,
                        7,
                        30,
                        12,
                        0
                )
        );

        loan.registerReturn(
                LocalDateTime.of(
                        2026,
                        7,
                        31,
                        12,
                        0
                )
        );

        assertThrows(
                IllegalStateException.class,
                () -> loan.registerReturn(
                        LocalDateTime.of(
                                2026,
                                8,
                                1,
                                12,
                                0
                        )
                )
        );
    }

    private Loan loanWithExpectedDate(
            LocalDate expectedReturnDate
    ) {
        return new Loan(
                equipment(),
                "Patrik Hading",
                "patrik@example.com",
                "+46701234567",
                expectedReturnDate
        );
    }

    private Equipment equipment() {
        return new Equipment(
                EquipmentType.HELMET,
                "HELMET-001",
                "Bauer hjälm"
        );
    }
}