package com.smartcart.order.controller;

import com.smartcart.common.dto.ApiResponse;
import com.smartcart.common.dto.PageResponse;
import com.smartcart.common.security.SecurityConstants;
import com.smartcart.order.dto.CancelOrderRequest;
import com.smartcart.order.dto.CheckoutRequest;
import com.smartcart.order.dto.OrderResponse;
import com.smartcart.order.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@Tag(name = "Order Management", description = "Order Placement, Checkout, Status Tracking, and Cancellation APIs")
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/checkout")
    @Operation(summary = "Checkout and create order from shopping cart")
    public ResponseEntity<ApiResponse<OrderResponse>> checkout(
            Authentication authentication,
            @RequestHeader(value = SecurityConstants.HEADER_USER_ID, required = false) Long headerUserId,
            @RequestHeader(value = SecurityConstants.HEADER_USER_EMAIL, required = false) String headerUserEmail,
            @Valid @RequestBody CheckoutRequest request) {

        Long userId = extractUserId(authentication, headerUserId);
        String userEmail = extractUserEmail(authentication, headerUserEmail);

        log.info("REST request to checkout order for user ID: {}", userId);
        OrderResponse response = orderService.createOrder(userId, userEmail, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Order created successfully", response));
    }

    @PostMapping
    @Operation(summary = "Create order directly with items or cart")
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            Authentication authentication,
            @RequestHeader(value = SecurityConstants.HEADER_USER_ID, required = false) Long headerUserId,
            @RequestHeader(value = SecurityConstants.HEADER_USER_EMAIL, required = false) String headerUserEmail,
            @Valid @RequestBody CheckoutRequest request) {

        Long userId = extractUserId(authentication, headerUserId);
        String userEmail = extractUserEmail(authentication, headerUserEmail);

        log.info("REST request to create order for user ID: {}", userId);
        OrderResponse response = orderService.createOrder(userId, userEmail, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Order created successfully", response));
    }

    @GetMapping("/{orderNumber}")
    @Operation(summary = "Get order details by order number")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderByOrderNumber(
            Authentication authentication,
            @RequestHeader(value = SecurityConstants.HEADER_USER_ID, required = false) Long headerUserId,
            @RequestHeader(value = SecurityConstants.HEADER_USER_ROLES, required = false) String headerUserRoles,
            @PathVariable("orderNumber") String orderNumber) {

        Long userId = extractUserId(authentication, headerUserId);
        boolean isAdmin = checkIsAdmin(authentication, headerUserRoles);

        log.debug("REST request to get order: {} for user: {} (admin={})", orderNumber, userId, isAdmin);
        OrderResponse response = orderService.getOrderByOrderNumber(userId, orderNumber, isAdmin);
        return ResponseEntity.ok(ApiResponse.success("Order retrieved successfully", response));
    }

    @GetMapping
    @Operation(summary = "Get user order history (or all orders for Admin)")
    public ResponseEntity<ApiResponse<PageResponse<OrderResponse>>> getOrders(
            Authentication authentication,
            @RequestHeader(value = SecurityConstants.HEADER_USER_ID, required = false) Long headerUserId,
            @RequestHeader(value = SecurityConstants.HEADER_USER_ROLES, required = false) String headerUserRoles,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size) {

        Long userId = extractUserId(authentication, headerUserId);
        boolean isAdmin = checkIsAdmin(authentication, headerUserRoles);

        log.debug("REST request to get orders for user: {}, page: {}, size: {} (admin={})", userId, page, size, isAdmin);
        PageResponse<OrderResponse> response = isAdmin
                ? orderService.getAllOrders(page, size)
                : orderService.getUserOrders(userId, page, size);
        return ResponseEntity.ok(ApiResponse.success("Orders retrieved successfully", response));
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all system orders (Admin only)")
    public ResponseEntity<ApiResponse<PageResponse<OrderResponse>>> getAllOrdersAdmin(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size) {

        log.debug("REST admin request to get all orders, page: {}, size: {}", page, size);
        PageResponse<OrderResponse> response = orderService.getAllOrders(page, size);
        return ResponseEntity.ok(ApiResponse.success("All orders retrieved successfully", response));
    }

    @PutMapping("/{orderNumber}/cancel")
    @Operation(summary = "Cancel an order")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(
            Authentication authentication,
            @RequestHeader(value = SecurityConstants.HEADER_USER_ID, required = false) Long headerUserId,
            @RequestHeader(value = SecurityConstants.HEADER_USER_ROLES, required = false) String headerUserRoles,
            @PathVariable("orderNumber") String orderNumber,
            @Valid @RequestBody CancelOrderRequest request) {

        Long userId = extractUserId(authentication, headerUserId);
        boolean isAdmin = checkIsAdmin(authentication, headerUserRoles);

        log.info("REST request to cancel order: {} by user: {} (admin={})", orderNumber, userId, isAdmin);
        OrderResponse response = orderService.cancelOrder(userId, orderNumber, request, isAdmin);
        return ResponseEntity.ok(ApiResponse.success("Order cancelled successfully", response));
    }

    private Long extractUserId(Authentication authentication, Long headerUserId) {
        if (headerUserId != null) {
            return headerUserId;
        }
        if (authentication != null && authentication.getPrincipal() instanceof Long) {
            return (Long) authentication.getPrincipal();
        }
        throw new com.smartcart.common.exception.UnauthorizedException("User context not authenticated");
    }

    private String extractUserEmail(Authentication authentication, String headerUserEmail) {
        if (headerUserEmail != null && !headerUserEmail.isBlank()) {
            return headerUserEmail;
        }
        if (authentication != null && authentication.getCredentials() instanceof String) {
            return (String) authentication.getCredentials();
        }
        return null;
    }

    private boolean checkIsAdmin(Authentication authentication, String userRolesHeader) {
        if (userRolesHeader != null && userRolesHeader.contains("ADMIN")) {
            return true;
        }
        if (authentication != null) {
            return authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ADMIN"));
        }
        return false;
    }
}
