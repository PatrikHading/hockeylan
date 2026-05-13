package com.norops.hockeylan.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.proxy.HibernateProxy;

import java.time.LocalDateTime;
import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "equipment",
        indexes = {
                @Index(name = "idx_equipment_available", columnList = "available"),
                @Index(name = "idx_equipment_type", columnList = "type")
        }
)
public class Equipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private EquipmentType type;

    @Column(nullable = false, length = 100)
    private String serialNumber;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private boolean available = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdDate;

    @Column(nullable = false)
    private LocalDateTime updatedDate;

    public Equipment(EquipmentType type, String serialNumber, String description) {
        this.type = type;
        this.serialNumber = normalizeSerialNumber(serialNumber);
        this.description = normalizeDescription(description);
        this.available = true;
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();

        if (this.createdDate == null) {
            this.createdDate = now;
        }

        this.updatedDate = now;
        normalizeFields();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedDate = LocalDateTime.now();
        normalizeFields();
    }

    private void normalizeFields() {
        this.serialNumber = normalizeSerialNumber(this.serialNumber);
        this.description = normalizeDescription(this.description);
    }

    private String normalizeSerialNumber(String serialNumber) {
        if (serialNumber == null) {
            return null;
        }

        return serialNumber.trim().toUpperCase();
    }

    private String normalizeDescription(String description) {
        if (description == null) {
            return null;
        }

        String normalized = description.trim();
        return normalized.isBlank() ? null : normalized;
    }

    @Override
    public final boolean equals(Object object) {
        if (this == object) {
            return true;
        }

        if (object == null) {
            return false;
        }

        Class<?> objectClass = object instanceof HibernateProxy proxy
                ? proxy.getHibernateLazyInitializer().getPersistentClass()
                : object.getClass();

        Class<?> thisClass = this instanceof HibernateProxy proxy
                ? proxy.getHibernateLazyInitializer().getPersistentClass()
                : this.getClass();

        if (thisClass != objectClass) {
            return false;
        }

        Equipment equipment = (Equipment) object;
        return id != null && Objects.equals(id, equipment.id);
    }

    @Override
    public final int hashCode() {
        return this instanceof HibernateProxy proxy
                ? proxy.getHibernateLazyInitializer().getPersistentClass().hashCode()
                : getClass().hashCode();
    }

    @Override
    public String toString() {
        return "Equipment{" +
                "id=" + id +
                ", type=" + type +
                ", serialNumber='" + serialNumber + '\'' +
                ", available=" + available +
                ", createdDate=" + createdDate +
                ", updatedDate=" + updatedDate +
                '}';
    }
}