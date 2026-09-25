import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PageResponse } from '../models/api.models';
import { CategoryRequest, CategoryResponse, ProductFilterParams, ProductRequest, ProductResponse } from '../models/product.models';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/products`;
  private readonly categoryUrl = `${environment.apiUrl}/api/v1/categories`;

  getAllProducts(params?: ProductFilterParams): Observable<PageResponse<ProductResponse>> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.keyword) httpParams = httpParams.set('keyword', params.keyword);
      if (params.category) httpParams = httpParams.set('category', params.category);
      if (params.minPrice != null) httpParams = httpParams.set('minPrice', params.minPrice.toString());
      if (params.maxPrice != null) httpParams = httpParams.set('maxPrice', params.maxPrice.toString());
      if (params.active != null) httpParams = httpParams.set('active', params.active.toString());
      if (params.page != null) httpParams = httpParams.set('page', params.page.toString());
      if (params.size != null) httpParams = httpParams.set('size', params.size.toString());
      if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
      if (params.sortDir) httpParams = httpParams.set('sortDir', params.sortDir);
    }

    return this.http.get<ApiResponse<PageResponse<ProductResponse>>>(this.baseUrl, { params: httpParams }).pipe(
      map(res => res.data)
    );
  }

  getProductById(id: number): Observable<ProductResponse> {
    return this.http.get<ApiResponse<ProductResponse>>(`${this.baseUrl}/${id}`).pipe(
      map(res => res.data)
    );
  }

  getProductBySku(sku: string): Observable<ProductResponse> {
    return this.http.get<ApiResponse<ProductResponse>>(`${this.baseUrl}/sku/${sku}`).pipe(
      map(res => res.data)
    );
  }

  createProduct(request: ProductRequest): Observable<ProductResponse> {
    return this.http.post<ApiResponse<ProductResponse>>(this.baseUrl, request).pipe(
      map(res => res.data)
    );
  }

  updateProduct(id: number, request: ProductRequest): Observable<ProductResponse> {
    return this.http.put<ApiResponse<ProductResponse>>(`${this.baseUrl}/${id}`, request).pipe(
      map(res => res.data)
    );
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`).pipe(
      map(() => {})
    );
  }

  getAllCategories(): Observable<CategoryResponse[]> {
    return this.http.get<ApiResponse<CategoryResponse[]>>(this.categoryUrl).pipe(
      map(res => res.data)
    );
  }

  getCategoryBySlug(slug: string): Observable<CategoryResponse> {
    return this.http.get<ApiResponse<CategoryResponse>>(`${this.categoryUrl}/slug/${slug}`).pipe(
      map(res => res.data)
    );
  }

  createCategory(request: CategoryRequest): Observable<CategoryResponse> {
    return this.http.post<ApiResponse<CategoryResponse>>(this.categoryUrl, request).pipe(
      map(res => res.data)
    );
  }

  updateCategory(id: number, request: CategoryRequest): Observable<CategoryResponse> {
    return this.http.put<ApiResponse<CategoryResponse>>(`${this.categoryUrl}/${id}`, request).pipe(
      map(res => res.data)
    );
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.categoryUrl}/${id}`).pipe(
      map(() => {})
    );
  }
}
