package com.smartcart.user.security;

import com.smartcart.common.security.SecurityConstants;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
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

@Component
public class UserHeaderAuthenticationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String userIdHeader = request.getHeader(SecurityConstants.HEADER_USER_ID);
        String rolesHeader = request.getHeader(SecurityConstants.HEADER_USER_ROLES);
        String emailHeader = request.getHeader(SecurityConstants.HEADER_USER_EMAIL);

        if (userIdHeader != null && !userIdHeader.trim().isEmpty()) {
            try {
                Long userId = Long.parseLong(userIdHeader.trim());

                List<SimpleGrantedAuthority> authorities = Collections.emptyList();
                if (rolesHeader != null && !rolesHeader.trim().isEmpty()) {
                    authorities = Arrays.stream(rolesHeader.split(","))
                            .map(String::trim)
                            .filter(role -> !role.isEmpty())
                            .map(SimpleGrantedAuthority::new)
                            .collect(Collectors.toList());
                }

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(userId, emailHeader, authorities);

                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (NumberFormatException ignored) {
                // Ignore invalid userId header format
            }
        }

        filterChain.doFilter(request, response);
    }
}
