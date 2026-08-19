package com.smartcart.cart.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Notice: Price is intentionally excluded.
 * Cart Service fetches product price strictly from Product Service.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddToCartRequest {

    @NotBlank(message = "Product SKU is required")
    private String sku;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    @Builder.Default
    private Integer quantity = 1;
}
