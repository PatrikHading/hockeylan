package com.norops.hockeylan.repository;

import com.norops.hockeylan.model.Equipment;
import com.norops.hockeylan.model.Loan;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface LoanRepository extends JpaRepository<Loan, Long> {

    List<Loan> findByReturnedFalse();
    List<Loan> findByEquipmentOrderByLoanDateDesc(Equipment equipment);
    Optional<Loan> findByEquipmentAndReturnedFalse(Equipment equipment);
}
