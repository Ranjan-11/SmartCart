package com.smartcart.common.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Slf4j
public class JwtTokenProvider {

    private final SecretKey secretKey;
    private final long accessTokenExpirationMs;
    private final long refreshTokenExpirationMs;

    public JwtTokenProvider(String secret) {
        this(secret, SecurityConstants.DEFAULT_ACCESS_TOKEN_EXPIRATION_MS, SecurityConstants.DEFAULT_REFRESH_TOKEN_EXPIRATION_MS);
    }

    public JwtTokenProvider(String secret, long accessTokenExpirationMs, long refreshTokenExpirationMs) {
        if (secret == null || secret.length() < 32) {
            throw new IllegalArgumentException("JWT Secret must be at least 32 characters long for HMAC-SHA algorithms.");
        }
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenExpirationMs = accessTokenExpirationMs;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
    }

    public String generateAccessToken(Long userId, String email, List<String> roles) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + accessTokenExpirationMs);

        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(String.valueOf(userId))
                .claim(SecurityConstants.CLAIM_USER_ID, userId)
                .claim(SecurityConstants.CLAIM_EMAIL, email)
                .claim(SecurityConstants.CLAIM_ROLES, roles)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(secretKey)
                .compact();
    }

    public String generateRefreshToken(Long userId, String email) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + refreshTokenExpirationMs);

        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(String.valueOf(userId))
                .claim(SecurityConstants.CLAIM_USER_ID, userId)
                .claim(SecurityConstants.CLAIM_EMAIL, email)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(secretKey)
                .compact();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("JWT token is expired: {}", e.getMessage());
        } catch (JwtException | IllegalArgumentException e) {
            log.error("Invalid JWT token: {}", e.getMessage());
        }
        return false;
    }

    public Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public Long getUserIdFromToken(String token) {
        Claims claims = getClaims(token);
        Object userIdClaim = claims.get(SecurityConstants.CLAIM_USER_ID);
        if (userIdClaim instanceof Number) {
            return ((Number) userIdClaim).longValue();
        }
        return Long.parseLong(claims.getSubject());
    }

    public String getEmailFromToken(String token) {
        Claims claims = getClaims(token);
        return claims.get(SecurityConstants.CLAIM_EMAIL, String.class);
    }

    @SuppressWarnings("unchecked")
    public List<String> getRolesFromToken(String token) {
        Claims claims = getClaims(token);
        return claims.get(SecurityConstants.CLAIM_ROLES, List.class);
    }
}
