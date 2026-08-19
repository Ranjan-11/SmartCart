package com.smartcart.product.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI productOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("SmartCart - Product Service API")
                        .description("Product Catalog, Categories, Search, and Filtering Service with Redis Caching")
                        .version("1.0.0")
                        .contact(new Contact().name("SmartCart Team").email("support@smartcart.com"))
                        .license(new License().name("Apache 2.0").url("https://springdoc.org")));
    }
}
