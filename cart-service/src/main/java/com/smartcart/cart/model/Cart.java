package com.smartcart.cart.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Cart implements Serializable {

    private Long userId;

    @Builder.Default
    private List<CartItem> items = new ArrayList<>();

    @Builder.Default
    private Integer totalItemCount = 0;

    @Builder.Default
    private BigDecimal totalPrice = BigDecimal.ZERO;

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    public void recalculateTotals() {
        if (items == null) {
            items = new ArrayList<>();
        }

        int count = 0;
        BigDecimal total = BigDecimal.ZERO;

        for (CartItem item : items) {
            if (item.getQuantity() != null && item.getUnitPrice() != null) {
                item.setSubtotal(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
                count += item.getQuantity();
                total = total.add(item.getSubtotal());
            }
        }

        this.totalItemCount = count;
        this.totalPrice = total;
        this.updatedAt = LocalDateTime.now();
    }
}
