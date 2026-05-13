package com.norops.hockeylan.service;

import com.norops.hockeylan.dto.LoanFormDTO;
import com.norops.hockeylan.exception.BusinessRuleException;
import com.norops.hockeylan.model.Equipment;
import com.norops.hockeylan.model.Loan;
import com.norops.hockeylan.repository.EquipmentRepository;
import com.norops.hockeylan.repository.LoanRepository;
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

    private static final Logger log = LoggerFactory.getLogger(LoanService.class);

    private final LoanRepository loanRepository;
    private final EquipmentRepository equipmentRepository;
    private final EquipmentService equipmentService;

    public Loan registerLoan(String serialNumber, LoanFormDTO loanFormDTO) {
        validateLoanForm(loanFormDTO);

        Equipment equipment = equipmentService.getEquipmentBySerialNumber(serialNumber);

        if (!equipment.isAvailable()) {
            throw new BusinessRuleException("Utrustningen är redan utlånad.");
        }

        if (loanRepository.findByEquipmentIdAndReturnedFalse(equipment.getId()).isPresent()) {
            throw new BusinessRuleException("Utrustningen har redan ett aktivt lån.");
        }

        Loan loan = new Loan(
                equipment,
                loanFormDTO.getBorrowerName(),
                loanFormDTO.getEmail(),
                loanFormDTO.getPhoneNumber()
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
        return loanRepository.findByReturnedFalse();
    }

    @Transactional
    public Equipment markReturned(Equipment equipment) {
        Loan activeLoan = loanRepository.findByEquipmentIdAndReturnedFalse(equipment.getId())
                .orElseThrow(() -> new BusinessRuleException("Inget aktivt lån hittades för denna utrustning."));

        if (activeLoan.isReturned()) {
            throw new BusinessRuleException("Lånet är redan återlämnat.");
        }

        activeLoan.setReturned(true);
        equipment.setAvailable(true);

        loanRepository.save(activeLoan);
        Equipment savedEquipment = equipmentRepository.save(equipment);

        log.info(
                "Marked loan {} as returned for equipment with serial number {}",
                activeLoan.getId(),
                equipment.getSerialNumber()
        );

        return savedEquipment;
    }

    private void validateLoanForm(LoanFormDTO loanFormDTO) {
        if (loanFormDTO == null) {
            throw new BusinessRuleException("Låneformulär saknas.");
        }

        if (loanFormDTO.getBorrowerName() == null || loanFormDTO.getBorrowerName().isBlank()) {
            throw new BusinessRuleException("Namn måste anges.");
        }

        if (loanFormDTO.getEmail() == null || loanFormDTO.getEmail().isBlank()) {
            throw new BusinessRuleException("E-post måste anges.");
        }

        if (loanFormDTO.getPhoneNumber() == null || loanFormDTO.getPhoneNumber().isBlank()) {
            throw new BusinessRuleException("Telefonnummer måste anges.");
        }
    }
}