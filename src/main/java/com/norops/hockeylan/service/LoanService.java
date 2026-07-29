package com.norops.hockeylan.service;

import com.norops.hockeylan.dto.LoanFormDTO;
import com.norops.hockeylan.exception.BusinessRuleException;
import com.norops.hockeylan.exception.ResourceNotFoundException;
import com.norops.hockeylan.model.Equipment;
import com.norops.hockeylan.model.Loan;
import com.norops.hockeylan.repository.EquipmentRepository;
import com.norops.hockeylan.repository.LoanRepository;
import com.norops.hockeylan.util.InputSanitizer;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class LoanService {

    private static final Logger log =
            LoggerFactory.getLogger(LoanService.class);

    private final LoanRepository loanRepository;
    private final EquipmentRepository equipmentRepository;

    public Loan registerLoan(
            String serialNumber,
            LoanFormDTO loanFormDTO
    ) {
        validateLoanForm(loanFormDTO);

        String sanitizedSerialNumber =
                InputSanitizer.cleanSerialNumber(serialNumber);

        Equipment equipment = equipmentRepository
                .findBySerialNumberIgnoreCaseForUpdate(
                        sanitizedSerialNumber
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Equipment not found with serial number: "
                                        + sanitizedSerialNumber
                        )
                );

        if (!equipment.isAvailable()) {
            throw new BusinessRuleException(
                    "Utrustningen är redan utlånad."
            );
        }

        if (loanRepository
                .existsByEquipmentAndReturnedFalse(equipment)) {
            throw new BusinessRuleException(
                    "Utrustningen har redan ett aktivt lån."
            );
        }

        Loan loan = new Loan(
                equipment,
                InputSanitizer.cleanText(
                        loanFormDTO.getBorrowerName()
                ),
                InputSanitizer.cleanEmail(
                        loanFormDTO.getEmail()
                ),
                InputSanitizer.cleanPhoneNumber(
                        loanFormDTO.getPhoneNumber()
                )
        );

        equipment.setAvailable(false);

        Loan savedLoan = loanRepository.save(loan);
        equipmentRepository.save(equipment);

        log.info(
                "Registered loan with id {} for equipment serial number {}",
                savedLoan.getId(),
                equipment.getSerialNumber()
        );

        return savedLoan;
    }

    @Transactional(readOnly = true)
    public List<Loan> getActiveLoans() {
        return loanRepository
                .findByReturnedFalseOrderByLoanDateAsc();
    }

    public Loan markReturned(Long loanId) {
        Loan loan = loanRepository.findByIdForUpdate(loanId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Loan not found with id: " + loanId
                        )
                );

        if (loan.isReturned()) {
            throw new BusinessRuleException(
                    "Lånet är redan återlämnat."
            );
        }

        Equipment equipment = equipmentRepository
                .findByIdForUpdate(loan.getEquipment().getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Equipment not found with id: "
                                        + loan.getEquipment().getId()
                        )
                );

        loan.setEquipment(equipment);
        loan.registerReturn(LocalDateTime.now());
        equipment.setAvailable(true);

        Loan savedLoan = loanRepository.save(loan);
        equipmentRepository.save(equipment);

        log.info(
                "Marked loan {} as returned at {} for equipment {}",
                savedLoan.getId(),
                savedLoan.getReturnedAt(),
                equipment.getSerialNumber()
        );

        return savedLoan;
    }

    private void validateLoanForm(LoanFormDTO loanFormDTO) {
        if (loanFormDTO == null) {
            throw new BusinessRuleException(
                    "Låneformulär saknas."
            );
        }

        if (loanFormDTO.getBorrowerName() == null
                || loanFormDTO.getBorrowerName().isBlank()) {
            throw new BusinessRuleException(
                    "Namn måste anges."
            );
        }

        if (loanFormDTO.getEmail() == null
                || loanFormDTO.getEmail().isBlank()) {
            throw new BusinessRuleException(
                    "E-post måste anges."
            );
        }

        if (loanFormDTO.getPhoneNumber() == null
                || loanFormDTO.getPhoneNumber().isBlank()) {
            throw new BusinessRuleException(
                    "Telefonnummer måste anges."
            );
        }
    }
}