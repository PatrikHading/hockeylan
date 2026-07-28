package com.norops.hockeylan.dto;

public record CsrfTokenResponse(
        String token,
        String headerName
) {
}
