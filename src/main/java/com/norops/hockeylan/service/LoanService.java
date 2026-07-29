package com.norops.hockeylan.service;

import com.norops.hockeylan.dto.LoanFormDTO;
import com.norops.hockeylan.dto.LoanHistoryStatus;
import com.norops.hockeylan.exception.BusinessRuleException;
import com.norops.hockeylan.exception.ResourceNotFoundException;
import com.norops.hockeylan.model.Equipment;
import com.norops.hockeylan.model.EquipmentType;
import com.norops.hockeylan.model.Loan;
import com.norops.hockeylan.repository.EquipmentRepository;
import com.norops.hockeylan.repository.LoanRepository;
import com.norops.hockeylan.util.InputSanitizer;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional
public class LoanService {

    private static final Logger log =
            LoggerFactory.getLogger(LoanService.class);

    private static final int MAX_PAGE_SIZE = 100;

    private static final Sort HISTORY_SORT = Sort.by(
            Sort.Order.desc("loanDate"),
            Sort.Order.desc("id")
    );

    private final LoanRepository loanRepository;
    private final EquipmentRepository equipmentRepository;

    public Loan registerLoan(
            String serialNumber,
            LoanFormDTO loanFormDTO
    ) {
        validateLoanForm(loanFormDTO);

        String sanitizedSerialNumber =
                InputSanitizer.cleanSerialNumber(serialNumber);

        Equipment equipment = equipmentRepository
                .findBySerialNumberIgnoreCaseForUpdate(
                        sanitizedSerialNumber
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Equipment not found with serial number: "
                                        + sanitizedSerialNumber
                        )
                );

        if (!equipment.isAvailable()) {
            throw new BusinessRuleException(
                    "Utrustningen är redan utlånad."
            );
        }

        if (loanRepository
                .existsByEquipmentAndReturnedFalse(equipment)) {
            throw new BusinessRuleException(
                    "Utrustningen har redan ett aktivt lån."
            );
        }

        Loan loan = new Loan(
                equipment,
                InputSanitizer.cleanText(
                        loanFormDTO.getBorrowerName()
                ),
                InputSanitizer.cleanEmail(
                        loanFormDTO.getEmail()
                ),
                InputSanitizer.cleanPhoneNumber(
                        loanFormDTO.getPhoneNumber()
                )
        );

        equipment.setAvailable(false);

        Loan savedLoan = loanRepository.save(loan);
        equipmentRepository.save(equipment);

        log.info(
                "Registered loan with id {} for equipment serial number {}",
                savedLoan.getId(),
                equipment.getSerialNumber()
        );

