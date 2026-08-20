package com.smartcart.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockCheckResponse {

    private String sku;
    private Integer availableQuantity;
    private boolean inStock;
}
