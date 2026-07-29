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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LoanServiceTest {

    @Mock
    private LoanRepository loanRepository;

    @Mock
    private EquipmentRepository
            equipmentRepository;

    @InjectMocks
    private LoanService loanService;

    @Test
    void registerLoanShouldCreateLoanAndMarkEquipmentUnavailable() {
        Equipment equipment =
                activeEquipment(
                        EquipmentType.HELMET,
                        "HELMET-001"
                );

        LoanFormDTO dto = validLoanForm();

        when(
                equipmentRepository
                        .findBySerialNumberIgnoreCaseForUpdate(
                                "HELMET-001"
                        )
        ).thenReturn(
                Optional.of(equipment)
        );

        when(
                loanRepository
                        .existsByEquipmentAndReturnedFalse(
                                equipment
                        )
        ).thenReturn(false);

        when(
                loanRepository.save(
                        any(Loan.class)
                )
        ).thenAnswer(
                invocation ->
                        invocation.getArgument(0)
        );

        Loan result =
                loanService.registerLoan(
                        "helmet-001",
                        dto
                );

        assertEquals(
                "Patrik Hading",
                result.getBorrowerName()
        );

        assertEquals(
                "patrik@example.com",
                result.getEmail()
        );

        assertEquals(
                "+46701234567",
                result.getPhoneNumber()
        );

        assertFalse(result.isReturned());
        assertFalse(equipment.isAvailable());
        assertTrue(equipment.isActive());

        verify(loanRepository)
                .save(any(Loan.class));

        verify(equipmentRepository)
                .save(equipment);
    }

    @Test
    void registerLoanShouldThrowWhenEquipmentDoesNotExist() {
        LoanFormDTO dto = validLoanForm();

        when(
                equipmentRepository
                        .findBySerialNumberIgnoreCaseForUpdate(
                                "UNKNOWN"
                        )
        ).thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () ->
                        loanService.registerLoan(
                                "unknown",
                                dto
                        )
        );

        verify(
                loanRepository,
                never()
        ).save(any());
    }

    @Test
    void registerLoanShouldThrowWhenEquipmentIsInactive() {
        Equipment equipment =
                activeEquipment(
                        EquipmentType.HELMET,
                        "HELMET-002"
                );

        equipment.setActive(false);

        when(
                equipmentRepository
                        .findBySerialNumberIgnoreCaseForUpdate(
                                "HELMET-002"
                        )
        ).thenReturn(
                Optional.of(equipment)
        );

        BusinessRuleException exception =
                assertThrows(
                        BusinessRuleException.class,
                        () ->
                                loanService.registerLoan(
                                        "helmet-002",
                                        validLoanForm()
                                )
                );

        assertEquals(
                "Utrustningen är inaktiverad och kan inte lånas.",
                exception.getMessage()
        );

        assertTrue(equipment.isAvailable());
        assertFalse(equipment.isActive());

        verify(
                loanRepository,
                never()
        ).existsByEquipmentAndReturnedFalse(
                any()
        );

        verify(
                loanRepository,
                never()
        ).save(any());

        verify(
                equipmentRepository,
                never()
        ).save(any());
    }

    @Test
    void registerLoanShouldPrioritizeInactiveStatusOverUnavailableStatus() {
        Equipment equipment =
                activeEquipment(
                        EquipmentType.SKATES,
                        "SKATES-002"
                );

        equipment.setActive(false);
        equipment.setAvailable(false);

        when(
                equipmentRepository
                        .findBySerialNumberIgnoreCaseForUpdate(
                                "SKATES-002"
                        )
        ).thenReturn(
                Optional.of(equipment)
        );

        BusinessRuleException exception =
                assertThrows(
                        BusinessRuleException.class,
                        () ->
                                loanService.registerLoan(
                                        "skates-002",
                                        validLoanForm()
                                )
                );

        assertEquals(
                "Utrustningen är inaktiverad och kan inte lånas.",
                exception.getMessage()
        );

        verify(
                loanRepository,
                never()
        ).save(any());
    }

    @Test
    void registerLoanShouldThrowWhenEquipmentIsUnavailable() {
        Equipment equipment =
                activeEquipment(
                        EquipmentType.SKATES,
                        "SKATES-001"
                );

        equipment.setAvailable(false);

        when(
                equipmentRepository
                        .findBySerialNumberIgnoreCaseForUpdate(
                                "SKATES-001"
                        )
        ).thenReturn(
                Optional.of(equipment)
        );

        BusinessRuleException exception =
                assertThrows(
                        BusinessRuleException.class,
                        () ->
                                loanService.registerLoan(
                                        "skates-001",
                                        validLoanForm()
                                )
                );

        assertEquals(
                "Utrustningen är redan utlånad.",
                exception.getMessage()
        );

        verify(
                loanRepository,
                never()
        ).save(any());
    }

    @Test
    void registerLoanShouldThrowWhenEquipmentAlreadyHasActiveLoan() {
        Equipment equipment =
                activeEquipment(
                        EquipmentType.STICK,
                        "STICK-001"
                );

        when(
                equipmentRepository
                        .findBySerialNumberIgnoreCaseForUpdate(
                                "STICK-001"
                        )
        ).thenReturn(
                Optional.of(equipment)
        );

        when(
                loanRepository
                        .existsByEquipmentAndReturnedFalse(
                                equipment
                        )
        ).thenReturn(true);

        BusinessRuleException exception =
                assertThrows(
                        BusinessRuleException.class,
                        () ->
                                loanService.registerLoan(
                                        "stick-001",
                                        validLoanForm()
                                )
                );

        assertEquals(
                "Utrustningen har redan ett aktivt lån.",
                exception.getMessage()
        );

        verify(
                loanRepository,
                never()
        ).save(any());
    }

    @Test
    void registerLoanShouldThrowWhenFormIsMissing() {
        assertThrows(
                BusinessRuleException.class,
                () ->
                        loanService.registerLoan(
                                "helmet-001",
                                null
                        )
        );

        verify(
                equipmentRepository,
                never()
        ).findBySerialNumberIgnoreCaseForUpdate(
                any()
        );

        verify(
                loanRepository,
                never()
        ).save(any());
    }

    private Equipment activeEquipment(
            EquipmentType type,
            String serialNumber
    ) {
        return new Equipment(
                type,
                serialNumber,
                "Testutrustning"
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

        return dto;
    }
}