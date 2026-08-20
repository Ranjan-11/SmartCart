package com.smartcart.order.kafka;

import com.smartcart.common.event.OrderCancelledEvent;
import com.smartcart.common.event.OrderCreatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderKafkaProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${kafka.topic.order-created:order.created}")
    private String orderCreatedTopic;

    @Value("${kafka.topic.order-cancelled:order.cancelled}")
    private String orderCancelledTopic;

    public void publishOrderCreated(OrderCreatedEvent event) {
        log.info("Publishing OrderCreatedEvent to topic: {} for order: {}", orderCreatedTopic, event.getOrderNumber());
        kafkaTemplate.send(orderCreatedTopic, event.getOrderNumber(), event);
    }

    public void publishOrderCancelled(OrderCancelledEvent event) {
        log.info("Publishing OrderCancelledEvent to topic: {} for order: {}", orderCancelledTopic, event.getOrderNumber());
        kafkaTemplate.send(orderCancelledTopic, event.getOrderNumber(), event);
    }
}
