package com.norops.hockeylan.mapper;

import com.norops.hockeylan.dto.AdminLoanResponseDTO;
import com.norops.hockeylan.dto.LoanResponseDTO;
import com.norops.hockeylan.model.Loan;

public final class LoanMapper {

    private LoanMapper() {
    }

    public static LoanResponseDTO toPublicResponseDTO(
            Loan loan
    ) {
        return new LoanResponseDTO(
                loan.getId(),
                EquipmentMapper.toResponseDTO(
                        loan.getEquipment()
                ),
                loan.getLoanDate(),
                loan.isReturned()
        );
    }

    public static AdminLoanResponseDTO toAdminResponseDTO(
            Loan loan
    ) {
        return new AdminLoanResponseDTO(
                loan.getId(),
                EquipmentMapper.toResponseDTO(
                        loan.getEquipment()
                ),
                loan.getBorrowerName(),
                loan.getEmail(),
                loan.getPhoneNumber(),
                loan.getLoanDate(),
                loan.isReturned(),
                loan.getReturnedAt()
        );
    }
}