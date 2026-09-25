export type OrderStatus =
  | 'CREATED'
  | 'INVENTORY_RESERVED'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'FAILED'
  | 'SHIPPED'
  | 'DELIVERED';

export interface OrderItemResponse {
  id: number;
  sku: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface OrderResponse {
  id: number;
  orderNumber: string;
  userId: number;
  userEmail?: string;
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: string;
  paymentMethod?: string;
  cancelReason?: string;
  items: OrderItemResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutRequest {
  shippingAddress: string;
  paymentMethod?: string;
}

export interface CancelOrderRequest {
  reason: string;
}
