package com.norops.hockeylan.service;

import com.norops.hockeylan.dto.LoanFormDTO;
import com.norops.hockeylan.exception.BusinessRuleException;
import com.norops.hockeylan.exception.DuplicateResourceException;
import com.norops.hockeylan.exception.ResourceNotFoundException;
import com.norops.hockeylan.model.Equipment;
import com.norops.hockeylan.model.EquipmentType;
import com.norops.hockeylan.model.Loan;
import com.norops.hockeylan.repository.EquipmentRepository;
import com.norops.hockeylan.repository.LoanRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LoanServiceTest {

    private static final ZoneId ZONE =
            ZoneId.of(
                    "Europe/Stockholm"
            );

    private static final Clock FIXED_CLOCK =
            Clock.fixed(
                    Instant.parse(
                            "2026-07-30T10:00:00Z"
                    ),
                    ZONE
            );

    @Mock
    private LoanRepository
            loanRepository;

    @Mock
    private EquipmentRepository
            equipmentRepository;

    @Mock
    private BorrowerAliasService
            borrowerAliasService;

    private LoanService loanService;

    @BeforeEach
    void setUp() {
        loanService = new LoanService(
                loanRepository,
                equipmentRepository,
                borrowerAliasService,
                FIXED_CLOCK
        );
    }

    @Test
    void registerLoanShouldCreateLoanAndMarkEquipmentUnavailable() {
        Equipment equipment =
                activeEquipment(
                        EquipmentType.HELMET,
                        "HELMET-001"
                );

        LoanFormDTO dto =
                validLoanForm(
                        LocalDate.of(
                                2027,
                                4,
                                30
                        )
                );

        prepareSuccessfulSave(
                equipment
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

        assertEquals(
                LocalDate.of(
                        2027,
                        4,
                        30
                ),
                result.getExpectedReturnDate()
        );

        assertEquals(
                LocalDateTime.of(
                        2026,
                        7,
                        30,
                        12,
                        0
                ),
                result.getLoanDate()
        );

        assertFalse(
                result.isReturned()
        );

        assertFalse(
                equipment.isAvailable()
        );

        verify(loanRepository)
                .save(any(Loan.class));

        verify(equipmentRepository)
                .save(equipment);

        verify(
                borrowerAliasService,
                never()
        ).createAlias(
                any(),
                any(),
                any(),
                any()
        );
    }

    @Test
    void registerLoanShouldAllowMissingExpectedReturnDate() {
        Equipment equipment =
                activeEquipment(
                        EquipmentType.HELMET,
                        "HELMET-NO-DATE"
                );

        prepareSuccessfulSave(
                equipment
        );

        Loan result =
                loanService.registerLoan(
                        "HELMET-NO-DATE",
                        validLoanForm(null)
                );

        assertNull(
                result.getExpectedReturnDate()
        );

        assertFalse(
                result.isReturned()
        );

        assertFalse(
                equipment.isAvailable()
        );

        verify(loanRepository)
                .save(any(Loan.class));

        verify(equipmentRepository)
                .save(equipment);
    }

    @Test
    void registerLoanShouldCreateAliasWithSameNormalizedContactDetails() {
        Equipment equipment =
                activeEquipment(
                        EquipmentType.HELMET,
                        "HELMET-ALIAS"
                );

        prepareSuccessfulSave(
                equipment
        );

        LoanFormDTO dto =
                validLoanForm(null);

        dto.setAliasName(
                "Patrik"
        );

        dto.setBorrowerName(
                "  Patrik   Hading  "
        );

        dto.setEmail(
                "  PATRIK@EXAMPLE.COM  "
        );

        dto.setPhoneNumber(
                "  +46701234567  "
        );

        Loan result =
                loanService.registerLoan(
                        "HELMET-ALIAS",
                        dto
                );

        verify(
                borrowerAliasService
        ).createAlias(
                "Patrik",
                "Patrik Hading",
                "patrik@example.com",
                "+46701234567"
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

        assertNull(
                result.getExpectedReturnDate()
        );
    }

    @Test
    void registerLoanShouldNotSaveLoanWhenAliasCreationFails() {
        Equipment equipment =
                activeEquipment(
                        EquipmentType.HELMET,
                        "HELMET-DUPLICATE-ALIAS"
                );

        when(
                equipmentRepository
                        .findBySerialNumberIgnoreCaseForUpdate(
                                "HELMET-DUPLICATE-ALIAS"
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

        LoanFormDTO dto =
                validLoanForm(null);

        dto.setAliasName(
                "Patrik"
        );

        when(
                borrowerAliasService
                        .createAlias(
                                "Patrik",
                                "Patrik Hading",
                                "patrik@example.com",
                                "+46701234567"
                        )
        ).thenThrow(
                new DuplicateResourceException(
                        "Det finns redan ett Alias med det namnet."
                )
        );

        assertThrows(
                DuplicateResourceException.class,
                () ->
                        loanService.registerLoan(
                                "HELMET-DUPLICATE-ALIAS",
                                dto
                        )
        );

        assertTrue(
                equipment.isAvailable()
        );

        verify(
                loanRepository,
                never()
        ).save(any(Loan.class));

        verify(
                equipmentRepository,
                never()
        ).save(equipment);
    }

    @Test
    void registerLoanShouldAllowReturnOnLoanDate() {
        Equipment equipment =
                activeEquipment(
                        EquipmentType.HELMET,
                        "HELMET-002"
                );

        prepareSuccessfulSave(
                equipment
        );

        Loan result =
                loanService.registerLoan(
                        "HELMET-002",
                        validLoanForm(
                                LocalDate.of(
                                        2026,
                                        7,
                                        30
                                )
                        )
                );

        assertEquals(
                LocalDate.of(
                        2026,
                        7,
                        30
                ),
                result.getExpectedReturnDate()
        );
    }

    @Test
    void registerLoanShouldAllowMultiYearLoan() {
        Equipment equipment =
                activeEquipment(
                        EquipmentType.SKATES,
                        "SKATES-001"
                );

        prepareSuccessfulSave(
                equipment
        );

        Loan result =
                loanService.registerLoan(
                        "SKATES-001",
                        validLoanForm(
                                LocalDate.of(
                                        2030,
                                        6,
                                        1
                                )
                        )
                );

        assertEquals(
                LocalDate.of(
                        2030,
                        6,
                        1
                ),
                result.getExpectedReturnDate()
        );
    }

    @Test
    void registerLoanShouldRejectDateBeforeLoanDate() {
        LoanFormDTO dto =
                validLoanForm(
                        LocalDate.of(
                                2026,
                                7,
                                29
                        )
                );

        BusinessRuleException exception =
                assertThrows(
                        BusinessRuleException.class,
                        () ->
                                loanService
                                        .registerLoan(
                                                "HELMET-001",
                                                dto
                                        )
                );

        assertEquals(
                "Förväntat återlämningsdatum får inte ligga före utlåningsdatumet.",
                exception.getMessage()
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

    @Test
    void registerLoanShouldThrowWhenEquipmentDoesNotExist() {
        when(
                equipmentRepository
                        .findBySerialNumberIgnoreCaseForUpdate(
                                "UNKNOWN"
                        )
        ).thenReturn(
                Optional.empty()
        );

        assertThrows(
                ResourceNotFoundException.class,
                () ->
                        loanService.registerLoan(
                                "unknown",
                                validLoanForm(
                                        LocalDate.of(
                                                2027,
                                                1,
                                                1
                                        )
                                )
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
                        "HELMET-003"
                );

        equipment.setActive(false);

        when(
                equipmentRepository
                        .findBySerialNumberIgnoreCaseForUpdate(
                                "HELMET-003"
                        )
        ).thenReturn(
                Optional.of(equipment)
        );

        BusinessRuleException exception =
                assertThrows(
                        BusinessRuleException.class,
                        () ->
                                loanService
                                        .registerLoan(
                                                "HELMET-003",
                                                validLoanForm(
                                                        LocalDate.of(
                                                                2027,
                                                                1,
                                                                1
                                                        )
                                                )
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
                        "SKATES-002"
                );

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
                                loanService
                                        .registerLoan(
                                                "SKATES-002",
                                                validLoanForm(
                                                        LocalDate.of(
                                                                2027,
                                                                1,
                                                                1
                                                        )
                                                )
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
    void registerLoanShouldRejectExistingActiveLoan() {
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
                                loanService
                                        .registerLoan(
                                                "STICK-001",
                                                validLoanForm(
                                                        LocalDate.of(
                                                                2027,
                                                                1,
                                                                1
                                                        )
                                                )
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
    void registerLoanShouldRejectMissingForm() {
        assertThrows(
                BusinessRuleException.class,
                () ->
                        loanService.registerLoan(
                                "HELMET-001",
                                null
                        )
        );

        verify(
                equipmentRepository,
                never()
        ).findBySerialNumberIgnoreCaseForUpdate(
                any()
        );
    }

    private void prepareSuccessfulSave(
            Equipment equipment
    ) {
        when(
                equipmentRepository
                        .findBySerialNumberIgnoreCaseForUpdate(
                                equipment
                                        .getSerialNumber()
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
                        invocation.getArgument(
                                0
                        )
        );
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

    private LoanFormDTO validLoanForm(
            LocalDate expectedReturnDate
    ) {
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
                expectedReturnDate
        );

        return dto;
    }
}