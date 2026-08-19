package com.smartcart.gateway.filter;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcart.common.dto.ErrorResponse;
import com.smartcart.common.security.JwtTokenProvider;
import com.smartcart.common.security.SecurityConstants;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
public class AuthenticationFilter extends AbstractGatewayFilterFactory<AuthenticationFilter.Config> {

    private final RouteValidator routeValidator;
    private final JwtTokenProvider jwtTokenProvider;
    private final ObjectMapper objectMapper;

    public AuthenticationFilter(RouteValidator routeValidator, JwtTokenProvider jwtTokenProvider, ObjectMapper objectMapper) {
        super(Config.class);
        this.routeValidator = routeValidator;
        this.jwtTokenProvider = jwtTokenProvider;
        this.objectMapper = objectMapper;
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();

            if (routeValidator.isSecured.test(request)) {
                if (!request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
                    log.warn("Missing Authorization Header for request: {}", request.getURI().getPath());
                    return onError(exchange, "Missing Authorization Header", HttpStatus.UNAUTHORIZED);
                }

                String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
                if (authHeader == null || !authHeader.startsWith(SecurityConstants.TOKEN_PREFIX)) {
                    log.warn("Invalid Authorization Header format: {}", authHeader);
                    return onError(exchange, "Invalid Authorization Header format", HttpStatus.UNAUTHORIZED);
                }

                String token = authHeader.substring(SecurityConstants.TOKEN_PREFIX.length());

                if (!jwtTokenProvider.validateToken(token)) {
                    log.warn("Invalid or expired JWT token for path: {}", request.getURI().getPath());
                    return onError(exchange, "Unauthorized: Invalid or expired JWT token", HttpStatus.UNAUTHORIZED);
                }

                try {
                    Long userId = jwtTokenProvider.getUserIdFromToken(token);
                    String email = jwtTokenProvider.getEmailFromToken(token);
                    List<String> roles = jwtTokenProvider.getRolesFromToken(token);

                    ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                            .header(SecurityConstants.HEADER_USER_ID, String.valueOf(userId))
                            .header(SecurityConstants.HEADER_USER_EMAIL, email != null ? email : "")
                            .header(SecurityConstants.HEADER_USER_ROLES, roles != null ? String.join(",", roles) : "")
                            .build();

                    return chain.filter(exchange.mutate().request(mutatedRequest).build());
                } catch (Exception e) {
                    log.error("Failed to parse claims from JWT token", e);
                    return onError(exchange, "Unauthorized: Failed to parse token claims", HttpStatus.UNAUTHORIZED);
                }
            }

            return chain.filter(exchange);
        };
    }

    private Mono<Void> onError(ServerWebExchange exchange, String message, HttpStatus httpStatus) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(httpStatus);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        ErrorResponse errorResponse = ErrorResponse.builder()
                .success(false)
                .status(httpStatus.value())
                .error(httpStatus.getReasonPhrase())
                .message(message)
                .path(exchange.getRequest().getURI().getPath())
                .timestamp(LocalDateTime.now())
                .build();

        byte[] bytes;
        try {
            bytes = objectMapper.writeValueAsBytes(errorResponse);
        } catch (JsonProcessingException e) {
            bytes = ("{\"success\":false,\"message\":\"" + message + "\"}").getBytes(StandardCharsets.UTF_8);
        }

        DataBuffer buffer = response.bufferFactory().wrap(bytes);
        return response.writeWith(Mono.just(buffer));
    }

    public static class Config {
        // Configuration properties if needed
    }
}
