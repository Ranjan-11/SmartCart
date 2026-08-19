package com.smartcart.gateway.config;

import com.smartcart.common.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JwtConfig {

    @Value("${jwt.secret:defaultSecretKeyForSmartCartMicroservicesSystemMustBe256BitsLong}")
    private String jwtSecret;

    @Value("${jwt.access-token-expiration-ms:900000}")
    private long accessTokenExpirationMs;

    @Value("${jwt.refresh-token-expiration-ms:604800000}")
    private long refreshTokenExpirationMs;

    @Bean
    public JwtTokenProvider jwtTokenProvider() {
        return new JwtTokenProvider(jwtSecret, accessTokenExpirationMs, refreshTokenExpirationMs);
    }
}
