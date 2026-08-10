package com.norops.hockeylan.service;

import com.norops.hockeylan.dto.LoanHistoryStatus;
import com.norops.hockeylan.exception.BusinessRuleException;
import com.norops.hockeylan.exception.ResourceNotFoundException;
import com.norops.hockeylan.model.Equipment;
import com.norops.hockeylan.model.EquipmentType;
import com.norops.hockeylan.model.Loan;
import com.norops.hockeylan.repository.EquipmentRepository;
import com.norops.hockeylan.repository.LoanRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ActiveLoanServiceTest {

    private static final Clock FIXED_CLOCK =
            Clock.fixed(
                    Instant.parse(
                            "2026-07-30T10:00:00Z"
                    ),
                    ZoneId.of(
                            "Europe/Stockholm"
                    )
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
    void historyShouldUsePaginationAndStableSort() {
        Loan loan = activeLoan();

        Page<Loan> resultPage =
                new PageImpl<>(
                        List.of(loan)
                );

        when(
                loanRepository.findAll(
                        any(Specification.class),
                        any(Pageable.class)
                )
        ).thenReturn(resultPage);

        Page<Loan> result =
                loanService.getLoanHistory(
                        LoanHistoryStatus.ACTIVE,
                        LocalDate.of(
                                2026,
                                7,
                                1
                        ),
                        LocalDate.of(
                                2026,
                                7,
                                31
                        ),
                        " helmet-001 ",
                        EquipmentType.HELMET,
                        " Patrik ",
                        2,
                        20
                );

        assertSame(
                resultPage,
                result
        );

        ArgumentCaptor<Pageable>
                pageableCaptor =
                ArgumentCaptor.forClass(
                        Pageable.class
                );

        verify(loanRepository)
                .findAll(
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
                pageable.getSort()
                        .toString()
        );
    }

    @Test
    void historyShouldAcceptOverdueStatus() {
        Page<Loan> emptyPage =
                Page.empty();

        when(
                loanRepository.findAll(
                        any(Specification.class),
                        any(Pageable.class)
                )
        ).thenReturn(emptyPage);

        Page<Loan> result =
                loanService.getLoanHistory(
                        LoanHistoryStatus.OVERDUE,
                        null,
                        null,
                        null,
                        null,
                        null,
                        0,
                        20
                );

        assertSame(
                emptyPage,
                result
        );

        verify(loanRepository)
                .findAll(
                        any(Specification.class),
                        any(Pageable.class)
                );
    }

    @Test
    void historyShouldAcceptEmptyOptionalFilters() {
        Page<Loan> emptyPage =
                Page.empty();

        when(
                loanRepository.findAll(
                        any(Specification.class),
                        any(Pageable.class)
                )
        ).thenReturn(emptyPage);

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

        assertSame(
                emptyPage,
                result
        );

        verify(loanRepository)
                .findAll(
                        any(Specification.class),
                        any(Pageable.class)
                );
    }

    @Test
    void historyShouldUseAllStatusWhenStatusIsNull() {
        Page<Loan> emptyPage =
                Page.empty();

        when(
                loanRepository.findAll(
                        any(Specification.class),
                        any(Pageable.class)
                )
        ).thenReturn(emptyPage);

        Page<Loan> result =
                loanService.getLoanHistory(
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        0,
                        20
                );

        assertSame(
                emptyPage,
                result
        );
    }

    @Test
    void historyShouldRejectInvalidDateInterval() {
        assertThrows(
                IllegalArgumentException.class,
                () ->
                        loanService
                                .getLoanHistory(
                                        LoanHistoryStatus.ALL,
                                        LocalDate.of(
                                                2026,
                                                8,
                                                1
                                        ),
                                        LocalDate.of(
                                                2026,
                                                7,
                                                1
                                        ),
                                        null,
                                        null,
                                        null,
                                        0,
                                        20
                                )
        );

        verifyNoInteractions(
                loanRepository
        );
    }

    @Test
    void historyShouldRejectNegativePage() {
        assertThrows(
                IllegalArgumentException.class,
                () ->
                        loanService
                                .getLoanHistory(
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

        verifyNoInteractions(
                loanRepository
        );
    }

    @Test
    void historyShouldRejectPageSizeBelowOne() {
        assertThrows(
                IllegalArgumentException.class,
                () ->
                        loanService
                                .getLoanHistory(
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

        verifyNoInteractions(
                loanRepository
        );
    }

    @Test
    void historyShouldRejectOversizedPage() {
        assertThrows(
                IllegalArgumentException.class,
                () ->
                        loanService
                                .getLoanHistory(
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

        verifyNoInteractions(
                loanRepository
        );
    }

    @Test
    void markReturnedShouldUseClockAndUpdateEquipment() {
        Loan loan = activeLoan();

        Equipment equipment =
                loan.getEquipment();

        when(
                loanRepository
                        .findByIdForUpdate(
                                10L
                        )
        ).thenReturn(
                Optional.of(loan)
        );

        when(
                equipmentRepository
                        .findByIdForUpdate(
                                1L
                        )
        ).thenReturn(
                Optional.of(equipment)
        );

        when(
                loanRepository.save(loan)
        ).thenReturn(loan);

        when(
                equipmentRepository.save(
                        equipment
                )
        ).thenReturn(equipment);

        Loan result =
                loanService.markReturned(
                        10L
                );

        assertSame(
                loan,
                result
        );

        assertTrue(
                result.isReturned()
        );

        assertEquals(
                LocalDateTime.of(
                        2026,
                        7,
                        30,
                        12,
                        0
                ),
                result.getReturnedAt()
        );

        assertTrue(
                equipment.isAvailable()
        );

        verify(loanRepository)
                .findByIdForUpdate(10L);

        verify(equipmentRepository)
                .findByIdForUpdate(1L);

        verify(loanRepository)
                .save(loan);

        verify(equipmentRepository)
                .save(equipment);
    }

    @Test
    void markReturnedShouldDetectLateReturn() {
        Loan loan = activeLoan();

        loan.setExpectedReturnDate(
                LocalDate.of(
                        2026,
                        7,
                        29
                )
        );

        Equipment equipment =
                loan.getEquipment();

        when(
                loanRepository
                        .findByIdForUpdate(
                                10L
                        )
        ).thenReturn(
                Optional.of(loan)
        );

        when(
                equipmentRepository
                        .findByIdForUpdate(
                                1L
                        )
        ).thenReturn(
                Optional.of(equipment)
        );

        when(
                loanRepository.save(loan)
        ).thenReturn(loan);

        Loan result =
                loanService.markReturned(
                        10L
                );

        assertTrue(
                result.wasReturnedLate()
        );

        assertFalse(
                result.isOverdue(
                        LocalDate.of(
                                2026,
                                7,
                                31
                        )
                )
        );
    }

    @Test
    void markReturnedShouldReturn404WhenLoanDoesNotExist() {
        when(
                loanRepository
                        .findByIdForUpdate(
                                99L
                        )
        ).thenReturn(
                Optional.empty()
        );

        assertThrows(
                ResourceNotFoundException.class,
                () ->
                        loanService
                                .markReturned(
                                        99L
                                )
        );

        verifyNoInteractions(
                equipmentRepository
        );

        verify(
                loanRepository,
                never()
        ).save(any());
    }

    @Test
    void markReturnedShouldReturn409WhenAlreadyReturned() {
        Loan loan = activeLoan();

        loan.registerReturn(
                LocalDateTime.of(
                        2026,
                        7,
                        29,
                        12,
                        0
                )
        );

        when(
                loanRepository
                        .findByIdForUpdate(
                                10L
                        )
        ).thenReturn(
                Optional.of(loan)
        );

        BusinessRuleException exception =
                assertThrows(
                        BusinessRuleException.class,
                        () ->
                                loanService
                                        .markReturned(
                                                10L
                                        )
                );

        assertEquals(
                "Lånet är redan återlämnat.",
                exception.getMessage()
        );

        verifyNoInteractions(
                equipmentRepository
        );

        verify(
                loanRepository,
                never()
        ).save(any());
    }

    @Test
    void markReturnedShouldFailWhenEquipmentIsMissing() {
        Loan loan = activeLoan();

        when(
                loanRepository
                        .findByIdForUpdate(
                                10L
                        )
        ).thenReturn(
                Optional.of(loan)
        );

        when(
                equipmentRepository
                        .findByIdForUpdate(
                                1L
                        )
        ).thenReturn(
                Optional.empty()
        );

        assertThrows(
                ResourceNotFoundException.class,
                () ->
                        loanService
                                .markReturned(
                                        10L
                                )
        );

        assertFalse(
                loan.isReturned()
        );

        assertNull(
                loan.getReturnedAt()
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
    void activeLoanShouldContainExpectedReturnDate() {
        Loan loan = activeLoan();

        assertNotNull(
                loan.getExpectedReturnDate()
        );

        assertFalse(
                loan.isOverdue(
                        LocalDate.of(
                                2026,
                                7,
                                30
                        )
                )
        );
    }

    private Loan activeLoan() {
        Equipment equipment =
                new Equipment(
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
                "+46701234567",
                LocalDate.of(
                        2026,
                        8,
                        31
                )
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