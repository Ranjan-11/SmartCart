import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PageResponse } from '../models/api.models';
import { CancelOrderRequest, CheckoutRequest, OrderResponse } from '../models/order.models';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/orders`;

  checkout(request: CheckoutRequest): Observable<OrderResponse> {
    return this.http.post<ApiResponse<OrderResponse>>(`${this.baseUrl}/checkout`, request).pipe(
      map(res => res.data)
    );
  }

  getOrderByNumber(orderNumber: string): Observable<OrderResponse> {
    return this.http.get<ApiResponse<OrderResponse>>(`${this.baseUrl}/${orderNumber}`).pipe(
      map(res => res.data)
    );
  }

  getMyOrders(page: number = 0, size: number = 10): Observable<PageResponse<OrderResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<PageResponse<OrderResponse>>>(this.baseUrl, { params }).pipe(
      map(res => res.data)
    );
  }

  getAllOrdersAdmin(page: number = 0, size: number = 10): Observable<PageResponse<OrderResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<PageResponse<OrderResponse>>>(`${this.baseUrl}/admin/all`, { params }).pipe(
      map(res => res.data)
    );
  }

  cancelOrder(orderNumber: string, reason: string): Observable<OrderResponse> {
    const payload: CancelOrderRequest = { reason };
    return this.http.put<ApiResponse<OrderResponse>>(`${this.baseUrl}/${orderNumber}/cancel`, payload).pipe(
      map(res => res.data)
    );
  }
}
