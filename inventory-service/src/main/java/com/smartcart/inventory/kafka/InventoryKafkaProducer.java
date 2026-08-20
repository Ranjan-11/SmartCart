package com.smartcart.inventory.kafka;

import com.smartcart.common.event.InventoryFailedEvent;
import com.smartcart.common.event.InventoryReservedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class InventoryKafkaProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${kafka.topic.inventory-reserved}")
    private String inventoryReservedTopic;

    @Value("${kafka.topic.inventory-failed}")
    private String inventoryFailedTopic;

    public void publishInventoryReserved(InventoryReservedEvent event) {
        log.info("Publishing InventoryReservedEvent to topic: {} for order: {}", inventoryReservedTopic, event.getOrderNumber());
        kafkaTemplate.send(inventoryReservedTopic, event.getOrderNumber(), event);
    }

    public void publishInventoryFailed(InventoryFailedEvent event) {
        log.info("Publishing InventoryFailedEvent to topic: {} for order: {}", inventoryFailedTopic, event.getOrderNumber());
        kafkaTemplate.send(inventoryFailedTopic, event.getOrderNumber(), event);
    }
}
