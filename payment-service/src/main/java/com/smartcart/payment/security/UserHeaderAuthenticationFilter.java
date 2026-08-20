package com.smartcart.payment.security;

import com.smartcart.common.security.SecurityConstants;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Component
public class UserHeaderAuthenticationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String userIdHeader = request.getHeader(SecurityConstants.HEADER_USER_ID);
        String userRolesHeader = request.getHeader(SecurityConstants.HEADER_USER_ROLES);
        String userEmailHeader = request.getHeader(SecurityConstants.HEADER_USER_EMAIL);

        if (userIdHeader != null && !userIdHeader.isBlank()) {
            try {
                Long userId = Long.valueOf(userIdHeader.trim());

                List<SimpleGrantedAuthority> authorities = Collections.emptyList();
                if (userRolesHeader != null && !userRolesHeader.isBlank()) {
                    authorities = Arrays.stream(userRolesHeader.split(","))
                            .map(String::trim)
                            .filter(role -> !role.isEmpty())
                            .map(role -> role.startsWith("ROLE_") ? role : "ROLE_" + role)
                            .map(SimpleGrantedAuthority::new)
                            .collect(Collectors.toList());
                }

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(userId, userEmailHeader, authorities);

                SecurityContextHolder.getContext().setAuthentication(authentication);
                log.debug("Set SecurityContext for user ID: {}, roles: {}", userId, authorities);
            } catch (NumberFormatException e) {
                log.warn("Invalid X-User-Id header value: {}", userIdHeader);
            }
        }

        filterChain.doFilter(request, response);
    }
}
