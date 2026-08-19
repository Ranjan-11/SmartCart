package com.smartcart.auth.service.impl;

import com.smartcart.auth.dto.*;
import com.smartcart.auth.entity.RefreshToken;
import com.smartcart.auth.entity.Role;
import com.smartcart.auth.entity.User;
import com.smartcart.auth.repository.RefreshTokenRepository;
import com.smartcart.auth.repository.UserRepository;
import com.smartcart.auth.service.AuthService;
import com.smartcart.common.exception.ConflictException;
import com.smartcart.common.exception.UnauthorizedException;
import com.smartcart.common.security.JwtTokenProvider;
import com.smartcart.common.security.SecurityConstants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("Attempting to register user with email: {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email is already registered: " + request.getEmail());
        }

        Role role = request.getRole() != null ? request.getRole() : Role.ROLE_CUSTOMER;

        User user = User.builder()
                .email(request.getEmail().trim().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .active(true)
                .build();

        User savedUser = userRepository.save(user);
        log.info("User registered successfully with ID: {}", savedUser.getId());

        List<String> roles = List.of(savedUser.getRole().name());
        String accessToken = jwtTokenProvider.generateAccessToken(savedUser.getId(), savedUser.getEmail(), roles);
        String refreshToken = createOrUpdateRefreshToken(savedUser);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(SecurityConstants.DEFAULT_ACCESS_TOKEN_EXPIRATION_MS / 1000)
                .userId(savedUser.getId())
                .email(savedUser.getEmail())
                .roles(roles)
                .build();
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        log.info("Processing login request for email: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!user.isActive()) {
            throw new UnauthorizedException("User account is inactive");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        List<String> roles = List.of(user.getRole().name());
        String accessToken = jwtTokenProvider.generateAccessToken(user.getId(), user.getEmail(), roles);
        String refreshToken = createOrUpdateRefreshToken(user);

        log.info("User logged in successfully: {}", user.getEmail());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(SecurityConstants.DEFAULT_ACCESS_TOKEN_EXPIRATION_MS / 1000)
                .userId(user.getId())
                .email(user.getEmail())
                .roles(roles)
                .build();
    }

    @Override
    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String token = request.getRefreshToken();

        if (!jwtTokenProvider.validateToken(token)) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new UnauthorizedException("Refresh token not found"));

        if (refreshToken.isRevoked() || refreshToken.getExpiryDate().isBefore(Instant.now())) {
            throw new UnauthorizedException("Refresh token is expired or revoked");
        }

        User user = refreshToken.getUser();
        List<String> roles = List.of(user.getRole().name());
        String newAccessToken = jwtTokenProvider.generateAccessToken(user.getId(), user.getEmail(), roles);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(token)
                .tokenType("Bearer")
                .expiresIn(SecurityConstants.DEFAULT_ACCESS_TOKEN_EXPIRATION_MS / 1000)
                .userId(user.getId())
                .email(user.getEmail())
                .roles(roles)
                .build();
    }

    @Override
    public TokenValidationResponse validateToken(String token) {
        if (token != null && token.startsWith(SecurityConstants.TOKEN_PREFIX)) {
            token = token.substring(SecurityConstants.TOKEN_PREFIX.length());
        }

        if (token == null || !jwtTokenProvider.validateToken(token)) {
            return TokenValidationResponse.builder()
                    .valid(false)
                    .build();
        }

        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        String email = jwtTokenProvider.getEmailFromToken(token);
        List<String> roles = jwtTokenProvider.getRolesFromToken(token);

        return TokenValidationResponse.builder()
                .valid(true)
                .userId(userId)
                .email(email)
                .roles(roles)
                .build();
    }

    private String createOrUpdateRefreshToken(User user) {
        String token = jwtTokenProvider.generateRefreshToken(user.getId(), user.getEmail());
        Instant expiryDate = Instant.now().plusMillis(SecurityConstants.DEFAULT_REFRESH_TOKEN_EXPIRATION_MS);

        RefreshToken refreshToken = refreshTokenRepository.findByUser(user)
                .map(existing -> {
                    existing.setToken(token);
                    existing.setExpiryDate(expiryDate);
                    existing.setRevoked(false);
                    return existing;
                })
                .orElseGet(() -> RefreshToken.builder()
                        .user(user)
                        .token(token)
                        .expiryDate(expiryDate)
                        .revoked(false)
                        .build());

        refreshTokenRepository.save(refreshToken);
        return token;
    }
}
