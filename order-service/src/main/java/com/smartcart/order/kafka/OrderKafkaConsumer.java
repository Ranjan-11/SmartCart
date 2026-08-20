package com.smartcart.order.kafka;

import com.smartcart.common.event.InventoryFailedEvent;
import com.smartcart.common.event.InventoryReservedEvent;
import com.smartcart.common.event.PaymentFailedEvent;
import com.smartcart.common.event.PaymentSuccessEvent;
import com.smartcart.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderKafkaConsumer {

    private final OrderService orderService;

    @KafkaListener(topics = "${kafka.topic.inventory-reserved:inventory.reserved}", groupId = "${spring.kafka.consumer.group-id:order-service-group}")
    public void handleInventoryReserved(InventoryReservedEvent event) {
        log.info("Received InventoryReservedEvent for order: {}", event.getOrderNumber());
        try {
            orderService.processInventoryReserved(event);
        } catch (Exception e) {
            log.error("Error processing InventoryReservedEvent for order: {}", event.getOrderNumber(), e);
        }
    }

    @KafkaListener(topics = "${kafka.topic.inventory-failed:inventory.failed}", groupId = "${spring.kafka.consumer.group-id:order-service-group}")
    public void handleInventoryFailed(InventoryFailedEvent event) {
        log.info("Received InventoryFailedEvent for order: {}", event.getOrderNumber());
        try {
            orderService.processInventoryFailed(event);
        } catch (Exception e) {
            log.error("Error processing InventoryFailedEvent for order: {}", event.getOrderNumber(), e);
        }
    }

    @KafkaListener(topics = "${kafka.topic.payment-success:payment.success}", groupId = "${spring.kafka.consumer.group-id:order-service-group}")
    public void handlePaymentSuccess(PaymentSuccessEvent event) {
        log.info("Received PaymentSuccessEvent for order: {}", event.getOrderNumber());
        try {
            orderService.processPaymentSuccess(event);
        } catch (Exception e) {
            log.error("Error processing PaymentSuccessEvent for order: {}", event.getOrderNumber(), e);
        }
    }

    @KafkaListener(topics = "${kafka.topic.payment-failed:payment.failed}", groupId = "${spring.kafka.consumer.group-id:order-service-group}")
    public void handlePaymentFailed(PaymentFailedEvent event) {
        log.info("Received PaymentFailedEvent for order: {}", event.getOrderNumber());
        try {
            orderService.processPaymentFailed(event);
        } catch (Exception e) {
            log.error("Error processing PaymentFailedEvent for order: {}", event.getOrderNumber(), e);
        }
    }
}
