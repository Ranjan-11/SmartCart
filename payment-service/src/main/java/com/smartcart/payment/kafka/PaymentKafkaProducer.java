package com.smartcart.payment.kafka;

import com.smartcart.common.event.PaymentFailedEvent;
import com.smartcart.common.event.PaymentSuccessEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentKafkaProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${kafka.topic.payment-success:payment.success}")
    private String paymentSuccessTopic;

    @Value("${kafka.topic.payment-failed:payment.failed}")
    private String paymentFailedTopic;

    public void publishPaymentSuccess(PaymentSuccessEvent event) {
        log.info("Publishing PaymentSuccessEvent to topic: {} for order: {}, txn: {}",
                paymentSuccessTopic, event.getOrderNumber(), event.getTransactionId());
        kafkaTemplate.send(paymentSuccessTopic, event.getOrderNumber(), event);
    }

    public void publishPaymentFailed(PaymentFailedEvent event) {
        log.info("Publishing PaymentFailedEvent to topic: {} for order: {}, reason: {}",
                paymentFailedTopic, event.getOrderNumber(), event.getReason());
        kafkaTemplate.send(paymentFailedTopic, event.getOrderNumber(), event);
    }
}
