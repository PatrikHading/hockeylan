package com.norops.hockeylan.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(

        @NotBlank(message = "Username is required.")
        @Size(max = 100, message = "Username may contain at most 100 characters.")
        String username,

        @NotBlank(message = "Password is required.")
        @Size(max = 200, message = "Password is too long.")
        String password
) {
}
