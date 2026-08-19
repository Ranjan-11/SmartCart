package com.smartcart.cart.repository.impl;

import com.smartcart.cart.model.Cart;
import com.smartcart.cart.repository.CartRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Repository
@ConditionalOnProperty(name = "cart.storage.type", havingValue = "memory")
public class InMemoryCartRepository implements CartRepository {

    private final ConcurrentHashMap<Long, Cart> store = new ConcurrentHashMap<>();

    @Override
    public Optional<Cart> findByUserId(Long userId) {
        return Optional.ofNullable(store.get(userId));
    }

    @Override
    public Cart save(Cart cart) {
        store.put(cart.getUserId(), cart);
        return cart;
    }

    @Override
    public void deleteByUserId(Long userId) {
        store.remove(userId);
    }
}
