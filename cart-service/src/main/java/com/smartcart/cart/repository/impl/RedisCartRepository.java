package com.smartcart.cart.repository.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcart.cart.model.Cart;
import com.smartcart.cart.repository.CartRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.util.Optional;

@Slf4j
@Repository
@org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(name = "cart.storage.type", havingValue = "redis", matchIfMissing = true)
@org.springframework.context.annotation.Profile("!test")
@RequiredArgsConstructor
public class RedisCartRepository implements CartRepository {

    private static final String KEY_PREFIX = "cart:";
    private static final Duration CART_TTL = Duration.ofDays(7);

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    @Override
    public Optional<Cart> findByUserId(Long userId) {
        String key = buildKey(userId);
        Object raw = redisTemplate.opsForValue().get(key);

        if (raw == null) {
            return Optional.empty();
        }

        try {
            Cart cart = objectMapper.convertValue(raw, Cart.class);
            return Optional.ofNullable(cart);
        } catch (Exception e) {
            log.error("Failed to deserialize cart for key: {}", key, e);
            return Optional.empty();
        }
    }

    @Override
    public Cart save(Cart cart) {
        String key = buildKey(cart.getUserId());
        redisTemplate.opsForValue().set(key, cart, CART_TTL);
        return cart;
    }

    @Override
    public void deleteByUserId(Long userId) {
        String key = buildKey(userId);
        redisTemplate.delete(key);
    }

    private String buildKey(Long userId) {
        return KEY_PREFIX + userId;
    }
}
