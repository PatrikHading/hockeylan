package com.norops.hockeylan.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LoanFormDTOValidationTest {

    private static ValidatorFactory
            validatorFactory;

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        validatorFactory =
                Validation
                        .buildDefaultValidatorFactory();

        validator =
                validatorFactory
                        .getValidator();
    }

    @AfterAll
    static void closeValidatorFactory() {
        validatorFactory.close();
    }

    @Test
    void missingExpectedReturnDateShouldBeValid() {
        LoanFormDTO dto =
                validLoanForm();

        dto.setExpectedReturnDate(
                null
        );

        Set<
                ConstraintViolation<LoanFormDTO>
                > violations =
                validator.validate(dto);

        assertFalse(
                hasViolationFor(
                        violations,
                        "expectedReturnDate"
                )
        );
    }

    @Test
    void futureExpectedReturnDateShouldBeValid() {
        LoanFormDTO dto =
                validLoanForm();

        dto.setExpectedReturnDate(
                LocalDate.now()
                        .plusDays(1)
        );

        Set<
                ConstraintViolation<LoanFormDTO>
                > violations =
                validator.validate(dto);

        assertFalse(
                hasViolationFor(
                        violations,
                        "expectedReturnDate"
                )
        );
    }

    @Test
    void pastExpectedReturnDateShouldBeInvalid() {
        LoanFormDTO dto =
                validLoanForm();

        dto.setExpectedReturnDate(
                LocalDate.now()
                        .minusDays(1)
        );

        Set<
                ConstraintViolation<LoanFormDTO>
                > violations =
                validator.validate(dto);

        assertTrue(
                hasViolationFor(
                        violations,
                        "expectedReturnDate"
                )
        );
    }

    @Test
    void missingAliasNameShouldBeValid() {
        LoanFormDTO dto =
                validLoanForm();

        dto.setAliasName(null);

        Set<
                ConstraintViolation<LoanFormDTO>
                > violations =
                validator.validate(dto);

        assertFalse(
                hasViolationFor(
                        violations,
                        "aliasName"
                )
        );
    }

    @Test
    void validAliasNameShouldBeValid() {
        LoanFormDTO dto =
                validLoanForm();

        dto.setAliasName(
                "Tränare U12"
        );

        Set<
                ConstraintViolation<LoanFormDTO>
                > violations =
                validator.validate(dto);

        assertFalse(
                hasViolationFor(
                        violations,
                        "aliasName"
                )
        );
    }

    @Test
    void blankAliasNameShouldBeInvalid() {
        LoanFormDTO dto =
                validLoanForm();

        dto.setAliasName(
                "   "
        );

        Set<
                ConstraintViolation<LoanFormDTO>
                > violations =
                validator.validate(dto);

        assertTrue(
                hasViolationFor(
                        violations,
                        "aliasName"
                )
        );
    }

    @Test
    void tooShortAliasNameShouldBeInvalid() {
        LoanFormDTO dto =
                validLoanForm();

        dto.setAliasName(
                "A"
        );

        Set<
                ConstraintViolation<LoanFormDTO>
                > violations =
                validator.validate(dto);

        assertTrue(
                hasViolationFor(
                        violations,
                        "aliasName"
                )
        );
    }

    @Test
    void tooLongAliasNameShouldBeInvalid() {
        LoanFormDTO dto =
                validLoanForm();

        dto.setAliasName(
                "A".repeat(101)
        );

        Set<
                ConstraintViolation<LoanFormDTO>
                > violations =
                validator.validate(dto);

        assertTrue(
                hasViolationFor(
                        violations,
                        "aliasName"
                )
        );
    }

    private boolean hasViolationFor(
            Set<
                    ConstraintViolation<LoanFormDTO>
                    > violations,
            String field
    ) {
        return violations
                .stream()
                .anyMatch(
                        violation ->
                                violation
                                        .getPropertyPath()
                                        .toString()
                                        .equals(field)
                );
    }

    private LoanFormDTO validLoanForm() {
        LoanFormDTO dto =
                new LoanFormDTO();

        dto.setBorrowerName(
                "Patrik Hading"
        );

        dto.setEmail(
                "patrik@example.com"
        );

        dto.setPhoneNumber(
                "+46701234567"
        );

        dto.setExpectedReturnDate(
                LocalDate.now()
                        .plusDays(1)
        );

        return dto;
    }
}