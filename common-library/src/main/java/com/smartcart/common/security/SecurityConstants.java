package com.smartcart.common.security;

public final class SecurityConstants {

    private SecurityConstants() {
        // Prevent instantiation
    }

    public static final String HEADER_USER_ID = "X-User-Id";
    public static final String HEADER_USER_EMAIL = "X-User-Email";
    public static final String HEADER_USER_ROLES = "X-User-Roles";

    public static final String CLAIM_USER_ID = "userId";
    public static final String CLAIM_ROLES = "roles";
    public static final String CLAIM_EMAIL = "email";

    public static final String TOKEN_PREFIX = "Bearer ";
    public static final String AUTHORIZATION_HEADER = "Authorization";

    public static final String ROLE_ADMIN = "ROLE_ADMIN";
    public static final String ROLE_CUSTOMER = "ROLE_CUSTOMER";

    public static final long DEFAULT_ACCESS_TOKEN_EXPIRATION_MS = 15 * 60 * 1000; // 15 minutes
    public static final long DEFAULT_REFRESH_TOKEN_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
}
