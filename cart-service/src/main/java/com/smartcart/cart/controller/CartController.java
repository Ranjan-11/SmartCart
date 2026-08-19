package com.smartcart.cart.controller;

import com.smartcart.cart.dto.AddToCartRequest;
import com.smartcart.cart.dto.CartResponse;
import com.smartcart.cart.dto.UpdateCartItemRequest;
import com.smartcart.cart.service.CartService;
import com.smartcart.common.dto.ApiResponse;
import com.smartcart.common.security.SecurityConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/cart")
@RequiredArgsConstructor
@Tag(name = "Shopping Cart", description = "Endpoints for managing user shopping cart persisted in Redis")
public class CartController {

    private final CartService cartService;

    @GetMapping
    @Operation(summary = "Get current user's shopping cart", description = "Retrieves user's cart from Redis")
    public ResponseEntity<ApiResponse<CartResponse>> getCart(
            Authentication authentication,
            @RequestHeader(value = SecurityConstants.HEADER_USER_ID, required = false) Long headerUserId
    ) {
        Long userId = extractUserId(authentication, headerUserId);
        CartResponse response = cartService.getCart(userId);
        return ResponseEntity.ok(ApiResponse.success("Cart retrieved successfully", response));
    }

    @PostMapping("/items")
    @Operation(summary = "Add item to shopping cart", description = "Fetches latest product price via OpenFeign and stores in Redis")
    public ResponseEntity<ApiResponse<CartResponse>> addItemToCart(
            Authentication authentication,
            @RequestHeader(value = SecurityConstants.HEADER_USER_ID, required = false) Long headerUserId,
            @Valid @RequestBody AddToCartRequest request
    ) {
        Long userId = extractUserId(authentication, headerUserId);
        CartResponse response = cartService.addItemToCart(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Item added to cart", response));
    }

    @PutMapping("/items/{sku}")
    @Operation(summary = "Update item quantity in cart", description = "Updates item count and recalculates totals")
    public ResponseEntity<ApiResponse<CartResponse>> updateItemQuantity(
            Authentication authentication,
            @RequestHeader(value = SecurityConstants.HEADER_USER_ID, required = false) Long headerUserId,
            @PathVariable("sku") String sku,
            @Valid @RequestBody UpdateCartItemRequest request
    ) {
        Long userId = extractUserId(authentication, headerUserId);
        CartResponse response = cartService.updateItemQuantity(userId, sku, request);
        return ResponseEntity.ok(ApiResponse.success("Cart item updated", response));
    }

    @DeleteMapping("/items/{sku}")
    @Operation(summary = "Remove item from cart", description = "Removes specific item by SKU")
    public ResponseEntity<ApiResponse<CartResponse>> removeItemFromCart(
            Authentication authentication,
            @RequestHeader(value = SecurityConstants.HEADER_USER_ID, required = false) Long headerUserId,
            @PathVariable("sku") String sku
    ) {
        Long userId = extractUserId(authentication, headerUserId);
        CartResponse response = cartService.removeItemFromCart(userId, sku);
        return ResponseEntity.ok(ApiResponse.success("Item removed from cart", response));
    }

    @DeleteMapping
    @Operation(summary = "Clear shopping cart", description = "Removes all items from current user's cart")
    public ResponseEntity<ApiResponse<Void>> clearCart(
            Authentication authentication,
            @RequestHeader(value = SecurityConstants.HEADER_USER_ID, required = false) Long headerUserId
    ) {
        Long userId = extractUserId(authentication, headerUserId);
        cartService.clearCart(userId);
        return ResponseEntity.ok(ApiResponse.success("Cart cleared successfully", null));
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
}
