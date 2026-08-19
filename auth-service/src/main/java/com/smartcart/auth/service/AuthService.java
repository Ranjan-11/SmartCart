package com.smartcart.auth.service;

import com.smartcart.auth.dto.AuthResponse;
import com.smartcart.auth.dto.LoginRequest;
import com.smartcart.auth.dto.RefreshTokenRequest;
import com.smartcart.auth.dto.RegisterRequest;
import com.smartcart.auth.dto.TokenValidationResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse refreshToken(RefreshTokenRequest request);
    TokenValidationResponse validateToken(String token);
}
