import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PageResponse } from '../models/api.models';
import { PaymentResponse, RefundRequest } from '../models/payment.models';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/payments`;

  getMyPayments(page: number = 0, size: number = 10): Observable<PageResponse<PaymentResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<PageResponse<PaymentResponse>>>(this.baseUrl, { params }).pipe(
      map(res => res.data)
    );
  }

  getAllPaymentsAdmin(page: number = 0, size: number = 10): Observable<PageResponse<PaymentResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<PageResponse<PaymentResponse>>>(`${this.baseUrl}/admin/all`, { params }).pipe(
      map(res => res.data)
    );
  }

  getPaymentByOrderNumber(orderNumber: string): Observable<PaymentResponse> {
    return this.http.get<ApiResponse<PaymentResponse>>(`${this.baseUrl}/order/${orderNumber}`).pipe(
      map(res => res.data)
    );
  }

  getPaymentByTransactionId(transactionId: string): Observable<PaymentResponse> {
    return this.http.get<ApiResponse<PaymentResponse>>(`${this.baseUrl}/transaction/${transactionId}`).pipe(
      map(res => res.data)
    );
  }

  refundPayment(orderNumber: string, reason: string): Observable<PaymentResponse> {
    const payload: RefundRequest = { reason };
    return this.http.post<ApiResponse<PaymentResponse>>(`${this.baseUrl}/order/${orderNumber}/refund`, payload).pipe(
      map(res => res.data)
    );
  }
}
