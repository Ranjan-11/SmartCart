package com.smartcart.inventory.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchStockCheckRequest {

    @NotEmpty(message = "SKU list cannot be empty")
    private List<String> skus;
}
