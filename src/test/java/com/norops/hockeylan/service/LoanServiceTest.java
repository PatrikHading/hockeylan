package com.norops.hockeylan.service;

import com.norops.hockeylan.dto.LoanFormDTO;
import com.norops.hockeylan.exception.BusinessRuleException;
import com.norops.hockeylan.exception.ResourceNotFoundException;
import com.norops.hockeylan.model.Equipment;
import com.norops.hockeylan.model.EquipmentType;
import com.norops.hockeylan.model.Loan;
import com.norops.hockeylan.repository.EquipmentRepository;
import com.norops.hockeylan.repository.LoanRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LoanServiceTest {

    @Mock
    private LoanRepository loanRepository;

    @Mock
    private EquipmentRepository equipmentRepository;

    @InjectMocks
    private LoanService loanService;

    @Test
    void registerLoanShouldCreateLoanAndMarkEquipmentUnavailable() {
        Equipment equipment = new Equipment(
                EquipmentType.HELMET,
                "HELMET-001",
                "Bauer hjälm"
        );

        LoanFormDTO dto = validLoanForm();

        when(equipmentRepository.findBySerialNumberIgnoreCaseForUpdate("HELMET-001"))
                .thenReturn(Optional.of(equipment));

        when(loanRepository.existsByEquipmentAndReturnedFalse(equipment))
                .thenReturn(false);

        when(loanRepository.save(any(Loan.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Loan result = loanService.registerLoan("helmet-001", dto);

        assertEquals("Patrik Hading", result.getBorrowerName());
        assertEquals("patrik@example.com", result.getEmail());
        assertEquals("+46701234567", result.getPhoneNumber());
        assertFalse(result.isReturned());
        assertFalse(equipment.isAvailable());

        verify(loanRepository).save(any(Loan.class));
        verify(equipmentRepository).save(equipment);
    }

    @Test
    void registerLoanShouldThrowWhenEquipmentDoesNotExist() {
        LoanFormDTO dto = validLoanForm();

        when(equipmentRepository.findBySerialNumberIgnoreCaseForUpdate("UNKNOWN"))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> loanService.registerLoan("unknown", dto)
        );

        verify(loanRepository, never()).save(any());
    }

    @Test
    void registerLoanShouldThrowWhenEquipmentIsUnavailable() {
        Equipment equipment = new Equipment(
                EquipmentType.SKATES,
                "SKATES-001",
                "CCM skridskor"
        );

        equipment.setAvailable(false);

        when(equipmentRepository.findBySerialNumberIgnoreCaseForUpdate("SKATES-001"))
                .thenReturn(Optional.of(equipment));

        assertThrows(
                BusinessRuleException.class,
                () -> loanService.registerLoan("skates-001", validLoanForm())
        );

        verify(loanRepository, never()).save(any());
    }

    @Test
    void registerLoanShouldThrowWhenEquipmentAlreadyHasActiveLoan() {
        Equipment equipment = new Equipment(
                EquipmentType.STICK,
                "STICK-001",
                "CCM klubba"
        );

        equipment.setAvailable(true);

        when(equipmentRepository.findBySerialNumberIgnoreCaseForUpdate("STICK-001"))
                .thenReturn(Optional.of(equipment));

        when(loanRepository.existsByEquipmentAndReturnedFalse(equipment))
                .thenReturn(true);

        assertThrows(
                BusinessRuleException.class,
                () -> loanService.registerLoan("stick-001", validLoanForm())
        );

        verify(loanRepository, never()).save(any());
    }

    @Test
    void registerLoanShouldThrowWhenFormIsMissing() {
        assertThrows(
                BusinessRuleException.class,
                () -> loanService.registerLoan("helmet-001", null)
        );

        verify(loanRepository, never()).save(any());
    }


    private LoanFormDTO validLoanForm() {
        LoanFormDTO dto = new LoanFormDTO();
        dto.setBorrowerName("Patrik Hading");
        dto.setEmail("patrik@example.com");
        dto.setPhoneNumber("+46701234567");
        return dto;
    }
}