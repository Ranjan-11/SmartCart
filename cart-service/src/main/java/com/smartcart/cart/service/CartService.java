package com.smartcart.cart.service;

import com.smartcart.cart.dto.AddToCartRequest;
import com.smartcart.cart.dto.CartResponse;
import com.smartcart.cart.dto.UpdateCartItemRequest;

public interface CartService {
    CartResponse getCart(Long userId);
    CartResponse addItemToCart(Long userId, AddToCartRequest request);
    CartResponse updateItemQuantity(Long userId, String sku, UpdateCartItemRequest request);
    CartResponse removeItemFromCart(Long userId, String sku);
    void clearCart(Long userId);
}
