package com.smartcart.common.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class NotificationEvent extends BaseEvent {

    private String recipientEmail;
    private String subject;
    private String message;
    private String notificationType;
}
