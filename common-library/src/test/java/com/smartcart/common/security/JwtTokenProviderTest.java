package com.smartcart.common.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    private static final String TEST_SECRET = "production_grade_super_secret_key_at_least_256_bits_length_123456789";
    private JwtTokenProvider jwtTokenProvider;

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider(TEST_SECRET, 3600000L, 86400000L);
    }

    @Test
    void shouldGenerateAndValidateAccessToken() {
        Long userId = 100L;
        String email = "customer@smartcart.com";
        List<String> roles = List.of(SecurityConstants.ROLE_CUSTOMER);

        String token = jwtTokenProvider.generateAccessToken(userId, email, roles);

        assertNotNull(token);
        assertTrue(jwtTokenProvider.validateToken(token));
        assertEquals(userId, jwtTokenProvider.getUserIdFromToken(token));
        assertEquals(email, jwtTokenProvider.getEmailFromToken(token));
        assertEquals(roles, jwtTokenProvider.getRolesFromToken(token));
    }

    @Test
    void shouldRejectInvalidSecret() {
        assertThrows(IllegalArgumentException.class, () -> new JwtTokenProvider("short-secret"));
    }

    @Test
    void shouldRejectTamperedToken() {
        String token = jwtTokenProvider.generateAccessToken(1L, "user@test.com", List.of(SecurityConstants.ROLE_CUSTOMER));
        String tamperedToken = token + "tampered";

        assertFalse(jwtTokenProvider.validateToken(tamperedToken));
    }
}
