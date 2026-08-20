package com.smartcart.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryResponse {

    private Long id;
    private String sku;
    private Integer availableQuantity;
    private Integer reservedQuantity;
    private Integer lowStockThreshold;
    private boolean lowStock;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
