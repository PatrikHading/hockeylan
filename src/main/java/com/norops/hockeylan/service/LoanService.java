package com.norops.hockeylan.service;

import com.norops.hockeylan.dto.LoanFormDTO;
import com.norops.hockeylan.model.Equipment;
import com.norops.hockeylan.model.Loan;
import com.norops.hockeylan.repository.EquipmentRepository;
import com.norops.hockeylan.repository.LoanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LoanService {

    private final LoanRepository loanRepository;
    private final EquipmentRepository equipmentRepository;
    private final EquipmentService equipmentService;

    @Transactional
    public Loan registerLoan(String serialNumber, LoanFormDTO loanFormDTO) {
        Equipment equipment = equipmentService.getEquipmentBySerialNumber(serialNumber);

        if (!equipment.isAvailable()) {
            throw new IllegalStateException("Equipment is already loaned");
        }

        Loan loan = new Loan(
                equipment,
                loanFormDTO.getBorrowerName(),
                loanFormDTO.getEmail(),
                loanFormDTO.getPhoneNumber()
        );

        equipment.setAvailable(false);

        return loanRepository.save(loan);
    }

    @Transactional(readOnly = true)
    public List<Loan> getActiveLoans() {
        return loanRepository.findByReturnedFalse();
    }

    @Transactional
    public Equipment markReturned(Equipment equipment) {
        Loan activeLoan = loanRepository.findByEquipmentIdAndReturnedFalse(equipment.getId())
                .orElseThrow(() -> new IllegalStateException("No active loan found for equipment"));

        activeLoan.setReturned(true);
        equipment.setAvailable(true);

        loanRepository.save(activeLoan);

        return equipmentRepository.save(equipment);
    }














}
