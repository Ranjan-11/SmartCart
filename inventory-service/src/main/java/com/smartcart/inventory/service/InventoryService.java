package com.smartcart.inventory.service;

import com.smartcart.common.dto.PageResponse;
import com.smartcart.common.event.OrderCancelledEvent;
import com.smartcart.common.event.OrderCreatedEvent;
import com.smartcart.common.event.PaymentFailedEvent;
import com.smartcart.common.event.PaymentSuccessEvent;
import com.smartcart.inventory.dto.*;

import java.util.List;

public interface InventoryService {

    InventoryResponse addInventory(InventoryRequest request);

    InventoryResponse restock(String sku, RestockRequest request);

    InventoryResponse getInventoryBySku(String sku);

    List<StockCheckResponse> batchCheckStock(List<String> skus);

    PageResponse<InventoryResponse> getAllInventory(int page, int size);

    PageResponse<InventoryResponse> getLowStockInventory(int page, int size);

    void processOrderCreated(OrderCreatedEvent event);

    void processPaymentSuccess(PaymentSuccessEvent event);

    void processPaymentFailed(PaymentFailedEvent event);

    void processOrderCancelled(OrderCancelledEvent event);
}
