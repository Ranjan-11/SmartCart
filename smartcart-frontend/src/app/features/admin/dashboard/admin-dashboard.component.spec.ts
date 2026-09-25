import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { ProductService } from '../../../core/services/product.service';
import { InventoryService } from '../../../core/services/inventory.service';
import { OrderService } from '../../../core/services/order.service';
import { PaymentService } from '../../../core/services/payment.service';
import { PageResponse } from '../../../core/models/api.models';

describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;
  let productServiceSpy: jasmine.SpyObj<ProductService>;
  let inventoryServiceSpy: jasmine.SpyObj<InventoryService>;
  let orderServiceSpy: jasmine.SpyObj<OrderService>;
  let paymentServiceSpy: jasmine.SpyObj<PaymentService>;

  const emptyPage: PageResponse<any> = {
    content: [],
    pageNumber: 0,
    pageSize: 10,
    totalElements: 42,
    totalPages: 1,
    isFirst: true,
    isLast: true
  };

  beforeEach(async () => {
    productServiceSpy = jasmine.createSpyObj('ProductService', ['getAllProducts']);
    inventoryServiceSpy = jasmine.createSpyObj('InventoryService', ['getLowStockInventory']);
    orderServiceSpy = jasmine.createSpyObj('OrderService', ['getAllOrdersAdmin']);
    paymentServiceSpy = jasmine.createSpyObj('PaymentService', ['getAllPaymentsAdmin']);

    productServiceSpy.getAllProducts.and.returnValue(of(emptyPage));
    inventoryServiceSpy.getLowStockInventory.and.returnValue(of(emptyPage));
    orderServiceSpy.getAllOrdersAdmin.and.returnValue(of(emptyPage));
    paymentServiceSpy.getAllPaymentsAdmin.and.returnValue(of(emptyPage));

    await TestBed.configureTestingModule({
      imports: [AdminDashboardComponent, RouterTestingModule],
      providers: [
        { provide: ProductService, useValue: productServiceSpy },
        { provide: InventoryService, useValue: inventoryServiceSpy },
        { provide: OrderService, useValue: orderServiceSpy },
        { provide: PaymentService, useValue: paymentServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
  });

  it('should initialize and load dashboard operational metrics', () => {
    fixture.detectChanges();

    expect(component.totalProducts()).toBe(42);
    expect(component.totalLowStock()).toBe(42);
    expect(component.totalOrders()).toBe(42);
    expect(component.totalPayments()).toBe(42);
    expect(component.loading()).toBeFalse();
  });
});
