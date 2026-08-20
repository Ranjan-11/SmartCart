package com.smartcart.order.entity;

public enum OrderStatus {
    CREATED,
    INVENTORY_RESERVED,
    CONFIRMED,
    CANCELLED,
    FAILED,
    SHIPPED,
    DELIVERED
}
