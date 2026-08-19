package com.smartcart.gateway;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "eureka.client.register-with-eureka=false",
        "eureka.client.fetch-registry=false"
})
@ActiveProfiles("test")
class ApiGatewayApplicationTests {

    @Test
    void contextLoads() {
    }
}
