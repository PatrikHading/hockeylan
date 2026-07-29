package com.norops.hockeylan.service;

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

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
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
    void getActiveLoansShouldUseSortedRepositoryQuery() {
        Loan loan = activeLoan();

        when(
                loanRepository
                        .findByReturnedFalseOrderByLoanDateAsc()
        ).thenReturn(List.of(loan));

        List<Loan> result =
                loanService.getActiveLoans();

        assertEquals(List.of(loan), result);

        verify(loanRepository)
                .findByReturnedFalseOrderByLoanDateAsc();
    }

    @Test
    void markReturnedByLoanIdShouldUpdateLoanAndEquipment() {
        Loan loan = activeLoan();
        Equipment equipment = loan.getEquipment();

        when(
                loanRepository.findByIdAndReturnedFalse(10L)
        ).thenReturn(Optional.of(loan));

        Loan result = loanService.markReturned(10L);

        assertSame(loan, result);
        assertTrue(result.isReturned());
        assertTrue(equipment.isAvailable());

        verify(loanRepository).save(loan);
        verify(equipmentRepository).save(equipment);
    }

    @Test
    void markReturnedByLoanIdShouldThrowForMissingActiveLoan() {
        when(
                loanRepository.findByIdAndReturnedFalse(99L)
        ).thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> loanService.markReturned(99L)
        );

        verify(loanRepository, never()).save(any());
        verify(equipmentRepository, never()).save(any());
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

        return loan;
    }
}