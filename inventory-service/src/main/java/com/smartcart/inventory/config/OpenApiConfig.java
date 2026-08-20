package com.smartcart.inventory.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI inventoryOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("SmartCart Inventory Service API")
                        .description("Authoritative Inventory Management, Real-Time Stock Reservations, and Audits")
                        .version("1.0.0")
                        .contact(new Contact().name("SmartCart Dev Team").email("dev@smartcart.com")));
    }
}
