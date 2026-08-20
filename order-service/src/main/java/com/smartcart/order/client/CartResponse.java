package com.smartcart.order.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartResponse {

    private Long userId;
    private List<CartItemResponse> items;
    private Integer totalItemCount;
    private BigDecimal totalPrice;
    private LocalDateTime updatedAt;
}
