package com.smartcart.gateway.filter;

import org.springframework.http.HttpMethod;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.function.Predicate;

@Component
public class RouteValidator {

    public static final List<String> OPEN_API_ENDPOINTS = List.of(
            "/api/v1/auth/register",
            "/api/v1/auth/login",
            "/api/v1/auth/refresh-token",
            "/eureka",
            "/actuator/health",
            "/actuator/info",
            "/fallback"
    );

    public Predicate<ServerHttpRequest> isSecured = request -> {
        String path = request.getURI().getPath();
        HttpMethod method = request.getMethod();

        // Allow public GET requests to product and category browsing
        if (method == HttpMethod.GET && (path.startsWith("/api/v1/products") || path.startsWith("/api/v1/categories"))) {
            return false;
        }

        // Allow explicitly open endpoints
        return OPEN_API_ENDPOINTS.stream().noneMatch(path::startsWith);
    };
}
