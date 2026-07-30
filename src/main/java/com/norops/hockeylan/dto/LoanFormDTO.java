package com.norops.hockeylan.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class LoanFormDTO {

    @NotBlank(
            message = "Name is required"
    )
    @Size(
            min = 2,
            max = 100,
            message =
                    "Name must be between 2 and 100 characters"
    )
    @Pattern(
            regexp =
                    "^[\\p{L} .'-]+$",
            message =
                    "Name may only contain letters, spaces, dots, hyphens and apostrophes"
    )
    private String borrowerName;

    @NotBlank(
            message = "Email is required"
    )
    @Email(
            message =
                    "Email must be valid"
    )
    @Size(
            max = 150,
            message =
                    "Email must be max 150 characters"
    )
    private String email;

    @NotBlank(
            message =
                    "Phone number is required"
    )
    @Size(
            min = 6,
            max = 30,
            message =
                    "Phone number must be between 6 and 30 characters"
    )
    @Pattern(
            regexp =
                    "^[0-9+()\\-\\s]+$",
            message =
                    "Phone number may only contain numbers, spaces, plus, hyphen and parentheses"
    )
    private String phoneNumber;

    @NotNull(
            message =
                    "Expected return date is required"
    )
    @FutureOrPresent(
            message =
                    "Expected return date must be today or a future date"
    )
    private LocalDate expectedReturnDate;
}