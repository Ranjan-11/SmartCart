package com.smartcart.common.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public abstract class BaseEvent implements Serializable {

    @lombok.Builder.Default
    private String eventId = UUID.randomUUID().toString();

    private String eventType;

    @lombok.Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    private String aggregateId;
}
