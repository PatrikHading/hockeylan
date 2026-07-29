package com.norops.hockeylan.service;

import com.norops.hockeylan.exception.BusinessRuleException;
import com.norops.hockeylan.model.Equipment;
import com.norops.hockeylan.model.EquipmentType;
import com.norops.hockeylan.model.Loan;
import com.norops.hockeylan.repository.EquipmentRepository;
import com.norops.hockeylan.repository.LoanRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.util.List;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
@SpringBootTest
@ActiveProfiles("test")
class ReturnConcurrencyIntegrationTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer POSTGRES =
            new PostgreSQLContainer("postgres:17-alpine");

    @Autowired
    private LoanService loanService;

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private EquipmentRepository equipmentRepository;

    @BeforeEach
    void cleanDatabase() {
        loanRepository.deleteAllInBatch();
        equipmentRepository.deleteAllInBatch();
    }

    @Test
    void twoSimultaneousReturnsShouldOnlyCompleteOnce()
            throws Exception {
        Equipment equipment = new Equipment(
                EquipmentType.HELMET,
                "CONCURRENT-RETURN-001",
                "Concurrency test"
        );
        equipment.setAvailable(false);
        equipment = equipmentRepository.saveAndFlush(equipment);

        Loan loan = new Loan(
                equipment,
                "Test Borrower",
                "borrower@example.com",
                "0701234567"
        );
        loan = loanRepository.saveAndFlush(loan);

        Long loanId = loan.getId();

        ExecutorService executor =
                Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);

        Callable<Object> returnAttempt = () -> {
            ready.countDown();
            start.await(10, TimeUnit.SECONDS);

            try {
                return loanService.markReturned(loanId);
            } catch (RuntimeException exception) {
                return exception;
            }
        };

        try {
            Future<Object> first =
                    executor.submit(returnAttempt);
            Future<Object> second =
                    executor.submit(returnAttempt);

            assertThat(
                    ready.await(10, TimeUnit.SECONDS)
            ).isTrue();

            start.countDown();

            List<Object> results = List.of(
                    first.get(20, TimeUnit.SECONDS),
                    second.get(20, TimeUnit.SECONDS)
            );

            assertThat(results)
                    .filteredOn(Loan.class::isInstance)
                    .hasSize(1);

            assertThat(results)
                    .filteredOn(
                            BusinessRuleException.class::isInstance
                    )
                    .hasSize(1);
        } finally {
            executor.shutdownNow();
        }

        Loan persistedLoan =
                loanRepository.findById(loanId).orElseThrow();

        Equipment persistedEquipment =
                equipmentRepository.findById(
                        persistedLoan.getEquipment().getId()
                ).orElseThrow();

        assertThat(persistedLoan.isReturned()).isTrue();
        assertThat(persistedLoan.getReturnedAt()).isNotNull();
        assertThat(persistedEquipment.isAvailable()).isTrue();
    }
}