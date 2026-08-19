package com.smartcart.cart;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.test.context.ActiveProfiles;
import com.smartcart.cart.client.ProductClient;

@SpringBootTest
@ActiveProfiles("test")
class CartServiceApplicationTests {

    @MockBean
    private com.smartcart.cart.repository.CartRepository cartRepository;

    @MockBean
    private ProductClient productClient;

    @Test
    void contextLoads() {
    }
}
