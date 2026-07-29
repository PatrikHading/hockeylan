package com.norops.hockeylan.repository;

import com.norops.hockeylan.model.Equipment;
import com.norops.hockeylan.model.Loan;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LoanRepository
        extends JpaRepository<Loan, Long> {

    List<Loan> findByReturned(boolean returned);

    @EntityGraph(attributePaths = "equipment")
    List<Loan> findByReturnedFalseOrderByLoanDateAsc();

    List<Loan> findByEquipmentId(Long equipmentId);

    Optional<Loan> findByEquipmentIdAndReturnedFalse(
            Long equipmentId
    );

    Optional<Loan> findByEquipmentAndReturnedFalse(
            Equipment equipment
    );

    boolean existsByEquipmentAndReturnedFalse(
            Equipment equipment
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select loan
            from Loan loan
            where loan.id = :loanId
            """)
    Optional<Loan> findByIdForUpdate(
            @Param("loanId") Long loanId
    );
}