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
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Equipment not found with serial number: "
                                + sanitizedSerialNumber
                ));

        if (!equipment.isAvailable()) {
            throw new BusinessRuleException(
                    "Utrustningen är redan utlånad."
            );
        }

        if (loanRepository.existsByEquipmentAndReturnedFalse(equipment)) {
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
        return loanRepository.findByReturnedFalseOrderByLoanDateAsc();
    }

    public Loan markReturned(Long loanId) {
        Loan activeLoan = loanRepository
                .findByIdAndReturnedFalse(loanId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Active loan not found with id: " + loanId
                ));

        completeReturn(activeLoan);

        return activeLoan;
    }

    public Equipment markReturned(Equipment equipment) {
        Loan activeLoan = loanRepository
                .findByEquipmentIdAndReturnedFalse(equipment.getId())
                .orElseThrow(() -> new BusinessRuleException(
                        "Inget aktivt lån hittades för denna utrustning."
                ));

        completeReturn(activeLoan);

        return activeLoan.getEquipment();
    }

    private void completeReturn(Loan activeLoan) {
        if (activeLoan.isReturned()) {
            throw new BusinessRuleException(
                    "Lånet är redan återlämnat."
            );
        }

        Equipment equipment = activeLoan.getEquipment();

        activeLoan.setReturned(true);
        equipment.setAvailable(true);

        loanRepository.save(activeLoan);
        equipmentRepository.save(equipment);

        log.info(
                "Marked loan {} as returned for equipment with serial number {}",
                activeLoan.getId(),
                equipment.getSerialNumber()
        );
    }

    private void validateLoanForm(LoanFormDTO loanFormDTO) {
        if (loanFormDTO == null) {
            throw new BusinessRuleException(
                    "Låneformulär saknas."
            );
        }

        if (
                loanFormDTO.getBorrowerName() == null
                        || loanFormDTO.getBorrowerName().isBlank()
        ) {
            throw new BusinessRuleException(
                    "Namn måste anges."
            );
        }

        if (
                loanFormDTO.getEmail() == null
                        || loanFormDTO.getEmail().isBlank()
        ) {
            throw new BusinessRuleException(
                    "E-post måste anges."
            );
        }

        if (
                loanFormDTO.getPhoneNumber() == null
                        || loanFormDTO.getPhoneNumber().isBlank()
        ) {
            throw new BusinessRuleException(
                    "Telefonnummer måste anges."
            );
        }
    }
}