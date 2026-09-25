import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OrderService } from './order.service';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import { CheckoutRequest, OrderResponse } from '../models/order.models';

describe('OrderService', () => {
  let service: OrderService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OrderService]
    });
    service = TestBed.inject(OrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should checkout order from shopping cart', () => {
    const checkoutReq: CheckoutRequest = {
      shippingAddress: '123 Main St, Springfield, IL 62701, USA',
      paymentMethod: 'CREDIT_CARD'
    };

    const mockOrder: OrderResponse = {
      id: 1,
      orderNumber: 'ORD-12345678-ABC',
      userId: 1,
      userEmail: 'customer@smartcart.com',
      totalAmount: 199.99,
      status: 'CREATED',
      shippingAddress: '123 Main St, Springfield, IL 62701, USA',
      paymentMethod: 'CREDIT_CARD',
      items: [
        {
          id: 1,
          sku: 'SKU-001',
          productName: 'Mechanical Keyboard',
          unitPrice: 199.99,
          quantity: 1,
          subtotal: 199.99
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const mockResponse: ApiResponse<OrderResponse> = {
      success: true,
      data: mockOrder,
      timestamp: new Date().toISOString()
    };

    service.checkout(checkoutReq).subscribe((order) => {
      expect(order.orderNumber).toBe('ORD-12345678-ABC');
      expect(order.status).toBe('CREATED');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/orders/checkout`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(checkoutReq);
    req.flush(mockResponse);
  });

  it('should fetch order details by orderNumber', () => {
    const mockOrder: OrderResponse = {
      id: 1,
      orderNumber: 'ORD-12345678-ABC',
      userId: 1,
      userEmail: 'customer@smartcart.com',
      totalAmount: 199.99,
      status: 'CONFIRMED',
      shippingAddress: '123 Main St',
      paymentMethod: 'CREDIT_CARD',
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    service.getOrderByNumber('ORD-12345678-ABC').subscribe((order) => {
      expect(order.status).toBe('CONFIRMED');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/orders/ORD-12345678-ABC`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: mockOrder, timestamp: '' });
  });

  it('should cancel an order with given reason', () => {
    const mockCancelledOrder: OrderResponse = {
      id: 1,
      orderNumber: 'ORD-12345678-ABC',
      userId: 1,
      userEmail: 'customer@smartcart.com',
      totalAmount: 199.99,
      status: 'CANCELLED',
      shippingAddress: '123 Main St',
      cancelReason: 'Changed mind',
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    service.cancelOrder('ORD-12345678-ABC', 'Changed mind').subscribe((order) => {
      expect(order.status).toBe('CANCELLED');
      expect(order.cancelReason).toBe('Changed mind');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/orders/ORD-12345678-ABC/cancel`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ reason: 'Changed mind' });
    req.flush({ success: true, data: mockCancelledOrder, timestamp: '' });
  });
});
