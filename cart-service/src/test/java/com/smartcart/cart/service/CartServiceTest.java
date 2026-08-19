package com.smartcart.cart.service;

import com.smartcart.cart.client.ProductClient;
import com.smartcart.cart.client.ProductDto;
import com.smartcart.cart.dto.AddToCartRequest;
import com.smartcart.cart.dto.CartResponse;
import com.smartcart.cart.dto.UpdateCartItemRequest;
import com.smartcart.cart.model.Cart;
import com.smartcart.cart.model.CartItem;
import com.smartcart.cart.repository.CartRepository;
import com.smartcart.cart.service.impl.CartServiceImpl;
import com.smartcart.common.dto.ApiResponse;
import com.smartcart.common.exception.BadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CartServiceTest {

    @Mock
    private CartRepository cartRepository;

    @Mock
    private ProductClient productClient;

    @InjectMocks
    private CartServiceImpl cartService;

    private ProductDto sampleProduct;
    private Cart sampleCart;

    @BeforeEach
    void setUp() {
        sampleProduct = ProductDto.builder()
                .id(10L)
                .sku("PHONE-01")
                .name("Smart Phone")
                .price(new BigDecimal("500.00"))
                .stockQuantity(10)
                .active(true)
                .imageUrl("https://cdn.example.com/phone.jpg")
                .build();

        sampleCart = Cart.builder()
                .userId(1L)
                .items(new ArrayList<>())
                .build();
    }

    @Test
    void shouldAddItemToCartWithServerCalculatedPrice() {
        AddToCartRequest request = AddToCartRequest.builder()
                .sku("PHONE-01")
                .quantity(2)
                .build();

        when(productClient.getProductBySku("PHONE-01"))
                .thenReturn(ResponseEntity.ok(ApiResponse.success(sampleProduct)));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(sampleCart));
        when(cartRepository.save(any(Cart.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CartResponse response = cartService.addItemToCart(1L, request);

        assertNotNull(response);
        assertEquals(2, response.getTotalItemCount());
        assertEquals(new BigDecimal("1000.00"), response.getTotalPrice());
        assertEquals(1, response.getItems().size());
        assertEquals(new BigDecimal("500.00"), response.getItems().get(0).getUnitPrice());
        assertEquals(new BigDecimal("1000.00"), response.getItems().get(0).getSubtotal());
    }

    @Test
    void shouldRejectAddItemWhenInsufficientStock() {
        AddToCartRequest request = AddToCartRequest.builder()
                .sku("PHONE-01")
                .quantity(50) // exceeds stock of 10
                .build();

        when(productClient.getProductBySku("PHONE-01"))
                .thenReturn(ResponseEntity.ok(ApiResponse.success(sampleProduct)));

        assertThrows(BadRequestException.class, () -> cartService.addItemToCart(1L, request));
        verify(cartRepository, never()).save(any());
    }

    @Test
    void shouldUpdateItemQuantity() {
        CartItem item = CartItem.builder()
                .sku("PHONE-01")
                .productName("Smart Phone")
                .unitPrice(new BigDecimal("500.00"))
                .quantity(1)
                .subtotal(new BigDecimal("500.00"))
                .build();
        sampleCart.getItems().add(item);
        sampleCart.recalculateTotals();

        UpdateCartItemRequest request = UpdateCartItemRequest.builder()
                .quantity(3)
                .build();

        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(sampleCart));
        when(productClient.getProductBySku("PHONE-01"))
                .thenReturn(ResponseEntity.ok(ApiResponse.success(sampleProduct)));
        when(cartRepository.save(any(Cart.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CartResponse response = cartService.updateItemQuantity(1L, "PHONE-01", request);

        assertNotNull(response);
        assertEquals(3, response.getTotalItemCount());
        assertEquals(new BigDecimal("1500.00"), response.getTotalPrice());
    }

    @Test
    void shouldRemoveItemFromCart() {
        CartItem item = CartItem.builder()
                .sku("PHONE-01")
                .productName("Smart Phone")
                .unitPrice(new BigDecimal("500.00"))
                .quantity(2)
                .subtotal(new BigDecimal("1000.00"))
                .build();
        sampleCart.getItems().add(item);
        sampleCart.recalculateTotals();

        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(sampleCart));
        when(cartRepository.save(any(Cart.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CartResponse response = cartService.removeItemFromCart(1L, "PHONE-01");

        assertNotNull(response);
        assertEquals(0, response.getTotalItemCount());
        assertEquals(BigDecimal.ZERO, response.getTotalPrice());
        assertTrue(response.getItems().isEmpty());
    }

    @Test
    void shouldClearCart() {
        cartService.clearCart(1L);
        verify(cartRepository, times(1)).deleteByUserId(1L);
    }
}
