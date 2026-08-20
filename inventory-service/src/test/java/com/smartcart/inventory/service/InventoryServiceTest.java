package com.smartcart.inventory.service;

import com.smartcart.common.dto.OrderItemDto;
import com.smartcart.common.event.*;
import com.smartcart.common.exception.ConflictException;
import com.smartcart.common.exception.ResourceNotFoundException;
import com.smartcart.inventory.dto.*;
import com.smartcart.inventory.entity.Inventory;
import com.smartcart.inventory.entity.InventoryReservation;
import com.smartcart.inventory.entity.ReservationStatus;
import com.smartcart.inventory.kafka.InventoryKafkaProducer;
import com.smartcart.inventory.repository.InventoryRepository;
import com.smartcart.inventory.repository.InventoryReservationRepository;
import com.smartcart.inventory.service.impl.InventoryServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private InventoryReservationRepository reservationRepository;

    @Mock
    private InventoryKafkaProducer kafkaProducer;

    @InjectMocks
    private InventoryServiceImpl inventoryService;

    private Inventory inventory;

    @BeforeEach
    void setUp() {
        inventory = Inventory.builder()
                .id(1L)
                .sku("TEST-SKU-1")
                .availableQuantity(10)
                .reservedQuantity(0)
                .lowStockThreshold(5)
                .build();
    }

    @Test
    void testAddInventory_Success() {
        InventoryRequest request = InventoryRequest.builder()
                .sku("NEW-SKU")
                .availableQuantity(20)
                .lowStockThreshold(5)
                .build();

        when(inventoryRepository.existsBySku("NEW-SKU")).thenReturn(false);
        when(inventoryRepository.save(any(Inventory.class))).thenAnswer(i -> i.getArgument(0));

        InventoryResponse response = inventoryService.addInventory(request);

        assertThat(response.getSku()).isEqualTo("NEW-SKU");
        assertThat(response.getAvailableQuantity()).isEqualTo(20);
        verify(inventoryRepository).save(any(Inventory.class));
    }

    @Test
    void testAddInventory_Conflict() {
        InventoryRequest request = InventoryRequest.builder()
                .sku("TEST-SKU-1")
                .availableQuantity(10)
                .build();

        when(inventoryRepository.existsBySku("TEST-SKU-1")).thenReturn(true);

        assertThatThrownBy(() -> inventoryService.addInventory(request))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void testRestock_Success() {
        RestockRequest request = RestockRequest.builder().quantity(15).build();

        when(inventoryRepository.findBySku("TEST-SKU-1")).thenReturn(Optional.of(inventory));
        when(inventoryRepository.save(any(Inventory.class))).thenReturn(inventory);

        InventoryResponse response = inventoryService.restock("TEST-SKU-1", request);

        assertThat(response.getAvailableQuantity()).isEqualTo(25);
        verify(inventoryRepository).save(inventory);
    }

    @Test
    void testGetInventoryBySku_Success() {
        when(inventoryRepository.findBySku("TEST-SKU-1")).thenReturn(Optional.of(inventory));

        InventoryResponse response = inventoryService.getInventoryBySku("TEST-SKU-1");

        assertThat(response.getSku()).isEqualTo("TEST-SKU-1");
        assertThat(response.getAvailableQuantity()).isEqualTo(10);
    }

    @Test
    void testProcessOrderCreated_SufficientStock_ReservesSuccessfully() {
        OrderItemDto item = OrderItemDto.builder()
                .sku("TEST-SKU-1")
                .productName("Test Product")
                .price(new BigDecimal("100.00"))
                .quantity(2)
                .build();

        OrderCreatedEvent event = OrderCreatedEvent.builder()
                .orderNumber("ORD-1001")
                .userId(1L)
                .userEmail("test@test.com")
                .totalAmount(new BigDecimal("200.00"))
                .items(List.of(item))
                .build();

        when(reservationRepository.findByOrderNumber("ORD-1001")).thenReturn(Collections.emptyList());
        when(inventoryRepository.findBySku("TEST-SKU-1")).thenReturn(Optional.of(inventory));

        inventoryService.processOrderCreated(event);

        assertThat(inventory.getAvailableQuantity()).isEqualTo(8);
        assertThat(inventory.getReservedQuantity()).isEqualTo(2);
        verify(inventoryRepository).save(inventory);
        verify(reservationRepository).save(any(InventoryReservation.class));
        verify(kafkaProducer).publishInventoryReserved(any(InventoryReservedEvent.class));
    }

    @Test
    void testProcessOrderCreated_InsufficientStock_PublishesFailed() {
        OrderItemDto item = OrderItemDto.builder()
                .sku("TEST-SKU-1")
                .productName("Test Product")
                .price(new BigDecimal("100.00"))
                .quantity(50)
                .build();

        OrderCreatedEvent event = OrderCreatedEvent.builder()
                .orderNumber("ORD-1002")
                .userId(1L)
                .items(List.of(item))
                .build();

        when(reservationRepository.findByOrderNumber("ORD-1002")).thenReturn(Collections.emptyList());
        when(inventoryRepository.findBySku("TEST-SKU-1")).thenReturn(Optional.of(inventory));

        inventoryService.processOrderCreated(event);

        verify(kafkaProducer).publishInventoryFailed(any(InventoryFailedEvent.class));
        verify(kafkaProducer, never()).publishInventoryReserved(any());
    }

    @Test
    void testProcessPaymentFailed_CompensatingTransaction_ReleasesReservation() {
        InventoryReservation reservation = InventoryReservation.builder()
                .orderNumber("ORD-1003")
                .sku("TEST-SKU-1")
                .quantity(3)
                .status(ReservationStatus.RESERVED)
                .build();

        inventory.setAvailableQuantity(7);
        inventory.setReservedQuantity(3);

        when(reservationRepository.findByOrderNumberAndStatus("ORD-1003", ReservationStatus.RESERVED))
                .thenReturn(List.of(reservation));
        when(inventoryRepository.findBySku("TEST-SKU-1")).thenReturn(Optional.of(inventory));

        inventoryService.processPaymentFailed(PaymentFailedEvent.builder()
                .orderNumber("ORD-1003")
                .reason("Card Declined")
                .build());

        assertThat(inventory.getAvailableQuantity()).isEqualTo(10);
        assertThat(inventory.getReservedQuantity()).isEqualTo(0);
        assertThat(reservation.getStatus()).isEqualTo(ReservationStatus.RELEASED);
        verify(inventoryRepository).save(inventory);
        verify(reservationRepository).save(reservation);
    }
}
