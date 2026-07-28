package com.norops.hockeylan.dto;

public record AuthSessionResponse(
        boolean authenticated,
        String username
) {
}
