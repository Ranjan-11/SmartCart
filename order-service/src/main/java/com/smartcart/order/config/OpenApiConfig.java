package com.smartcart.order.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI orderOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("SmartCart Order Service API")
                        .description("Order Management, Checkout, Lifecycle & Distributed Saga Coordination")
                        .version("1.0.0")
                        .contact(new Contact().name("SmartCart Dev Team").email("dev@smartcart.com")));
    }
}
