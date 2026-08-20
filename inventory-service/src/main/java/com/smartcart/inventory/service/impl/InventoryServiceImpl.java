package com.smartcart.inventory.service.impl;

import com.smartcart.common.dto.OrderItemDto;
import com.smartcart.common.dto.PageResponse;
import com.smartcart.common.event.*;
import com.smartcart.common.exception.BadRequestException;
import com.smartcart.common.exception.ConflictException;
import com.smartcart.common.exception.ResourceNotFoundException;
import com.smartcart.inventory.dto.*;
import com.smartcart.inventory.entity.Inventory;
import com.smartcart.inventory.entity.InventoryReservation;
import com.smartcart.inventory.entity.ReservationStatus;
import com.smartcart.inventory.kafka.InventoryKafkaProducer;
import com.smartcart.inventory.repository.InventoryRepository;
import com.smartcart.inventory.repository.InventoryReservationRepository;
import com.smartcart.inventory.service.InventoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryServiceImpl implements InventoryService {

    private final InventoryRepository inventoryRepository;
    private final InventoryReservationRepository reservationRepository;
    private final InventoryKafkaProducer kafkaProducer;

    @Override
    @Transactional
    public InventoryResponse addInventory(InventoryRequest request) {
        log.info("Adding inventory entry for SKU: {} with available quantity: {}", request.getSku(), request.getAvailableQuantity());
        if (inventoryRepository.existsBySku(request.getSku())) {
            throw new ConflictException("Inventory already exists for SKU: " + request.getSku());
        }

        Inventory inventory = Inventory.builder()
                .sku(request.getSku())
                .availableQuantity(request.getAvailableQuantity())
                .reservedQuantity(0)
                .lowStockThreshold(request.getLowStockThreshold() != null ? request.getLowStockThreshold() : 5)
                .build();

        Inventory saved = inventoryRepository.save(inventory);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public InventoryResponse restock(String sku, RestockRequest request) {
        log.info("Restocking SKU: {} with additional quantity: {}", sku, request.getQuantity());
        Inventory inventory = inventoryRepository.findBySku(sku)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found for SKU: " + sku));

        inventory.setAvailableQuantity(inventory.getAvailableQuantity() + request.getQuantity());
        Inventory updated = inventoryRepository.save(inventory);
        return mapToResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public InventoryResponse getInventoryBySku(String sku) {
        log.debug("Fetching inventory for SKU: {}", sku);
        Inventory inventory = inventoryRepository.findBySku(sku)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found for SKU: " + sku));
        return mapToResponse(inventory);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StockCheckResponse> batchCheckStock(List<String> skus) {
        log.debug("Batch stock checking for SKUs: {}", skus);
        List<Inventory> inventories = inventoryRepository.findBySkuIn(skus);
        Map<String, Inventory> inventoryMap = inventories.stream()
                .collect(Collectors.toMap(Inventory::getSku, i -> i));

        return skus.stream().map(sku -> {
            Inventory inv = inventoryMap.get(sku);
            int available = inv != null ? inv.getAvailableQuantity() : 0;
            return StockCheckResponse.builder()
                    .sku(sku)
                    .availableQuantity(available)
                    .inStock(available > 0)
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<InventoryResponse> getAllInventory(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Inventory> inventoryPage = inventoryRepository.findAll(pageable);
        return mapToPageResponse(inventoryPage);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<InventoryResponse> getLowStockInventory(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "availableQuantity"));
        Page<Inventory> inventoryPage = inventoryRepository.findLowStock(pageable);
        return mapToPageResponse(inventoryPage);
    }

    @Override
    @Transactional
    public void processOrderCreated(OrderCreatedEvent event) {
        log.info("Processing OrderCreatedEvent for order: {}, User: {}", event.getOrderNumber(), event.getUserId());
        List<OrderItemDto> items = event.getItems();
        if (items == null || items.isEmpty()) {
            log.warn("Order {} has no items to reserve", event.getOrderNumber());
            kafkaProducer.publishInventoryFailed(InventoryFailedEvent.builder()
                    .orderNumber(event.getOrderNumber())
                    .userId(event.getUserId())
                    .reason("Order has no items")
                    .build());
            return;
        }

        // Idempotency check: verify if reservations already exist for this orderNumber
        List<InventoryReservation> existingReservations = reservationRepository.findByOrderNumber(event.getOrderNumber());
        if (!existingReservations.isEmpty()) {
            log.info("Reservations already exist for order: {}. Skipping duplicate reservation.", event.getOrderNumber());
            return;
        }

        // Check stock availability for all items first
        List<Inventory> inventoriesToUpdate = new ArrayList<>();
        for (OrderItemDto item : items) {
            Inventory inventory = inventoryRepository.findBySku(item.getSku()).orElse(null);
            if (inventory == null) {
                log.warn("SKU: {} not found in inventory for order: {}", item.getSku(), event.getOrderNumber());
                kafkaProducer.publishInventoryFailed(InventoryFailedEvent.builder()
                        .orderNumber(event.getOrderNumber())
                        .userId(event.getUserId())
                        .reason("Product SKU not found in inventory: " + item.getSku())
                        .build());
                return;
            }

            if (inventory.getAvailableQuantity() < item.getQuantity()) {
                log.warn("Insufficient stock for SKU: {}. Requested: {}, Available: {} for order: {}",
                        item.getSku(), item.getQuantity(), inventory.getAvailableQuantity(), event.getOrderNumber());
                kafkaProducer.publishInventoryFailed(InventoryFailedEvent.builder()
                        .orderNumber(event.getOrderNumber())
                        .userId(event.getUserId())
                        .reason("Insufficient stock for product: " + item.getProductName() + " (Available: " + inventory.getAvailableQuantity() + ")")
                        .build());
                return;
            }
            inventoriesToUpdate.add(inventory);
        }

        // Reserve stock for all items
        for (int i = 0; i < items.size(); i++) {
            OrderItemDto item = items.get(i);
            Inventory inventory = inventoriesToUpdate.get(i);

            inventory.setAvailableQuantity(inventory.getAvailableQuantity() - item.getQuantity());
            inventory.setReservedQuantity(inventory.getReservedQuantity() + item.getQuantity());
            inventoryRepository.save(inventory);

            InventoryReservation reservation = InventoryReservation.builder()
                    .orderNumber(event.getOrderNumber())
                    .sku(item.getSku())
                    .quantity(item.getQuantity())
                    .status(ReservationStatus.RESERVED)
                    .build();
            reservationRepository.save(reservation);
        }

        log.info("Successfully reserved inventory for order: {}", event.getOrderNumber());
        kafkaProducer.publishInventoryReserved(InventoryReservedEvent.builder()
                .orderNumber(event.getOrderNumber())
                .userId(event.getUserId())
                .userEmail(event.getUserEmail())
                .totalAmount(event.getTotalAmount())
                .items(event.getItems())
                .build());
    }

    @Override
    @Transactional
    public void processPaymentSuccess(PaymentSuccessEvent event) {
        log.info("Processing PaymentSuccessEvent for order: {}", event.getOrderNumber());
        List<InventoryReservation> reservations = reservationRepository.findByOrderNumberAndStatus(
                event.getOrderNumber(), ReservationStatus.RESERVED);

        for (InventoryReservation reservation : reservations) {
            Inventory inventory = inventoryRepository.findBySku(reservation.getSku()).orElse(null);
            if (inventory != null) {
                inventory.setReservedQuantity(Math.max(0, inventory.getReservedQuantity() - reservation.getQuantity()));
                inventoryRepository.save(inventory);
            }
            reservation.setStatus(ReservationStatus.COMMITTED);
            reservationRepository.save(reservation);
        }
        log.info("Committed reservations for order: {}", event.getOrderNumber());
    }

    @Override
    @Transactional
    public void processPaymentFailed(PaymentFailedEvent event) {
        log.info("Processing PaymentFailedEvent (Compensating Transaction) for order: {}", event.getOrderNumber());
        releaseReservations(event.getOrderNumber(), "Payment Failed: " + event.getReason());
    }

    @Override
    @Transactional
    public void processOrderCancelled(OrderCancelledEvent event) {
        log.info("Processing OrderCancelledEvent for order: {}", event.getOrderNumber());
        releaseReservations(event.getOrderNumber(), "Order Cancelled: " + event.getReason());
    }

    private void releaseReservations(String orderNumber, String reason) {
        List<InventoryReservation> reservations = reservationRepository.findByOrderNumberAndStatus(
                orderNumber, ReservationStatus.RESERVED);

        if (reservations.isEmpty()) {
            log.debug("No RESERVED items found to release for order: {}", orderNumber);
            return;
        }

        for (InventoryReservation reservation : reservations) {
            Inventory inventory = inventoryRepository.findBySku(reservation.getSku()).orElse(null);
            if (inventory != null) {
                inventory.setAvailableQuantity(inventory.getAvailableQuantity() + reservation.getQuantity());
                inventory.setReservedQuantity(Math.max(0, inventory.getReservedQuantity() - reservation.getQuantity()));
                inventoryRepository.save(inventory);
            }
            reservation.setStatus(ReservationStatus.RELEASED);
            reservationRepository.save(reservation);
        }
        log.info("Released reservations for order: {} (Reason: {})", orderNumber, reason);
    }

    private InventoryResponse mapToResponse(Inventory inventory) {
        return InventoryResponse.builder()
                .id(inventory.getId())
                .sku(inventory.getSku())
                .availableQuantity(inventory.getAvailableQuantity())
                .reservedQuantity(inventory.getReservedQuantity())
                .lowStockThreshold(inventory.getLowStockThreshold())
                .lowStock(inventory.isLowStock())
                .createdAt(inventory.getCreatedAt())
                .updatedAt(inventory.getUpdatedAt())
                .build();
    }

    private PageResponse<InventoryResponse> mapToPageResponse(Page<Inventory> page) {
        List<InventoryResponse> content = page.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PageResponse.<InventoryResponse>builder()
                .content(content)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .isFirst(page.isFirst())
                .isLast(page.isLast())
                .build();
    }
}
