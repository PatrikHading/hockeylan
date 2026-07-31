package com.norops.hockeylan.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest(
        properties = {
                "app.cors.allowed-origins=http://localhost:5173"
        }
)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CorsIntegrationTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer POSTGRES =
            new PostgreSQLContainer(
                    "postgres:17-alpine"
            );

    @Autowired
    private MockMvc mockMvc;

    @Test
    void allowsConfiguredOrigin()
            throws Exception {
        mockMvc.perform(
                        options(
                                "/api/auth/login"
                        )
                                .header(
                                        HttpHeaders.ORIGIN,
                                        "http://localhost:5173"
                                )
                                .header(
                                        HttpHeaders
                                                .ACCESS_CONTROL_REQUEST_METHOD,
                                        HttpMethod.POST.name()
                                )
                                .header(
                                        HttpHeaders
                                                .ACCESS_CONTROL_REQUEST_HEADERS,
                                        "content-type,x-xsrf-token"
                                )
                )
                .andExpect(
                        status().isOk()
                )
                .andExpect(
                        header().string(
                                HttpHeaders
                                        .ACCESS_CONTROL_ALLOW_ORIGIN,
                                "http://localhost:5173"
                        )
                )
                .andExpect(
                        header().string(
                                HttpHeaders
                                        .ACCESS_CONTROL_ALLOW_CREDENTIALS,
                                "true"
                        )
                );
    }

    @Test
    void rejectsUnconfiguredOrigin()
            throws Exception {
        mockMvc.perform(
                        options(
                                "/api/auth/login"
                        )
                                .header(
                                        HttpHeaders.ORIGIN,
                                        "https://evil.example"
                                )
                                .header(
                                        HttpHeaders
                                                .ACCESS_CONTROL_REQUEST_METHOD,
                                        HttpMethod.POST.name()
                                )
                )
                .andExpect(
                        status().isForbidden()
                )
                .andExpect(
                        header().doesNotExist(
                                HttpHeaders
                                        .ACCESS_CONTROL_ALLOW_ORIGIN
                        )
                );
    }
}