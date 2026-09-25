import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PageResponse } from '../models/api.models';
import { InventoryRequest, InventoryResponse, RestockRequest } from '../models/inventory.models';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/inventory`;

  getInventoryBySku(sku: string): Observable<InventoryResponse> {
    return this.http.get<ApiResponse<InventoryResponse>>(`${this.baseUrl}/${sku}`).pipe(
      map(res => res.data)
    );
  }

  getAllInventory(page: number = 0, size: number = 10): Observable<PageResponse<InventoryResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<PageResponse<InventoryResponse>>>(this.baseUrl, { params }).pipe(
      map(res => res.data)
    );
  }

  getLowStockInventory(page: number = 0, size: number = 10): Observable<PageResponse<InventoryResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<PageResponse<InventoryResponse>>>(`${this.baseUrl}/low-stock`, { params }).pipe(
      map(res => res.data)
    );
  }

  addInventory(request: InventoryRequest): Observable<InventoryResponse> {
    return this.http.post<ApiResponse<InventoryResponse>>(this.baseUrl, request).pipe(
      map(res => res.data)
    );
  }

  restock(sku: string, quantity: number): Observable<InventoryResponse> {
    const payload: RestockRequest = { quantity };
    return this.http.put<ApiResponse<InventoryResponse>>(`${this.baseUrl}/${sku}/restock`, payload).pipe(
      map(res => res.data)
    );
  }
}
