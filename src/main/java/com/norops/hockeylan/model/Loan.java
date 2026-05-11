package com.norops.hockeylan.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "loans")
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

    public Loan(Equipment equipment,
                String borrowerName,
                String email,
                String phoneNumber
    ) {
        this.equipment = equipment;
        this.borrowerName = borrowerName;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.returned = false;
    }

    @PrePersist
    protected void onCreate() {
        this.loanDate = LocalDateTime.now();
    }
}
