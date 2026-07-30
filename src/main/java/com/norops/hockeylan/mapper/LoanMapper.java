package com.norops.hockeylan.mapper;

import com.norops.hockeylan.dto.AdminLoanResponseDTO;
import com.norops.hockeylan.dto.LoanResponseDTO;
import com.norops.hockeylan.model.Loan;

import java.time.LocalDate;
import java.util.Objects;

public final class LoanMapper {

    private LoanMapper() {
    }

    public static LoanResponseDTO
    toPublicResponseDTO(
            Loan loan
    ) {
        return toPublicResponseDTO(
                loan,
                LocalDate.now()
        );
    }

    public static LoanResponseDTO
    toPublicResponseDTO(
            Loan loan,
            LocalDate currentDate
    ) {
        validateArguments(
                loan,
                currentDate
        );

        return new LoanResponseDTO(
                loan.getId(),
                EquipmentMapper.toResponseDTO(
                        loan.getEquipment()
                ),
                loan.getLoanDate(),
                loan.getExpectedReturnDate(),
                loan.isReturned(),
                loan.getReturnedAt(),
                loan.isOverdue(
                        currentDate
                ),
                loan.wasReturnedLate()
        );
    }

    public static AdminLoanResponseDTO
    toAdminResponseDTO(
            Loan loan
    ) {
        return toAdminResponseDTO(
                loan,
                LocalDate.now()
        );
    }

    public static AdminLoanResponseDTO
    toAdminResponseDTO(
            Loan loan,
            LocalDate currentDate
    ) {
        validateArguments(
                loan,
                currentDate
        );

        return new AdminLoanResponseDTO(
                loan.getId(),
                EquipmentMapper.toResponseDTO(
                        loan.getEquipment()
                ),
                loan.getBorrowerName(),
                loan.getEmail(),
                loan.getPhoneNumber(),
                loan.getLoanDate(),
                loan.getExpectedReturnDate(),
                loan.isReturned(),
                loan.getReturnedAt(),
                loan.isOverdue(
                        currentDate
                ),
                loan.wasReturnedLate()
        );
    }

    private static void validateArguments(
            Loan loan,
            LocalDate currentDate
    ) {
        Objects.requireNonNull(
                loan,
                "Loan must not be null."
        );

        Objects.requireNonNull(
                currentDate,
                "Current date must not be null."
        );
    }
}