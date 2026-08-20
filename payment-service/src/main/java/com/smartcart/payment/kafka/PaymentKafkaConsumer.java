package com.smartcart.payment.kafka;

import com.smartcart.common.event.InventoryReservedEvent;
import com.smartcart.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentKafkaConsumer {

    private final PaymentService paymentService;

    @KafkaListener(topics = "${kafka.topic.inventory-reserved:inventory.reserved}", groupId = "${spring.kafka.consumer.group-id:payment-service-group}")
    public void handleInventoryReserved(InventoryReservedEvent event) {
        log.info("Received InventoryReservedEvent for order: {}, totalAmount: {}", event.getOrderNumber(), event.getTotalAmount());
        try {
            paymentService.processPaymentForOrder(event);
        } catch (Exception e) {
            log.error("Error processing payment for order: {}", event.getOrderNumber(), e);
        }
    }
}
