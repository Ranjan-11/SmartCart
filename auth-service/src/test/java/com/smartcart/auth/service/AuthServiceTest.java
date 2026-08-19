package com.smartcart.auth.service;

import com.smartcart.auth.dto.*;
import com.smartcart.auth.entity.RefreshToken;
import com.smartcart.auth.entity.Role;
import com.smartcart.auth.entity.User;
import com.smartcart.auth.repository.RefreshTokenRepository;
import com.smartcart.auth.repository.UserRepository;
import com.smartcart.auth.service.impl.AuthServiceImpl;
import com.smartcart.common.exception.ConflictException;
import com.smartcart.common.exception.UnauthorizedException;
import com.smartcart.common.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @InjectMocks
    private AuthServiceImpl authService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .email("user@smartcart.com")
                .password("encoded_secret_hash")
                .role(Role.ROLE_CUSTOMER)
                .active(true)
                .build();
    }

    @Test
    void shouldRegisterUserSuccessfully() {
        RegisterRequest request = RegisterRequest.builder()
                .email("user@smartcart.com")
                .password("plainPassword123")
                .role(Role.ROLE_CUSTOMER)
                .build();

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encoded_secret_hash");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);
        when(jwtTokenProvider.generateAccessToken(anyLong(), anyString(), anyList())).thenReturn("mock_access_token");
        when(jwtTokenProvider.generateRefreshToken(anyLong(), anyString())).thenReturn("mock_refresh_token");

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("mock_access_token", response.getAccessToken());
        assertEquals("user@smartcart.com", response.getEmail());
        assertEquals(List.of("ROLE_CUSTOMER"), response.getRoles());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void shouldThrowConflictWhenEmailAlreadyExists() {
        RegisterRequest request = RegisterRequest.builder()
                .email("user@smartcart.com")
                .password("plainPassword123")
                .build();

        when(userRepository.existsByEmail(anyString())).thenReturn(true);

        assertThrows(ConflictException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void shouldLoginSuccessfully() {
        LoginRequest request = LoginRequest.builder()
                .email("user@smartcart.com")
                .password("plainPassword123")
                .build();

        when(userRepository.findByEmail("user@smartcart.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("plainPassword123", "encoded_secret_hash")).thenReturn(true);
        when(jwtTokenProvider.generateAccessToken(anyLong(), anyString(), anyList())).thenReturn("mock_access_token");
        when(jwtTokenProvider.generateRefreshToken(anyLong(), anyString())).thenReturn("mock_refresh_token");

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("mock_access_token", response.getAccessToken());
        assertEquals(1L, response.getUserId());
    }

    @Test
    void shouldThrowUnauthorizedOnBadPassword() {
        LoginRequest request = LoginRequest.builder()
                .email("user@smartcart.com")
                .password("wrongPassword")
                .build();

        when(userRepository.findByEmail("user@smartcart.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("wrongPassword", "encoded_secret_hash")).thenReturn(false);

        assertThrows(UnauthorizedException.class, () -> authService.login(request));
    }

    @Test
    void shouldRefreshTokenSuccessfully() {
        RefreshTokenRequest request = RefreshTokenRequest.builder()
                .refreshToken("valid_refresh_token")
                .build();

        RefreshToken tokenEntity = RefreshToken.builder()
                .id(1L)
                .user(sampleUser)
                .token("valid_refresh_token")
                .expiryDate(Instant.now().plusSeconds(3600))
                .revoked(false)
                .build();

        when(jwtTokenProvider.validateToken("valid_refresh_token")).thenReturn(true);
        when(refreshTokenRepository.findByToken("valid_refresh_token")).thenReturn(Optional.of(tokenEntity));
        when(jwtTokenProvider.generateAccessToken(anyLong(), anyString(), anyList())).thenReturn("new_access_token");

        AuthResponse response = authService.refreshToken(request);

        assertNotNull(response);
        assertEquals("new_access_token", response.getAccessToken());
        assertEquals("valid_refresh_token", response.getRefreshToken());
    }
}
