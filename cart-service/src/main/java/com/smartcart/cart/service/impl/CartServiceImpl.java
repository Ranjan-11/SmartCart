package com.smartcart.cart.service.impl;

import com.smartcart.cart.client.ProductClient;
import com.smartcart.cart.client.ProductDto;
import com.smartcart.cart.dto.*;
import com.smartcart.cart.model.Cart;
import com.smartcart.cart.model.CartItem;
import com.smartcart.cart.repository.CartRepository;
import com.smartcart.cart.service.CartService;
import com.smartcart.common.dto.ApiResponse;
import com.smartcart.common.exception.BadRequestException;
import com.smartcart.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final ProductClient productClient;

    @Override
    public CartResponse getCart(Long userId) {
        log.info("Fetching cart for user ID: {}", userId);
        Cart cart = cartRepository.findByUserId(userId)
                .orElseGet(() -> Cart.builder()
                        .userId(userId)
                        .items(new ArrayList<>())
                        .totalItemCount(0)
                        .totalPrice(BigDecimal.ZERO)
                        .updatedAt(LocalDateTime.now())
                        .build());
        return mapToResponse(cart);
    }

    @Override
    public CartResponse addItemToCart(Long userId, AddToCartRequest request) {
        String sku = request.getSku().trim().toUpperCase();
        int requestedQuantity = request.getQuantity();

        log.info("Adding item to cart for user ID: {}, SKU: {}, Quantity: {}", userId, sku, requestedQuantity);

        // Fetch verified product details and server-side price via OpenFeign
        ProductDto product = fetchProductDetails(sku);

        if (!product.isActive()) {
            throw new BadRequestException("Product is currently unavailable: " + sku);
        }

        if (product.getStockQuantity() != null && product.getStockQuantity() < requestedQuantity) {
            throw new BadRequestException(String.format("Insufficient stock for %s. Available: %d, Requested: %d",
                    sku, product.getStockQuantity(), requestedQuantity));
        }

        Cart cart = cartRepository.findByUserId(userId)
                .orElseGet(() -> Cart.builder()
                        .userId(userId)
                        .items(new ArrayList<>())
                        .build());

        Optional<CartItem> existingItemOpt = cart.getItems().stream()
                .filter(item -> item.getSku().equalsIgnoreCase(sku))
                .findFirst();

        if (existingItemOpt.isPresent()) {
            CartItem existingItem = existingItemOpt.get();
            int newQuantity = existingItem.getQuantity() + requestedQuantity;

            if (product.getStockQuantity() != null && product.getStockQuantity() < newQuantity) {
                throw new BadRequestException(String.format("Cannot exceed available stock (%d) for %s",
                        product.getStockQuantity(), sku));
            }

            existingItem.setQuantity(newQuantity);
            existingItem.setUnitPrice(product.getPrice());
            existingItem.setProductName(product.getName());
            existingItem.setImageUrl(product.getImageUrl());
        } else {
            CartItem newItem = CartItem.builder()
                    .sku(product.getSku())
                    .productName(product.getName())
                    .unitPrice(product.getPrice())
                    .quantity(requestedQuantity)
                    .imageUrl(product.getImageUrl())
                    .build();
            cart.getItems().add(newItem);
        }

        cart.recalculateTotals();
        Cart savedCart = cartRepository.save(cart);
        log.info("Cart updated successfully for user ID: {}, Total items: {}, Total price: {}",
                userId, savedCart.getTotalItemCount(), savedCart.getTotalPrice());

        return mapToResponse(savedCart);
    }

    @Override
    public CartResponse updateItemQuantity(Long userId, String sku, UpdateCartItemRequest request) {
        String normalizedSku = sku.trim().toUpperCase();
        int newQuantity = request.getQuantity();

        log.info("Updating item quantity for user ID: {}, SKU: {}, New Quantity: {}", userId, normalizedSku, newQuantity);

        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found for user ID: " + userId));

        CartItem item = cart.getItems().stream()
                .filter(i -> i.getSku().equalsIgnoreCase(normalizedSku))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Item with SKU " + normalizedSku + " not in cart"));

        ProductDto product = fetchProductDetails(normalizedSku);
        if (product.getStockQuantity() != null && product.getStockQuantity() < newQuantity) {
            throw new BadRequestException(String.format("Cannot exceed available stock (%d) for %s",
                    product.getStockQuantity(), normalizedSku));
        }

        item.setQuantity(newQuantity);
        item.setUnitPrice(product.getPrice());
        item.setProductName(product.getName());

        cart.recalculateTotals();
        Cart savedCart = cartRepository.save(cart);
        return mapToResponse(savedCart);
    }

    @Override
    public CartResponse removeItemFromCart(Long userId, String sku) {
        String normalizedSku = sku.trim().toUpperCase();
        log.info("Removing item SKU: {} from cart for user ID: {}", normalizedSku, userId);

        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found for user ID: " + userId));

        boolean removed = cart.getItems().removeIf(i -> i.getSku().equalsIgnoreCase(normalizedSku));
        if (!removed) {
            throw new ResourceNotFoundException("Item with SKU " + normalizedSku + " not in cart");
        }

        cart.recalculateTotals();
        Cart savedCart = cartRepository.save(cart);
        return mapToResponse(savedCart);
    }

    @Override
    public void clearCart(Long userId) {
        log.info("Clearing cart for user ID: {}", userId);
        cartRepository.deleteByUserId(userId);
    }

    private ProductDto fetchProductDetails(String sku) {
        try {
            ResponseEntity<ApiResponse<ProductDto>> response = productClient.getProductBySku(sku);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null && response.getBody().getData() != null) {
                return response.getBody().getData();
            }
            throw new BadRequestException("Product not found with SKU: " + sku);
        } catch (Exception e) {
            log.error("Error communicating with Product Service for SKU: {}", sku, e);
            if (e instanceof BadRequestException) {
                throw (BadRequestException) e;
            }
            throw new BadRequestException("Failed to verify product with Product Service: " + e.getMessage());
        }
    }

    private CartResponse mapToResponse(Cart cart) {
        List<CartItemResponse> itemResponses = cart.getItems() != null
                ? cart.getItems().stream().map(item -> CartItemResponse.builder()
                        .sku(item.getSku())
                        .productName(item.getProductName())
                        .unitPrice(item.getUnitPrice())
                        .quantity(item.getQuantity())
                        .subtotal(item.getSubtotal())
                        .imageUrl(item.getImageUrl())
                        .build())
                .collect(Collectors.toList())
                : List.of();

        return CartResponse.builder()
                .userId(cart.getUserId())
                .items(itemResponses)
                .totalItemCount(cart.getTotalItemCount() != null ? cart.getTotalItemCount() : 0)
                .totalPrice(cart.getTotalPrice() != null ? cart.getTotalPrice() : BigDecimal.ZERO)
                .updatedAt(cart.getUpdatedAt())
                .build();
    }
}
