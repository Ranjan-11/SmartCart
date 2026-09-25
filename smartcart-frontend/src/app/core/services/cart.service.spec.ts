import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CartService } from './cart.service';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';
import { CartResponse } from '../models/cart.models';
import { ApiResponse } from '../models/api.models';

describe('CartService', () => {
  let service: CartService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'currentUser']);
    authServiceSpy.isAuthenticated.and.returnValue(true);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        CartService,
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    service = TestBed.inject(CartService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should add an item to cart and update reactive signals', () => {
    const mockCart: CartResponse = {
      userId: 1,
      items: [
        {
          sku: 'SKU-001',
          productName: 'Mechanical Keyboard',
          unitPrice: 99.99,
          quantity: 2,
          subtotal: 199.98
        }
      ],
      totalItemCount: 2,
      totalPrice: 199.98,
      updatedAt: new Date().toISOString()
    };

    const mockResponse: ApiResponse<CartResponse> = {
      success: true,
      data: mockCart,
      timestamp: new Date().toISOString()
    };

    service.addItem('SKU-001', 2).subscribe((cart) => {
      expect(cart.totalItemCount).toBe(2);
      expect(cart.totalPrice).toBe(199.98);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/cart/items`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ sku: 'SKU-001', quantity: 2 });
    req.flush(mockResponse);

    expect(service.itemCount()).toBe(2);
    expect(service.totalPrice()).toBe(199.98);
  });

  it('should update item quantity and calculate authoritative totals', () => {
    const updatedCart: CartResponse = {
      userId: 1,
      items: [
        {
          sku: 'SKU-001',
          productName: 'Mechanical Keyboard',
          unitPrice: 99.99,
          quantity: 3,
          subtotal: 299.97
        }
      ],
      totalItemCount: 3,
      totalPrice: 299.97,
      updatedAt: new Date().toISOString()
    };

    service.updateQuantity('SKU-001', 3).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/cart/items/SKU-001`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ quantity: 3 });
    req.flush({ success: true, data: updatedCart, timestamp: '' });

    expect(service.itemCount()).toBe(3);
    expect(service.totalPrice()).toBe(299.97);
  });
});
