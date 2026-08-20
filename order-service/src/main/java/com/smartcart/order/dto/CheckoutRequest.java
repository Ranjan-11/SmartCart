package com.smartcart.order.dto;

import com.smartcart.common.dto.OrderItemDto;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckoutRequest {

    @NotBlank(message = "Shipping address is required")
    private String shippingAddress;

    private String paymentMethod;

    /**
     * Optional: direct list of items to order.
     * If omitted or empty, order items will be fetched from user's shopping cart.
     */
    private List<OrderItemDto> items;
}
