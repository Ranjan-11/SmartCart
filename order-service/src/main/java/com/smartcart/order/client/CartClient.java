package com.smartcart.order.client;

import com.smartcart.common.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "cart-service")
public interface CartClient {

    @GetMapping("/api/v1/cart")
    ApiResponse<CartResponse> getCart(@RequestHeader("X-User-Id") Long userId);

    @DeleteMapping("/api/v1/cart")
    ApiResponse<Void> clearCart(@RequestHeader("X-User-Id") Long userId);
}
