export interface CategoryResponse {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  createdAt: string;
}

export interface CategoryRequest {
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
}

export interface ProductResponse {
  id: number;
  sku: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  imageUrl?: string;
  active: boolean;
  createdAt: string;
}

export interface ProductRequest {
  sku: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  categoryId: number;
  imageUrl?: string;
  active?: boolean;
}

export interface ProductFilterParams {
  keyword?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  active?: boolean;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}
