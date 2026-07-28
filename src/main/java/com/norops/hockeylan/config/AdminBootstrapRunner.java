package com.norops.hockeylan.config;

import com.norops.hockeylan.model.Admin;
import com.norops.hockeylan.repository.AdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(
        name = "app.admin-bootstrap.enabled",
        havingValue = "true"
)
public class AdminBootstrapRunner implements CommandLineRunner {

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin-bootstrap.username:}")
    private String username;

    @Value("${app.admin-bootstrap.password:}")
    private String password;

    @Override
    @Transactional
    public void run(String... args) {
        validateInput();

        if (adminRepository.count() > 0) {
            throw new IllegalStateException(
                    "Administrator bootstrap refused: an administrator already exists."
            );
        }

        Admin admin = new Admin(
                username,
                passwordEncoder.encode(password)
        );

        adminRepository.save(admin);

        System.out.printf(
                "Initial administrator '%s' was created successfully.%n",
                admin.getUsername()
        );
    }

    private void validateInput() {
        if (username == null || username.isBlank()) {
            throw new IllegalStateException(
                    "ADMIN_BOOTSTRAP_USERNAME must be provided."
            );
        }

        if (password == null || password.length() < 12) {
            throw new IllegalStateException(
                    "ADMIN_BOOTSTRAP_PASSWORD must contain at least 12 characters."
            );
        }

        if (password.length() > 200) {
            throw new IllegalStateException(
                    "ADMIN_BOOTSTRAP_PASSWORD is too long."
            );
        }
    }
}