package com.smartcart.common.event;

import com.smartcart.common.dto.OrderItemDto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.util.List;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class InventoryReservedEvent extends BaseEvent {

    private String orderNumber;
    private Long userId;
    private String userEmail;
    private BigDecimal totalAmount;
    private List<OrderItemDto> items;
}
