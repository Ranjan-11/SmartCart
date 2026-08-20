package com.smartcart.inventory.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
@EnableKafka
public class KafkaConfig {

    @Value("${kafka.topic.inventory-reserved}")
    private String inventoryReservedTopic;

    @Value("${kafka.topic.inventory-failed}")
    private String inventoryFailedTopic;

    @Bean
    public NewTopic inventoryReservedTopic() {
        return TopicBuilder.name(inventoryReservedTopic)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic inventoryFailedTopic() {
        return TopicBuilder.name(inventoryFailedTopic)
                .partitions(3)
                .replicas(1)
                .build();
    }
}
