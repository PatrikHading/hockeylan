package com.norops.hockeylan.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.DynamicUpdate;
import org.hibernate.proxy.HibernateProxy;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "loans",
        indexes = {
                @Index(
                        name = "idx_loans_equipment_id",
                        columnList = "equipment_id"
                ),
                @Index(
                        name = "idx_loans_returned",
                        columnList = "returned"
                ),
                @Index(
                        name = "idx_loans_loan_date",
                        columnList = "loan_date"
                ),
                @Index(
                        name = "idx_loans_active_expected_return_date",
                        columnList = "expected_return_date"
                )
        }
)
@DynamicUpdate
public class Loan extends BaseEntity {

    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    private Long id;

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "equipment_id",
            nullable = false,
            foreignKey = @ForeignKey(
                    name = "fk_loans_equipment"
            )
    )
    private Equipment equipment;

    @Column(
            nullable = false,
            length = 100
    )
    private String borrowerName;

    @Column(
            nullable = false,
            length = 150
    )
    private String email;

    @Column(
            nullable = false,
            length = 30
    )
    private String phoneNumber;

    @Column(
            nullable = false,
            updatable = false
    )
    private LocalDateTime loanDate;

    @Column(
            name = "expected_return_date"
    )
    private LocalDate expectedReturnDate;

    @Column(nullable = false)
    private boolean returned = false;

    @Column(name = "returned_at")
    private LocalDateTime returnedAt;

    public Loan(
            Equipment equipment,
            String borrowerName,
            String email,
            String phoneNumber,
            LocalDate expectedReturnDate
    ) {
        this.equipment = equipment;
        this.borrowerName =
                normalizeName(borrowerName);
        this.email =
                normalizeEmail(email);
        this.phoneNumber =
                normalizePhoneNumber(
                        phoneNumber
                );
        this.expectedReturnDate =
                expectedReturnDate;
        this.returned = false;
        this.returnedAt = null;
    }

    public void registerReturn(
            LocalDateTime returnTime
    ) {
        if (returnTime == null) {
            throw new IllegalArgumentException(
                    "Return time must not be null."
            );
        }

        if (returned) {
            throw new IllegalStateException(
                    "Loan is already returned."
            );
        }

        if (
                loanDate != null
                        && returnTime.isBefore(
                        loanDate
                )
        ) {
            throw new IllegalArgumentException(
                    "Return time must not be before loan time."
            );
        }

        returned = true;
        returnedAt = returnTime;
    }

    public boolean isOverdue(
            LocalDate currentDate
    ) {
        Objects.requireNonNull(
                currentDate,
                "Current date must not be null."
        );

        return !returned
                && expectedReturnDate != null
                && expectedReturnDate.isBefore(
                currentDate
        );
    }

    public boolean wasReturnedLate() {
        return returned
                && returnedAt != null
                && expectedReturnDate != null
                && returnedAt
                .toLocalDate()
                .isAfter(
                        expectedReturnDate
                );
    }

    @PrePersist
    @PreUpdate
    protected void validateAndNormalizeBeforeSave() {
        if (loanDate == null) {
            loanDate =
                    LocalDateTime.now();
        }

        validateExpectedReturnDate();
        validateReturnState();
        normalizeFields();
    }

    private void validateExpectedReturnDate() {
        if (expectedReturnDate == null) {
            return;
        }

        LocalDate loanDay =
                loanDate.toLocalDate();

        if (
                expectedReturnDate.isBefore(
                        loanDay
                )
        ) {
            throw new IllegalStateException(
                    "Expected return date must not be before loan date."
            );
        }
    }

    private void validateReturnState() {
        if (
                returned
                        && returnedAt == null
        ) {
            throw new IllegalStateException(
                    "Returned loan must have a return time."
            );
        }

        if (
                !returned
                        && returnedAt != null
        ) {
            throw new IllegalStateException(
                    "Active loan must not have a return time."
            );
        }

        if (
                returnedAt != null
                        && returnedAt.isBefore(
                        loanDate
                )
        ) {
            throw new IllegalStateException(
                    "Return time must not be before loan time."
            );
        }
    }

    private void normalizeFields() {
        borrowerName =
                normalizeName(
                        borrowerName
                );

        email =
                normalizeEmail(email);

        phoneNumber =
                normalizePhoneNumber(
                        phoneNumber
                );
    }

    private String normalizeName(
            String value
    ) {
        return value == null
                ? null
                : value.trim();
    }

    private String normalizeEmail(
            String value
    ) {
        return value == null
                ? null
                : value
                .trim()
                .toLowerCase();
    }

    private String normalizePhoneNumber(
            String value
    ) {
        return value == null
                ? null
                : value.trim();
    }

    @Override
    public final boolean equals(
            Object object
    ) {
        if (this == object) {
            return true;
        }

        if (object == null) {
            return false;
        }

        Class<?> objectClass =
                object
                        instanceof
                        HibernateProxy proxy
                        ? proxy
                        .getHibernateLazyInitializer()
                        .getPersistentClass()
                        : object.getClass();

        Class<?> thisClass =
                this
                        instanceof
                        HibernateProxy proxy
                        ? proxy
                        .getHibernateLazyInitializer()
                        .getPersistentClass()
                        : getClass();

        if (thisClass != objectClass) {
            return false;
        }

        Loan loan = (Loan) object;

        return id != null
                && Objects.equals(
                id,
                loan.id
        );
    }

    @Override
    public final int hashCode() {
        return this
                instanceof
                HibernateProxy proxy
                ? proxy
                .getHibernateLazyInitializer()
                .getPersistentClass()
                .hashCode()
                : getClass().hashCode();
    }

    @Override
    public String toString() {
        return "Loan{" +
                "id=" + id +
                ", borrowerName='" +
                borrowerName + '\'' +
                ", email='" +
                email + '\'' +
                ", returned=" +
                returned +
                ", loanDate=" +
                loanDate +
                ", expectedReturnDate=" +
                expectedReturnDate +
                ", returnedAt=" +
                returnedAt +
                ", createdDate=" +
                getCreatedDate() +
                ", updatedDate=" +
                getUpdatedDate() +
                '}';
    }
}