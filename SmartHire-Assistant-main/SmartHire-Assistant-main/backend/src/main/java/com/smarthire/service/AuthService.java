package com.smarthire.service;

import com.smarthire.dto.LoginRequest;
import com.smarthire.dto.LoginResponse;
import com.smarthire.entity.AppUser;
import com.smarthire.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AppUserRepository userRepository;

    private static final List<String> VALID_ROLES = List.of("ADMIN", "RECRUITER", "CANDIDATE");

    public LoginResponse register(LoginRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            return LoginResponse.builder()
                    .success(false)
                    .message("Email already registered")
                    .build();
        }

        String role = req.getRole() != null ? req.getRole().toUpperCase() : "CANDIDATE";
        if (!VALID_ROLES.contains(role)) role = "CANDIDATE";

        AppUser user = userRepository.save(AppUser.builder()
                .name(req.getName())
                .email(req.getEmail())
                .password(req.getPassword())
                .role(role)
                .build());

        return LoginResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .message("Registered successfully")
                .success(true)
                .build();
    }

    public LoginResponse login(LoginRequest req) {
        Optional<AppUser> userOpt = userRepository.findByEmail(req.getEmail());

        if (userOpt.isEmpty()) {
            return LoginResponse.builder()
                    .success(false)
                    .message("User not found. Please register first.")
                    .build();
        }

        AppUser user = userOpt.get();
        return LoginResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .message("Login successful")
                .success(true)
                .build();
    }
}