        return savedLoan;
    }

    @Transactional(readOnly = true)
    public Page<Loan> getLoanHistory(
            LoanHistoryStatus status,
            LocalDate from,
            LocalDate to,
            String serialNumber,
            EquipmentType equipmentType,
            String borrower,
            int page,
            int size
    ) {
        validatePaginationAndDateInterval(
                from,
                to,
                page,
                size
        );

        LoanHistoryStatus effectiveStatus =
                status == null
                        ? LoanHistoryStatus.ALL
                        : status;

        LocalDateTime fromInclusive =
                from == null
                        ? null
                        : from.atStartOfDay();

        LocalDateTime toExclusive =
                to == null
                        ? null
                        : to.plusDays(1).atStartOfDay();

        String normalizedSerialNumber =
                normalizeSerialNumberFilter(
                        serialNumber
                );

        String normalizedBorrower =
                normalizeBorrowerFilter(borrower);

        Specification<Loan> specification =
                buildHistorySpecification(
                        effectiveStatus,
                        fromInclusive,
                        toExclusive,
                        normalizedSerialNumber,
                        equipmentType,
                        normalizedBorrower
                );

        PageRequest pageRequest = PageRequest.of(
                page,
                size,
                HISTORY_SORT
        );

        return loanRepository.findAll(
                specification,
                pageRequest
        );
    }

    public Loan markReturned(Long loanId) {
        Loan loan = loanRepository
                .findByIdForUpdate(loanId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Loan not found with id: "
                                        + loanId
                        )
                );

        if (loan.isReturned()) {
            throw new BusinessRuleException(
                    "Lånet är redan återlämnat."
            );
        }

        Equipment equipment = equipmentRepository
                .findByIdForUpdate(
                        loan.getEquipment().getId()
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Equipment not found with id: "
                                        + loan.getEquipment().getId()
                        )
                );

        loan.setEquipment(equipment);
        loan.registerReturn(LocalDateTime.now());
        equipment.setAvailable(true);

        Loan savedLoan = loanRepository.save(loan);
        equipmentRepository.save(equipment);

        log.info(
                "Marked loan {} as returned at {} for equipment {}",
                savedLoan.getId(),
                savedLoan.getReturnedAt(),
                equipment.getSerialNumber()
        );

        return savedLoan;
    }

    private Specification<Loan> buildHistorySpecification(
            LoanHistoryStatus status,
            LocalDateTime fromInclusive,
            LocalDateTime toExclusive,
            String serialNumber,
            EquipmentType equipmentType,
            String borrower
    ) {
        return (root, query, criteriaBuilder) -> {
            if (!Long.class.equals(query.getResultType())
                    && !long.class.equals(
                    query.getResultType()
            )) {
                root.fetch(
                        "equipment",
                        JoinType.INNER
                );

                query.distinct(true);
            }

            List<Predicate> predicates =
                    new ArrayList<>();

            Boolean returnedValue =
                    status.asReturnedValue();

            if (returnedValue != null) {
                predicates.add(
                        criteriaBuilder.equal(
                                root.get("returned"),
                                returnedValue
                        )
                );
            }

            if (fromInclusive != null) {
                predicates.add(
                        criteriaBuilder.greaterThanOrEqualTo(
                                root.get("loanDate"),
                                fromInclusive
                        )
                );
            }

            if (toExclusive != null) {
                predicates.add(
                        criteriaBuilder.lessThan(
                                root.get("loanDate"),
                                toExclusive
                        )
                );
            }

            if (serialNumber != null) {
                predicates.add(
                        criteriaBuilder.equal(
                                criteriaBuilder.lower(
                                        root.get("equipment")
                                                .get("serialNumber")
                                ),
                                serialNumber
                        )
                );
            }

            if (equipmentType != null) {
                predicates.add(
                        criteriaBuilder.equal(
                                root.get("equipment")
                                        .get("type"),
                                equipmentType
                        )
                );
            }

            if (borrower != null) {
                predicates.add(
                        criteriaBuilder.like(
                                criteriaBuilder.lower(
                                        root.get("borrowerName")
                                ),
                                "%"
                                        + escapeLikePattern(
                                        borrower
                                )
                                        + "%",
                                '\\'
                        )
                );
            }

            return criteriaBuilder.and(
                    predicates.toArray(
                            Predicate[]::new
                    )
            );
        };
    }

    private void validatePaginationAndDateInterval(
            LocalDate from,
            LocalDate to,
            int page,
            int size
    ) {
        if (page < 0) {
            throw new IllegalArgumentException(
                    "Page must not be negative."
            );
        }

        if (size < 1 || size > MAX_PAGE_SIZE) {
            throw new IllegalArgumentException(
                    "Page size must be between 1 and "
                            + MAX_PAGE_SIZE + "."
            );
        }

        if (from != null
                && to != null
                && from.isAfter(to)) {
            throw new IllegalArgumentException(
                    "From date must not be after to date."
            );
        }
    }

    private String normalizeSerialNumberFilter(
            String serialNumber
    ) {
        String normalized =
                normalizeOptional(serialNumber);

        if (normalized == null) {
            return null;
        }

        return InputSanitizer
                .cleanSerialNumber(normalized)
                .toLowerCase(Locale.ROOT);
    }

    private String normalizeBorrowerFilter(
            String borrower
    ) {
        String normalized =
                normalizeOptional(borrower);

        if (normalized == null) {
            return null;
        }

        return InputSanitizer
                .cleanText(normalized)
                .toLowerCase(Locale.ROOT);
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }

    private String escapeLikePattern(String value) {
        return value
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
    }

    private void validateLoanForm(
            LoanFormDTO loanFormDTO
    ) {
        if (loanFormDTO == null) {
            throw new BusinessRuleException(
                    "Låneformulär saknas."
            );
        }

        if (loanFormDTO.getBorrowerName() == null
                || loanFormDTO
                .getBorrowerName()
                .isBlank()) {
            throw new BusinessRuleException(
                    "Namn måste anges."
            );
        }

        if (loanFormDTO.getEmail() == null
                || loanFormDTO
                .getEmail()
                .isBlank()) {
            throw new BusinessRuleException(
                    "E-post måste anges."
            );
        }

        if (loanFormDTO.getPhoneNumber() == null
                || loanFormDTO
                .getPhoneNumber()
                .isBlank()) {
            throw new BusinessRuleException(
                    "Telefonnummer måste anges."
            );
        }
    }
}