package com.norops.hockeylan.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "loans",
        indexes = {
                @Index(name = "idx_loans_equipment_id", columnList = "equipment_id"),
                @Index(name = "idx_loans_returned", columnList = "returned"),
                @Index(name = "idx_loans_loan_date", columnList = "loanDate")
        }
)
public class Loan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "equipment_id", nullable = false)
    private Equipment equipment;

    @Column(nullable = false, length = 100)
    private String borrowerName;

    @Column(nullable = false, length = 150)
    private String email;

    @Column(nullable = false, length = 30)
    private String phoneNumber;

    @Column(nullable = false, updatable = false)
    private LocalDateTime loanDate;

    @Column(nullable = false)
    private boolean returned = false;

    @Column(nullable = false)
    private LocalDateTime updatedDate;

    public Loan(Equipment equipment, String borrowerName, String email, String phoneNumber) {
        this.equipment = equipment;
        this.borrowerName = borrowerName;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.returned = false;
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.loanDate = now;
        this.updatedDate = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedDate = LocalDateTime.now();
    }
}