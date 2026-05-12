package com.norops.hockeylan.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoanFormDTO {

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must be max 100 characters")
    private String borrowerName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Size(max = 150, message = "Email must be max 150 characters")
    private String email;

    @NotBlank(message = "Phone number is required")
    @Size(max = 30, message = "Phone number must be max 30 characters")
    private String phoneNumber;
}
