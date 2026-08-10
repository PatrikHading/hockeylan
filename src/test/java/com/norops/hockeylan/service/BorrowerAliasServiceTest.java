package com.norops.hockeylan.service;

import com.norops.hockeylan.dto.BorrowerAliasResponseDTO;
import com.norops.hockeylan.dto.BorrowerAliasSummaryDTO;
import com.norops.hockeylan.exception.DuplicateResourceException;
import com.norops.hockeylan.exception.ResourceNotFoundException;
import com.norops.hockeylan.model.BorrowerAlias;
import com.norops.hockeylan.repository.BorrowerAliasRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BorrowerAliasServiceTest {

    @Mock
    private BorrowerAliasRepository
            borrowerAliasRepository;

    @Test
    void getAliasSummariesShouldReturnOnlyIdAndAliasName() {
        BorrowerAlias firstAlias =
                borrowerAlias(
                        1L,
                        "Patrik",
                        "Patrik Hading",
                        "patrik@example.com",
                        "0701234567"
                );

        BorrowerAlias secondAlias =
                borrowerAlias(
                        2L,
                        "Tränare U12",
                        "Anna Andersson",
                        "anna@example.com",
                        "0709876543"
                );

        when(
                borrowerAliasRepository
                        .findAllByOrderByAliasNameAsc()
        ).thenReturn(
                List.of(
                        firstAlias,
                        secondAlias
                )
        );

        BorrowerAliasService service =
                service();

        List<BorrowerAliasSummaryDTO>
                result =
                service.getAliasSummaries();

        assertEquals(
                2,
                result.size()
        );

        assertAll(
                () -> assertEquals(
                        1L,
                        result.get(0).id()
                ),
                () -> assertEquals(
                        "Patrik",
                        result.get(0)
                                .aliasName()
                ),
                () -> assertEquals(
                        2L,
                        result.get(1).id()
                ),
                () -> assertEquals(
                        "Tränare U12",
                        result.get(1)
                                .aliasName()
                )
        );
    }

    @Test
    void getAliasShouldReturnContactDetails() {
        BorrowerAlias alias =
                borrowerAlias(
                        7L,
                        "Patrik",
                        "Patrik Hading",
                        "patrik@example.com",
                        "0701234567"
                );

        when(
                borrowerAliasRepository
                        .findById(7L)
        ).thenReturn(
                Optional.of(alias)
        );

        BorrowerAliasService service =
                service();

        BorrowerAliasResponseDTO result =
                service.getAlias(7L);

        assertAll(
                () -> assertEquals(
                        7L,
                        result.id()
                ),
                () -> assertEquals(
                        "Patrik",
                        result.aliasName()
                ),
                () -> assertEquals(
                        "Patrik Hading",
                        result.borrowerName()
                ),
                () -> assertEquals(
                        "patrik@example.com",
                        result.email()
                ),
                () -> assertEquals(
                        "0701234567",
                        result.phoneNumber()
                )
        );
    }

    @Test
    void getAliasShouldThrowWhenAliasDoesNotExist() {
        when(
                borrowerAliasRepository
                        .findById(999L)
        ).thenReturn(
                Optional.empty()
        );

        BorrowerAliasService service =
                service();

        ResourceNotFoundException exception =
                assertThrows(
                        ResourceNotFoundException.class,
                        () ->
                                service.getAlias(
                                        999L
                                )
                );

        assertEquals(
                "Alias not found with id: 999",
                exception.getMessage()
        );
    }

    @Test
    void createAliasShouldNormalizeAndSaveContactDetails() {
        when(
                borrowerAliasRepository
                        .existsByAliasNameIgnoreCase(
                                "Patrik"
                        )
        ).thenReturn(false);

        when(
                borrowerAliasRepository
                        .saveAndFlush(
                                any(
                                        BorrowerAlias.class
                                )
                        )
        ).thenAnswer(
                invocation ->
                        invocation.getArgument(
                                0
                        )
        );

        BorrowerAliasService service =
                service();

        BorrowerAlias result =
                service.createAlias(
                        "  Patrik  ",
                        "  Patrik   Hading  ",
                        "  PATRIK@EXAMPLE.COM  ",
                        "  0701234567  "
                );

        assertAll(
                () -> assertEquals(
                        "Patrik",
                        result.getAliasName()
                ),
                () -> assertEquals(
                        "Patrik Hading",
                        result.getBorrowerName()
                ),
                () -> assertEquals(
                        "patrik@example.com",
                        result.getEmail()
                ),
                () -> assertEquals(
                        "0701234567",
                        result.getPhoneNumber()
                )
        );

        verify(
                borrowerAliasRepository
        ).existsByAliasNameIgnoreCase(
                "Patrik"
        );

        verify(
                borrowerAliasRepository
        ).saveAndFlush(
                any(
                        BorrowerAlias.class
                )
        );
    }

    @Test
    void createAliasShouldRejectExistingAliasIgnoringCase() {
        when(
                borrowerAliasRepository
                        .existsByAliasNameIgnoreCase(
                                "patrik"
                        )
        ).thenReturn(true);

        BorrowerAliasService service =
                service();

        DuplicateResourceException
                exception =
                assertThrows(
                        DuplicateResourceException.class,
                        () ->
                                service.createAlias(
                                        "patrik",
                                        "Patrik Hading",
                                        "patrik@example.com",
                                        "0701234567"
                                )
                );

        assertEquals(
                "Det finns redan ett Alias med det namnet.",
                exception.getMessage()
        );

        verify(
                borrowerAliasRepository,
                never()
        ).saveAndFlush(
                any(
                        BorrowerAlias.class
                )
        );
    }

    @Test
    void createAliasShouldRejectBlankAliasName() {
        BorrowerAliasService service =
                service();

        IllegalArgumentException exception =
                assertThrows(
                        IllegalArgumentException.class,
                        () ->
                                service.createAlias(
                                        "   ",
                                        "Patrik Hading",
                                        "patrik@example.com",
                                        "0701234567"
                                )
                );

        assertEquals(
                "Aliasnamn måste anges.",
                exception.getMessage()
        );

        verify(
                borrowerAliasRepository,
                never()
        ).existsByAliasNameIgnoreCase(
                any()
        );

        verify(
                borrowerAliasRepository,
                never()
        ).saveAndFlush(
                any(
                        BorrowerAlias.class
                )
        );
    }

    @Test
    void createAliasShouldRejectAliasNameThatIsTooShortAfterNormalization() {
        BorrowerAliasService service =
                service();

        IllegalArgumentException exception =
                assertThrows(
                        IllegalArgumentException.class,
                        () ->
                                service.createAlias(
                                        " A ",
                                        "Patrik Hading",
                                        "patrik@example.com",
                                        "0701234567"
                                )
                );

        assertEquals(
                "Aliasnamnet måste innehålla minst 2 tecken.",
                exception.getMessage()
        );
    }

    @Test
    void createAliasShouldConvertDatabaseRaceToDuplicateResource() {
        when(
                borrowerAliasRepository
                        .existsByAliasNameIgnoreCase(
                                "Patrik"
                        )
        ).thenReturn(false);

        when(
                borrowerAliasRepository
                        .saveAndFlush(
                                any(
                                        BorrowerAlias.class
                                )
                        )
        ).thenThrow(
                new DataIntegrityViolationException(
                        "Unique constraint violation"
                )
        );

        BorrowerAliasService service =
                service();

        DuplicateResourceException
                exception =
                assertThrows(
                        DuplicateResourceException.class,
                        () ->
                                service.createAlias(
                                        "Patrik",
                                        "Patrik Hading",
                                        "patrik@example.com",
                                        "0701234567"
                                )
                );

        assertEquals(
                "Det finns redan ett Alias med det namnet.",
                exception.getMessage()
        );
    }

    @Test
    void getAliasSummariesShouldAllowEmptyAliasList() {
        when(
                borrowerAliasRepository
                        .findAllByOrderByAliasNameAsc()
        ).thenReturn(
                List.of()
        );

        BorrowerAliasService service =
                service();

        List<BorrowerAliasSummaryDTO>
                result =
                service.getAliasSummaries();

        assertTrue(
                result.isEmpty()
        );
    }

    private BorrowerAliasService service() {
        return new BorrowerAliasService(
                borrowerAliasRepository
        );
    }

    private BorrowerAlias borrowerAlias(
            Long id,
            String aliasName,
            String borrowerName,
            String email,
            String phoneNumber
    ) {
        BorrowerAlias alias =
                new BorrowerAlias(
                        aliasName,
                        borrowerName,
                        email,
                        phoneNumber
                );

        alias.setId(id);

        return alias;
    }
}