package com.smartcart.common.event;

import com.smartcart.common.dto.OrderItemDto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class PaymentFailedEvent extends BaseEvent {

    private String orderNumber;
    private Long userId;
    private String reason;
    private List<OrderItemDto> items;
}
