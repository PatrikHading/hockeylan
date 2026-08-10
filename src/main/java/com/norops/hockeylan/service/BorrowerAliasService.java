package com.norops.hockeylan.service;

import com.norops.hockeylan.dto.BorrowerAliasResponseDTO;
import com.norops.hockeylan.dto.BorrowerAliasSummaryDTO;
import com.norops.hockeylan.exception.DuplicateResourceException;
import com.norops.hockeylan.exception.ResourceNotFoundException;
import com.norops.hockeylan.model.BorrowerAlias;
import com.norops.hockeylan.repository.BorrowerAliasRepository;
import com.norops.hockeylan.util.InputSanitizer;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class BorrowerAliasService {

    private static final int
            MIN_ALIAS_NAME_LENGTH = 2;

    private static final int
            MAX_ALIAS_NAME_LENGTH = 100;

    private static final int
            MAX_BORROWER_NAME_LENGTH = 100;

    private static final int
            MAX_EMAIL_LENGTH = 150;

    private static final int
            MIN_PHONE_NUMBER_LENGTH = 6;

    private static final int
            MAX_PHONE_NUMBER_LENGTH = 30;

    private final BorrowerAliasRepository
            borrowerAliasRepository;

    @Transactional(readOnly = true)
    public List<BorrowerAliasSummaryDTO>
    getAliasSummaries() {
        return borrowerAliasRepository
                .findAllByOrderByAliasNameAsc()
                .stream()
                .map(
                        borrowerAlias ->
                                new BorrowerAliasSummaryDTO(
                                        borrowerAlias
                                                .getId(),
                                        borrowerAlias
                                                .getAliasName()
                                )
                )
                .toList();
    }

    @Transactional(readOnly = true)
    public BorrowerAliasResponseDTO
    getAlias(
            Long id
    ) {
        BorrowerAlias borrowerAlias =
                borrowerAliasRepository
                        .findById(id)
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Alias not found with id: "
                                                        + id
                                        )
                        );

        return new BorrowerAliasResponseDTO(
                borrowerAlias.getId(),
                borrowerAlias.getAliasName(),
                borrowerAlias
                        .getBorrowerName(),
                borrowerAlias.getEmail(),
                borrowerAlias
                        .getPhoneNumber()
        );
    }

    public BorrowerAlias createAlias(
            String aliasName,
            String borrowerName,
            String email,
            String phoneNumber
    ) {
        String normalizedAliasName =
                InputSanitizer.cleanText(
                        aliasName
                );

        String normalizedBorrowerName =
                InputSanitizer.cleanText(
                        borrowerName
                );

        String normalizedEmail =
                InputSanitizer.cleanEmail(
                        email
                );

        String normalizedPhoneNumber =
                InputSanitizer
                        .cleanPhoneNumber(
                                phoneNumber
                        );

        validateAliasName(
                normalizedAliasName
        );

        validateBorrowerName(
                normalizedBorrowerName
        );

        validateEmail(
                normalizedEmail
        );

        validatePhoneNumber(
                normalizedPhoneNumber
        );

        if (
                borrowerAliasRepository
                        .existsByAliasNameIgnoreCase(
                                normalizedAliasName
                        )
        ) {
            throw duplicateAliasException();
        }

        BorrowerAlias borrowerAlias =
                new BorrowerAlias(
                        normalizedAliasName,
                        normalizedBorrowerName,
                        normalizedEmail,
                        normalizedPhoneNumber
                );

        try {
            return borrowerAliasRepository
                    .saveAndFlush(
                            borrowerAlias
                    );
        } catch (
                DataIntegrityViolationException
                        exception
        ) {
            throw duplicateAliasException();
        }
    }

    private void validateAliasName(
            String aliasName
    ) {
        if (
                aliasName == null
                        || aliasName.isBlank()
        ) {
            throw new IllegalArgumentException(
                    "Aliasnamn måste anges."
            );
        }

        if (
                aliasName.length()
                        < MIN_ALIAS_NAME_LENGTH
        ) {
            throw new IllegalArgumentException(
                    "Aliasnamnet måste innehålla minst 2 tecken."
            );
        }

        if (
                aliasName.length()
                        > MAX_ALIAS_NAME_LENGTH
        ) {
            throw new IllegalArgumentException(
                    "Aliasnamnet får innehålla högst 100 tecken."
            );
        }
    }

    private void validateBorrowerName(
            String borrowerName
    ) {
        if (
                borrowerName == null
                        || borrowerName.isBlank()
        ) {
            throw new IllegalArgumentException(
                    "Låntagarens namn måste anges."
            );
        }

        if (
                borrowerName.length()
                        > MAX_BORROWER_NAME_LENGTH
        ) {
            throw new IllegalArgumentException(
                    "Låntagarens namn får innehålla högst 100 tecken."
            );
        }
    }

    private void validateEmail(
            String email
    ) {
        if (
                email == null
                        || email.isBlank()
        ) {
            throw new IllegalArgumentException(
                    "Låntagarens e-postadress måste anges."
            );
        }

        if (
                email.length()
                        > MAX_EMAIL_LENGTH
        ) {
            throw new IllegalArgumentException(
                    "E-postadressen får innehålla högst 150 tecken."
            );
        }
    }

    private void validatePhoneNumber(
            String phoneNumber
    ) {
        if (
                phoneNumber == null
                        || phoneNumber.isBlank()
        ) {
            throw new IllegalArgumentException(
                    "Låntagarens telefonnummer måste anges."
            );
        }

        if (
                phoneNumber.length()
                        < MIN_PHONE_NUMBER_LENGTH
        ) {
            throw new IllegalArgumentException(
                    "Telefonnumret måste innehålla minst 6 tecken."
            );
        }

        if (
                phoneNumber.length()
                        > MAX_PHONE_NUMBER_LENGTH
        ) {
            throw new IllegalArgumentException(
                    "Telefonnumret får innehålla högst 30 tecken."
            );
        }
    }

    private DuplicateResourceException
    duplicateAliasException() {
        return new DuplicateResourceException(
                "Det finns redan ett Alias med det namnet."
        );
    }
}