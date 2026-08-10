package com.norops.hockeylan.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.proxy.HibernateProxy;

import java.util.Locale;
import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "borrower_aliases")
public class BorrowerAlias extends BaseEntity {

    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    private Long id;

    @Column(
            name = "alias_name",
            nullable = false,
            length = 100
    )
    private String aliasName;

    @Column(
            name = "borrower_name",
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
            name = "phone_number",
            nullable = false,
            length = 30
    )
    private String phoneNumber;

    public BorrowerAlias(
            String aliasName,
            String borrowerName,
            String email,
            String phoneNumber
    ) {
        this.aliasName =
                normalizeText(aliasName);
        this.borrowerName =
                normalizeText(borrowerName);
        this.email =
                normalizeEmail(email);
        this.phoneNumber =
                normalizeText(phoneNumber);
    }

    @PrePersist
    @PreUpdate
    protected void normalizeBeforeSave() {
        aliasName =
                normalizeText(aliasName);

        borrowerName =
                normalizeText(borrowerName);

        email =
                normalizeEmail(email);

        phoneNumber =
                normalizeText(phoneNumber);
    }

    private String normalizeText(
            String value
    ) {
        if (value == null) {
            return null;
        }

        return value
                .trim()
                .replaceAll(
                        "\\s+",
                        " "
                );
    }

    private String normalizeEmail(
            String value
    ) {
        String normalized =
                normalizeText(value);

        if (normalized == null) {
            return null;
        }

        return normalized.toLowerCase(
                Locale.ROOT
        );
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

        BorrowerAlias borrowerAlias =
                (BorrowerAlias) object;

        return id != null
                && Objects.equals(
                id,
                borrowerAlias.id
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
        return "BorrowerAlias{" +
                "id=" + id +
                '}';
    }
}