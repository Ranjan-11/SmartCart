import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { OrderConfirmationComponent } from './order-confirmation.component';
import { OrderService } from '../../../core/services/order.service';
import { OrderResponse } from '../../../core/models/order.models';

describe('OrderConfirmationComponent', () => {
  let component: OrderConfirmationComponent;
  let fixture: ComponentFixture<OrderConfirmationComponent>;
  let orderServiceSpy: jasmine.SpyObj<OrderService>;

  const initialOrder: OrderResponse = {
    id: 1,
    orderNumber: 'ORD-TEST-123',
    userId: 1,
    userEmail: 'user@smartcart.com',
    totalAmount: 150.00,
    status: 'CREATED',
    shippingAddress: '123 Main St',
    paymentMethod: 'CREDIT_CARD',
    items: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  beforeEach(async () => {
    orderServiceSpy = jasmine.createSpyObj('OrderService', ['getOrderByNumber']);
    orderServiceSpy.getOrderByNumber.and.returnValue(of(initialOrder));

    await TestBed.configureTestingModule({
      imports: [OrderConfirmationComponent, RouterTestingModule],
      providers: [
        { provide: OrderService, useValue: orderServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'orderNumber' ? 'ORD-TEST-123' : null)
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrderConfirmationComponent);
    component = fixture.componentInstance;
  });

  it('should initialize and start polling order status', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    expect(component.order()?.orderNumber).toBe('ORD-TEST-123');
    expect(component.order()?.status).toBe('CREATED');
    expect(orderServiceSpy.getOrderByNumber).toHaveBeenCalledWith('ORD-TEST-123');

    // Clean up timer on destroy
    fixture.destroy();
  }));

  it('should update status when order transitions to CONFIRMED and stop polling', fakeAsync(() => {
    const confirmedOrder: OrderResponse = { ...initialOrder, status: 'CONFIRMED' };
    orderServiceSpy.getOrderByNumber.and.returnValue(of(confirmedOrder));

    fixture.detectChanges();
    tick(1500);

    expect(component.order()?.status).toBe('CONFIRMED');
    expect(component.timedOut()).toBeFalse();

    fixture.destroy();
  }));

  it('should handle CANCELLED / FAILED status', fakeAsync(() => {
    const failedOrder: OrderResponse = {
      ...initialOrder,
      status: 'FAILED',
      cancelReason: 'Insufficient stock for SKU: SKU-001'
    };
    orderServiceSpy.getOrderByNumber.and.returnValue(of(failedOrder));

    fixture.detectChanges();
    tick(1500);

    expect(component.order()?.status).toBe('FAILED');
    expect(component.order()?.cancelReason).toBe('Insufficient stock for SKU: SKU-001');

    fixture.destroy();
  }));
});
