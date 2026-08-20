package com.smartcart.payment.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class IdempotencyService {

    private final RedisTemplate<String, String> redisTemplate;
    private final Set<String> localProcessedKeys = ConcurrentHashMap.newKeySet();

    public IdempotencyService(@Autowired(required = false) RedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public boolean tryAcquire(String idempotencyKey, long timeoutSeconds) {
        String key = "idempotency:payment:" + idempotencyKey;
        if (redisTemplate != null) {
            try {
                Boolean success = redisTemplate.opsForValue().setIfAbsent(key, "PROCESSING", Duration.ofSeconds(timeoutSeconds));
                return Boolean.TRUE.equals(success);
            } catch (Exception e) {
                log.warn("Redis unavailable for idempotency lock ({}), falling back to local memory: {}", key, e.getMessage());
            }
        }
        return localProcessedKeys.add(key);
    }

    public void markCompleted(String idempotencyKey, long ttlSeconds) {
        String key = "idempotency:payment:" + idempotencyKey;
        if (redisTemplate != null) {
            try {
                redisTemplate.opsForValue().set(key, "COMPLETED", Duration.ofSeconds(ttlSeconds));
                return;
            } catch (Exception e) {
                log.warn("Redis unavailable to mark completed ({}), falling back to local memory: {}", key, e.getMessage());
            }
        }
        localProcessedKeys.add(key);
    }

    public void release(String idempotencyKey) {
        String key = "idempotency:payment:" + idempotencyKey;
        if (redisTemplate != null) {
            try {
                redisTemplate.delete(key);
                return;
            } catch (Exception e) {
                log.warn("Redis unavailable to release lock ({}), falling back to local memory: {}", key, e.getMessage());
            }
        }
        localProcessedKeys.remove(key);
    }
}
