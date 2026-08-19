package com.smartcart.common.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class PaymentSuccessEvent extends BaseEvent {

    private String orderNumber;
    private Long userId;
    private String transactionId;
    private BigDecimal amount;
    private String paymentMethod;
}
