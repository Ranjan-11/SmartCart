package com.smartcart.cart.repository;

import com.smartcart.cart.model.Cart;

import java.util.Optional;

public interface CartRepository {
    Optional<Cart> findByUserId(Long userId);
    Cart save(Cart cart);
    void deleteByUserId(Long userId);
}
