package com.norops.hockeylan.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.DynamicUpdate;
import org.hibernate.proxy.HibernateProxy;

import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "equipment",
        indexes = {
                @Index(
                        name = "idx_equipment_available",
                        columnList = "available"
                ),
                @Index(
                        name = "idx_equipment_type",
                        columnList = "type"
                ),
                @Index(
                        name = "idx_equipment_active",
                        columnList = "active"
                ),
                @Index(
                        name = "idx_equipment_condition",
                        columnList = "condition"
                ),
                @Index(
                        name = "idx_equipment_age_category",
                        columnList = "age_category"
                ),
                @Index(
                        name = "idx_equipment_active_available_type",
                        columnList = "active, available, type"
                )
        }
)
@DynamicUpdate
public class Equipment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(
            nullable = false,
            length = 50
    )
    private EquipmentType type;

    @Column(
            nullable = false,
            length = 100
    )
    private String serialNumber;

    @Column(length = 50)
    private String size;

    @Column(length = 100)
    private String brand;

    @Column(length = 100)
    private String model;

    @Enumerated(EnumType.STRING)
    @Column(
            nullable = false,
            length = 30
    )
    private EquipmentCondition condition =
            EquipmentCondition.GOOD;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "age_category",
            length = 30
    )
    private AgeCategory ageCategory;

    @Column(
            name = "storage_location",
            length = 100
    )
    private String storageLocation;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private boolean available = true;

    @Column(nullable = false)
    private boolean active = true;

    public Equipment(
            EquipmentType type,
            String serialNumber,
            String description
    ) {
        this(
                type,
                serialNumber,
                null,
                null,
                null,
                EquipmentCondition.GOOD,
                null,
                null,
                description
        );
    }

    public Equipment(
            EquipmentType type,
            String serialNumber,
            String size,
            String brand,
            String model,
            EquipmentCondition condition,
            AgeCategory ageCategory,
            String storageLocation,
            String description
    ) {
        this.type = type;
        this.serialNumber =
                normalizeSerialNumber(serialNumber);
        this.size = normalizeOptionalText(size);
        this.brand = normalizeOptionalText(brand);
        this.model = normalizeOptionalText(model);
        this.condition = condition == null
                ? EquipmentCondition.GOOD
                : condition;
        this.ageCategory = ageCategory;
        this.storageLocation =
                normalizeOptionalText(storageLocation);
        this.description =
                normalizeOptionalText(description);
        this.available = true;
        this.active = true;
    }

    @PrePersist
    @PreUpdate
    protected void normalizeBeforeSave() {
        normalizeFields();
    }

    private void normalizeFields() {
        this.serialNumber =
                normalizeSerialNumber(this.serialNumber);
        this.size = normalizeOptionalText(this.size);
        this.brand = normalizeOptionalText(this.brand);
        this.model = normalizeOptionalText(this.model);
        this.storageLocation =
                normalizeOptionalText(
                        this.storageLocation
                );
        this.description =
                normalizeOptionalText(
                        this.description
                );

        if (this.condition == null) {
            this.condition =
                    EquipmentCondition.GOOD;
        }
    }

    private String normalizeSerialNumber(
            String serialNumber
    ) {
        if (serialNumber == null) {
            return null;
        }

        return serialNumber
                .trim()
                .toUpperCase();
    }

    private String normalizeOptionalText(
            String value
    ) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();

        return normalized.isBlank()
                ? null
                : normalized;
    }

    @Override
    public final boolean equals(Object object) {
        if (this == object) {
            return true;
        }

        if (object == null) {
            return false;
        }

        Class<?> objectClass =
                object instanceof HibernateProxy proxy
                        ? proxy
                        .getHibernateLazyInitializer()
                        .getPersistentClass()
                        : object.getClass();

        Class<?> thisClass =
                this instanceof HibernateProxy proxy
                        ? proxy
                        .getHibernateLazyInitializer()
                        .getPersistentClass()
                        : this.getClass();

        if (thisClass != objectClass) {
            return false;
        }

        Equipment equipment =
                (Equipment) object;

        return id != null
                && Objects.equals(
                id,
                equipment.id
        );
    }

    @Override
    public final int hashCode() {
        return this instanceof HibernateProxy proxy
                ? proxy
                .getHibernateLazyInitializer()
                .getPersistentClass()
                .hashCode()
                : getClass().hashCode();
    }

    @Override
    public String toString() {
        return "Equipment{" +
                "id=" + id +
                ", type=" + type +
                ", serialNumber='" +
                serialNumber + '\'' +
                ", size='" + size + '\'' +
                ", brand='" + brand + '\'' +
                ", model='" + model + '\'' +
                ", condition=" + condition +
                ", ageCategory=" +
                ageCategory +
                ", storageLocation='" +
                storageLocation + '\'' +
                ", available=" +
                available +
                ", active=" + active +
                ", createdDate=" +
                getCreatedDate() +
                ", updatedDate=" +
                getUpdatedDate() +
                '}';
    }
}