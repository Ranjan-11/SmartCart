package com.smartcart.inventory.kafka;

import com.smartcart.common.event.OrderCancelledEvent;
import com.smartcart.common.event.OrderCreatedEvent;
import com.smartcart.common.event.PaymentFailedEvent;
import com.smartcart.common.event.PaymentSuccessEvent;
import com.smartcart.inventory.service.InventoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class InventoryKafkaConsumer {

 private final InventoryService inventoryService;

    @KafkaListener(topics = "${kafka.topic.order-created}", groupId = "${spring.kafka.consumer.group-id}")
    public void handleOrderCreated(OrderCreatedEvent event) {
        log.info("Received OrderCreatedEvent for order: {}", event.getOrderNumber());
        try {
            inventoryService.processOrderCreated(event);
        } catch (Exception e) {
            log.error("Error handling OrderCreatedEvent for order: {}", event.getOrderNumber(), e);
        }
    }

    @KafkaListener(topics = "${kafka.topic.payment-success}", groupId = "${spring.kafka.consumer.group-id}")
    public void handlePaymentSuccess(PaymentSuccessEvent event) {
        log.info("Received PaymentSuccessEvent for order: {}", event.getOrderNumber());
        try {
            inventoryService.processPaymentSuccess(event);
        } catch (Exception e) {
            log.error("Error handling PaymentSuccessEvent for order: {}", event.getOrderNumber(), e);
        }
    }

    @KafkaListener(topics = "${kafka.topic.payment-failed}", groupId = "${spring.kafka.consumer.group-id}")
    public void handlePaymentFailed(PaymentFailedEvent event) {
        log.info("Received PaymentFailedEvent for order: {}", event.getOrderNumber());
        try {
            inventoryService.processPaymentFailed(event);
        } catch (Exception e) {
            log.error("Error handling PaymentFailedEvent for order: {}", event.getOrderNumber(), e);
        }
    }

    @KafkaListener(topics = "${kafka.topic.order-cancelled}", groupId = "${spring.kafka.consumer.group-id}")
    public void handleOrderCancelled(OrderCancelledEvent event) {
        log.info("Received OrderCancelledEvent for order: {}", event.getOrderNumber());
        try {
            inventoryService.processOrderCancelled(event);
        } catch (Exception e) {
            log.error("Error handling OrderCancelledEvent for order: {}", event.getOrderNumber(), e);
        }
    }
}
