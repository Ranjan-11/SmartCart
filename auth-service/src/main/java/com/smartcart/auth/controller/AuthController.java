package com.smartcart.auth.controller;

import com.smartcart.auth.dto.*;
import com.smartcart.auth.service.AuthService;
import com.smartcart.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Endpoints for user registration, authentication, and JWT token management")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user account", description = "Creates a new user credentials record with BCrypt password hashing and returns JWT tokens")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Received registration request for email: {}", request.getEmail());
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("User registered successfully", response));
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user credentials", description = "Verifies email and password, returning JWT access and refresh tokens")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        log.info("Received login request for email: {}", request.getEmail());
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/refresh-token")
    @Operation(summary = "Refresh JWT Access Token", description = "Issues a new JWT access token using a valid non-expired refresh token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success("Token refreshed successfully", response));
    }

    @PostMapping("/validate")
    @Operation(summary = "Validate JWT Token", description = "Validates token authenticity and extracts claims")
    public ResponseEntity<ApiResponse<TokenValidationResponse>> validateToken(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        TokenValidationResponse response = authService.validateToken(authHeader);
        return ResponseEntity.ok(ApiResponse.success("Token validation evaluated", response));
    }
}
