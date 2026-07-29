package com.norops.hockeylan.service;

import com.norops.hockeylan.dto.LoanHistoryStatus;
import com.norops.hockeylan.exception.BusinessRuleException;
import com.norops.hockeylan.exception.ResourceNotFoundException;
import com.norops.hockeylan.model.Equipment;
import com.norops.hockeylan.model.EquipmentType;
import com.norops.hockeylan.model.Loan;
import com.norops.hockeylan.repository.EquipmentRepository;
import com.norops.hockeylan.repository.LoanRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ActiveLoanServiceTest {

    @Mock
    private LoanRepository loanRepository;

    @Mock
    private EquipmentRepository equipmentRepository;

    @InjectMocks
    private LoanService loanService;

    @Test
    void historyShouldUsePaginationAndStableSort() {
        Loan loan = activeLoan();

        Page<Loan> resultPage =
                new PageImpl<>(List.of(loan));

        when(loanRepository.findAll(
                any(Specification.class),
                any(Pageable.class)
        )).thenReturn(resultPage);

        Page<Loan> result =
                loanService.getLoanHistory(
                        LoanHistoryStatus.ACTIVE,
                        LocalDate.of(2026, 7, 1),
                        LocalDate.of(2026, 7, 31),
                        " helmet-001 ",
                        EquipmentType.HELMET,
                        " Patrik ",
                        2,
                        20
                );

        assertSame(resultPage, result);

        ArgumentCaptor<Pageable> pageableCaptor =
                ArgumentCaptor.forClass(
                        Pageable.class
                );

        verify(loanRepository).findAll(
                any(Specification.class),
                pageableCaptor.capture()
        );

        Pageable pageable =
                pageableCaptor.getValue();

        assertEquals(
                2,
                pageable.getPageNumber()
        );

        assertEquals(
                20,
                pageable.getPageSize()
        );

        assertEquals(
                "loanDate: DESC,id: DESC",
                pageable.getSort().toString()
        );
    }

    @Test
    void historyShouldAcceptEmptyOptionalFilters() {
        Page<Loan> emptyPage = Page.empty();

        when(loanRepository.findAll(
                any(Specification.class),
                any(Pageable.class)
        )).thenReturn(emptyPage);

        Page<Loan> result =
                loanService.getLoanHistory(
                        LoanHistoryStatus.ALL,
                        null,
                        null,
                        " ",
                        null,
                        " ",
                        0,
                        20
                );

        assertSame(emptyPage, result);

        verify(loanRepository).findAll(
                any(Specification.class),
                any(Pageable.class)
        );
    }

    @Test
    void historyShouldRejectInvalidDateInterval() {
        assertThrows(
                IllegalArgumentException.class,
                () -> loanService.getLoanHistory(
                        LoanHistoryStatus.ALL,
                        LocalDate.of(2026, 8, 1),
                        LocalDate.of(2026, 7, 1),
                        null,
                        null,
                        null,
                        0,
                        20
                )
        );

        verifyNoInteractions(loanRepository);
    }

    @Test
    void historyShouldRejectNegativePage() {
        assertThrows(
                IllegalArgumentException.class,
                () -> loanService.getLoanHistory(
                        LoanHistoryStatus.ALL,
                        null,
                        null,
                        null,
                        null,
                        null,
                        -1,
                        20
                )
        );

        verifyNoInteractions(loanRepository);
    }

    @Test
    void historyShouldRejectPageSizeBelowOne() {
        assertThrows(
                IllegalArgumentException.class,
                () -> loanService.getLoanHistory(
                        LoanHistoryStatus.ALL,
                        null,
                        null,
                        null,
                        null,
                        null,
                        0,
                        0
                )
        );

        verifyNoInteractions(loanRepository);
    }

    @Test
    void historyShouldRejectOversizedPage() {
        assertThrows(
                IllegalArgumentException.class,
                () -> loanService.getLoanHistory(
                        LoanHistoryStatus.ALL,
                        null,
                        null,
                        null,
                        null,
                        null,
                        0,
                        101
                )
        );

        verifyNoInteractions(loanRepository);
    }

    @Test
    void markReturnedShouldUpdateLoanTimestampAndEquipment() {
        Loan loan = activeLoan();
        Equipment equipment = loan.getEquipment();

        when(loanRepository.findByIdForUpdate(10L))
                .thenReturn(Optional.of(loan));

        when(equipmentRepository.findByIdForUpdate(1L))
                .thenReturn(Optional.of(equipment));

        when(loanRepository.save(loan))
                .thenReturn(loan);

        when(equipmentRepository.save(equipment))
                .thenReturn(equipment);

        LocalDateTime before = LocalDateTime.now();

        Loan result =
                loanService.markReturned(10L);

        LocalDateTime after = LocalDateTime.now();

        assertSame(loan, result);
        assertTrue(result.isReturned());
        assertNotNull(result.getReturnedAt());

        assertFalse(
                result.getReturnedAt().isBefore(before)
        );

        assertFalse(
                result.getReturnedAt().isAfter(after)
        );

        assertTrue(equipment.isAvailable());

        verify(loanRepository)
                .findByIdForUpdate(10L);

        verify(equipmentRepository)
                .findByIdForUpdate(1L);

        verify(loanRepository).save(loan);

        verify(equipmentRepository)
                .save(equipment);
    }

    @Test
    void markReturnedShouldReturn404WhenLoanDoesNotExist() {
        when(loanRepository.findByIdForUpdate(99L))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> loanService.markReturned(99L)
        );

        verifyNoInteractions(equipmentRepository);

        verify(loanRepository, never())
                .save(any());
    }

    @Test
    void markReturnedShouldReturn409WhenAlreadyReturned() {
        Loan loan = activeLoan();

        loan.registerReturn(
                LocalDateTime.now().minusMinutes(5)
        );

        when(loanRepository.findByIdForUpdate(10L))
                .thenReturn(Optional.of(loan));

        BusinessRuleException exception =
                assertThrows(
                        BusinessRuleException.class,
                        () -> loanService
                                .markReturned(10L)
                );

        assertEquals(
                "Lånet är redan återlämnat.",
                exception.getMessage()
        );

        verifyNoInteractions(equipmentRepository);

        verify(loanRepository, never())
                .save(any());
    }

    @Test
    void markReturnedShouldFailWhenEquipmentIsMissing() {
        Loan loan = activeLoan();

        when(loanRepository.findByIdForUpdate(10L))
                .thenReturn(Optional.of(loan));

        when(equipmentRepository.findByIdForUpdate(1L))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> loanService.markReturned(10L)
        );

        assertFalse(loan.isReturned());
        assertNull(loan.getReturnedAt());

        verify(loanRepository, never())
                .save(any());

        verify(equipmentRepository, never())
                .save(any());
    }

    private Loan activeLoan() {
        Equipment equipment = new Equipment(
                EquipmentType.HELMET,
                "HELMET-001",
                "Bauer hjälm"
        );

        equipment.setId(1L);
        equipment.setAvailable(false);

        Loan loan = new Loan(
                equipment,
                "Patrik Hading",
                "patrik@example.com",
                "+46701234567"
        );

        loan.setId(10L);
        loan.setReturned(false);
        loan.setReturnedAt(null);

        loan.setLoanDate(
                LocalDateTime.of(
                        2026,
                        7,
                        28,
                        12,
                        30
                )
        );

        return loan;
    }
}