export interface InventoryResponse {
  id: number;
  sku: string;
  availableQuantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  lowStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockCheckResponse {
  sku: string;
  availableQuantity: number;
  inStock: boolean;
}

export interface BatchStockCheckRequest {
  skus: string[];
}

export interface InventoryRequest {
  sku: string;
  availableQuantity: number;
  lowStockThreshold?: number;
}

export interface RestockRequest {
  quantity: number;
}
