package com.smartcart.gateway.controller;

import com.smartcart.common.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/fallback")
public class FallbackController {

    @GetMapping("/auth")
    public ResponseEntity<ApiResponse<String>> authServiceFallback() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(ApiResponse.error("Auth Service is currently unavailable. Please try again later."));
    }

    @GetMapping("/user")
    public ResponseEntity<ApiResponse<String>> userServiceFallback() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(ApiResponse.error("User Service is currently unavailable. Please try again later."));
    }

    @GetMapping("/product")
    public ResponseEntity<ApiResponse<String>> productServiceFallback() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(ApiResponse.error("Product Service is currently unavailable. Please try again later."));
    }

    @GetMapping("/cart")
    public ResponseEntity<ApiResponse<String>> cartServiceFallback() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(ApiResponse.error("Cart Service is currently unavailable. Please try again later."));
    }

    @GetMapping("/order")
    public ResponseEntity<ApiResponse<String>> orderServiceFallback() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(ApiResponse.error("Order Service is currently unavailable. Please try again later."));
    }

    @GetMapping("/inventory")
    public ResponseEntity<ApiResponse<String>> inventoryServiceFallback() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(ApiResponse.error("Inventory Service is currently unavailable. Please try again later."));
    }

    @GetMapping("/payment")
    public ResponseEntity<ApiResponse<String>> paymentServiceFallback() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(ApiResponse.error("Payment Service is currently unavailable. Please try again later."));
    }
}
