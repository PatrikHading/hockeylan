package com.norops.hockeylan.security;

import com.norops.hockeylan.model.Admin;
import com.norops.hockeylan.repository.AdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminUserDetailsService implements UserDetailsService {

    private final AdminRepository adminRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) {
        Admin admin = adminRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() ->
                        new UsernameNotFoundException("Invalid credentials")
                );

        return User.withUsername(admin.getUsername())
                .password(admin.getPasswordHash())
                .authorities("ADMIN")
                .disabled(!admin.isEnabled())
                .build();
    }
}
