export interface CartItemResponse {
  sku: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  imageUrl?: string;
}

export interface CartResponse {
  userId: number;
  items: CartItemResponse[];
  totalItemCount: number;
  totalPrice: number;
  updatedAt: string;
}

export interface AddToCartRequest {
  sku: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}
