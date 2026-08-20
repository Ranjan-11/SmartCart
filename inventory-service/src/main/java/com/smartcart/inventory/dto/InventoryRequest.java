package com.smartcart.inventory.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryRequest {

    @NotBlank(message = "SKU is required")
    private String sku;

    @NotNull(message = "Available quantity is required")
    @Min(value = 0, message = "Available quantity cannot be negative")
    private Integer availableQuantity;

    @Min(value = 0, message = "Low stock threshold cannot be negative")
    private Integer lowStockThreshold;
}
