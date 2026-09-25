import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PaymentService } from './payment.service';
import { environment } from '../../../environments/environment';
import { ApiResponse, PageResponse } from '../models/api.models';
import { PaymentResponse } from '../models/payment.models';

describe('PaymentService', () => {
  let service: PaymentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PaymentService]
    });
    service = TestBed.inject(PaymentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch user payment transactions', () => {
    const mockPayments: PageResponse<PaymentResponse> = {
      content: [
        {
          id: 1,
          orderNumber: 'ORD-123',
          transactionId: 'TXN-999',
          userId: 1,
          amount: 249.99,
          currency: 'USD',
          paymentMethod: 'CARD',
          status: 'SUCCESS',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      pageNumber: 0,
      pageSize: 10,
      totalElements: 1,
      totalPages: 1,
      isFirst: true,
      isLast: true
    };

    service.getMyPayments(0, 10).subscribe((page) => {
      expect(page.content.length).toBe(1);
      expect(page.content[0].transactionId).toBe('TXN-999');
      expect(page.content[0].status).toBe('SUCCESS');
    });

    const req = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/api/v1/payments` && r.params.get('page') === '0');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: mockPayments, timestamp: '' });
  });

  it('should fetch payment details by order number', () => {
    const mockPayment: PaymentResponse = {
      id: 1,
      orderNumber: 'ORD-123',
      transactionId: 'TXN-999',
      userId: 1,
      amount: 249.99,
      currency: 'USD',
      paymentMethod: 'CARD',
      status: 'SUCCESS',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    service.getPaymentByOrderNumber('ORD-123').subscribe((pay) => {
      expect(pay.orderNumber).toBe('ORD-123');
      expect(pay.status).toBe('SUCCESS');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/payments/order/ORD-123`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: mockPayment, timestamp: '' });
  });

  it('should process payment refund for eligible order', () => {
    const mockRefundedPayment: PaymentResponse = {
      id: 1,
      orderNumber: 'ORD-123',
      transactionId: 'TXN-999',
      userId: 1,
      amount: 249.99,
      currency: 'USD',
      paymentMethod: 'CARD',
      status: 'REFUNDED',
      failureReason: 'Refunded: Customer requested return',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    service.refundPayment('ORD-123', 'Customer requested return').subscribe((pay) => {
      expect(pay.status).toBe('REFUNDED');
      expect(pay.failureReason).toContain('Customer requested return');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/payments/order/ORD-123/refund`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ reason: 'Customer requested return' });
    req.flush({ success: true, data: mockRefundedPayment, timestamp: '' });
  });
});
