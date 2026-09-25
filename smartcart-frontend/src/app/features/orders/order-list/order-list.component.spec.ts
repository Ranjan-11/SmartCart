import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { OrderListComponent } from './order-list.component';
import { OrderService } from '../../../core/services/order.service';
import { PageResponse } from '../../../core/models/api.models';
import { OrderResponse } from '../../../core/models/order.models';

describe('OrderListComponent', () => {
  let component: OrderListComponent;
  let fixture: ComponentFixture<OrderListComponent>;
  let orderServiceSpy: jasmine.SpyObj<OrderService>;

  const mockOrderPage: PageResponse<OrderResponse> = {
    content: [
      {
        id: 1,
        orderNumber: 'ORD-101',
        userId: 1,
        userEmail: 'customer@smartcart.com',
        totalAmount: 199.99,
        status: 'CONFIRMED',
        shippingAddress: '123 Main St',
        paymentMethod: 'CREDIT_CARD',
        items: [
          {
            id: 1,
            sku: 'SKU-KB',
            productName: 'Mechanical Keyboard',
            unitPrice: 199.99,
            quantity: 1,
            subtotal: 199.99
          }
        ],
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

  beforeEach(async () => {
    orderServiceSpy = jasmine.createSpyObj('OrderService', ['getMyOrders', 'cancelOrder']);
    orderServiceSpy.getMyOrders.and.returnValue(of(mockOrderPage));

    await TestBed.configureTestingModule({
      imports: [OrderListComponent, RouterTestingModule],
      providers: [
        { provide: OrderService, useValue: orderServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrderListComponent);
    component = fixture.componentInstance;
  });

  it('should load customer orders on initialization', () => {
    fixture.detectChanges();

    expect(component.orders().length).toBe(1);
    expect(component.orders()[0].orderNumber).toBe('ORD-101');
    expect(component.loading()).toBeFalse();
    expect(orderServiceSpy.getMyOrders).toHaveBeenCalledWith(0, 10);
  });

  it('should allow cancellation modal for CONFIRMED order and submit cancellation', () => {
    fixture.detectChanges();

    const order = component.orders()[0];
    expect(component.canCancel(order.status)).toBeTrue();

    component.openCancelModal(order);
    expect(component.selectedOrderForCancel()?.orderNumber).toBe('ORD-101');

    component.cancelReasonText = 'Found a better price';
    orderServiceSpy.cancelOrder.and.returnValue(of({ ...order, status: 'CANCELLED', cancelReason: 'Found a better price' }));

    component.confirmCancelOrder();

    expect(orderServiceSpy.cancelOrder).toHaveBeenCalledWith('ORD-101', 'Found a better price');
    expect(component.selectedOrderForCancel()).toBeNull();
  });
});
