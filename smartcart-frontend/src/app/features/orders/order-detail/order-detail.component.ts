import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, switchMap, take, takeUntil, timer } from 'rxjs';
import { OrderService } from '../../../core/services/order.service';
import { PaymentService } from '../../../core/services/payment.service';
import { ToastService } from '../../../core/services/toast.service';
import { OrderResponse, OrderStatus } from '../../../core/models/order.models';
import { PaymentResponse } from '../../../core/models/payment.models';
import { OrderStatusBadgeComponent } from '../../../shared/components/order-status-badge/order-status-badge.component';
import { PaymentStatusBadgeComponent } from '../../../shared/components/payment-status-badge/payment-status-badge.component';
import { SagaProgressStepperComponent } from '../../../shared/components/saga-progress-stepper/saga-progress-stepper.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

const MAX_POLLING_ATTEMPTS = 11;
const POLLING_INTERVAL_MS = 1500;

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    OrderStatusBadgeComponent,
    PaymentStatusBadgeComponent,
    SagaProgressStepperComponent,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="order-detail-page container">
      <!-- Breadcrumb & Header -->
      <nav class="breadcrumb">
        <a routerLink="/">Home</a> &gt;
        <a routerLink="/orders">My Orders</a> &gt;
        <span>Order #{{ orderNumber }}</span>
      </nav>

      @if (loading()) {
        <app-loading-spinner message="Loading order details..."></app-loading-spinner>
      } @else if (errorMessage()) {
        <div class="alert alert-danger">{{ errorMessage() }}</div>
      } @else if (order()) {
        <div class="detail-header">
          <div class="header-left">
            <h1>Order #{{ order()?.orderNumber }}</h1>
            <p class="text-muted">Placed on {{ order()?.createdAt | date:'medium' }}</p>
          </div>

          <div class="header-right">
            <app-order-status-badge [status]="order()!.status"></app-order-status-badge>
            @if (canCancel(order()!.status)) {
              <button class="btn btn-danger btn-sm" (click)="openCancelModal()">
                Cancel Order
              </button>
            }
          </div>
        </div>

        <!-- Saga Real-Time Stepper -->
        <app-saga-progress-stepper
          [status]="order()!.status"
          [cancelReason]="order()?.cancelReason"
        ></app-saga-progress-stepper>

        <div class="order-layout-grid">
          <!-- Items Section -->
          <div class="main-order-card card">
            <h3>Items in this Order ({{ order()?.items?.length || 0 }})</h3>

            <div class="items-table">
              <div class="table-header">
                <span>Item</span>
                <span>SKU</span>
                <span>Price</span>
                <span>Qty</span>
                <span>Subtotal</span>
              </div>

              @for (item of order()?.items; track item.id) {
                <div class="table-row">
                  <span class="item-name"><strong>{{ item.productName }}</strong></span>
                  <span class="item-sku">{{ item.sku }}</span>
                  <span>\${{ item.unitPrice | number:'1.2-2' }}</span>
                  <span>{{ item.quantity }}</span>
                  <span class="item-subtotal">\${{ item.subtotal | number:'1.2-2' }}</span>
                </div>
              }
            </div>

            <div class="total-summary-bar">
              <span>Total Paid:</span>
              <strong class="total-amount">\${{ order()?.totalAmount | number:'1.2-2' }}</strong>
            </div>
          </div>

          <!-- Sidebar Info Cards -->
          <div class="sidebar-info">
            <!-- Shipping Card -->
            <div class="info-card card">
              <h4>📍 Shipping Address</h4>
              <p>{{ order()?.shippingAddress }}</p>
            </div>

            <!-- Payment Card -->
            <div class="info-card card">
              <div class="card-title-badge">
                <h4>💳 Payment Information</h4>
                @if (payment()) {
                  <app-payment-status-badge [status]="payment()!.status"></app-payment-status-badge>
                }
              </div>

              @if (payment()) {
                <div class="payment-meta">
                  <div class="meta-row">
                    <span>Transaction ID:</span>
                    <strong class="txn-code">{{ payment()?.transactionId }}</strong>
                  </div>
                  <div class="meta-row">
                    <span>Amount:</span>
                    <span>\${{ payment()?.amount | number:'1.2-2' }} {{ payment()?.currency }}</span>
                  </div>
                  <div class="meta-row">
                    <span>Method:</span>
                    <span>{{ payment()?.paymentMethod }}</span>
                  </div>
                  @if (payment()?.failureReason) {
                    <div class="meta-row text-danger">
                      <span>Reason:</span>
                      <span>{{ payment()?.failureReason }}</span>
                    </div>
                  }
                </div>
              } @else {
                <p class="text-muted">Payment record not generated yet or handled via cash.</p>
              }
            </div>
          </div>
        </div>
      }

      <!-- Cancel Order Modal -->
      @if (showCancelModal()) {
        <div class="modal-backdrop">
          <div class="modal-card card">
            <div class="modal-header">
              <h3>Cancel Order #{{ order()?.orderNumber }}</h3>
              <button class="modal-close" (click)="closeCancelModal()">&times;</button>
            </div>

            <div class="modal-body">
              <p class="warning-text">
                Are you sure you want to cancel this order? This will release reserved inventory and refund your payment.
              </p>

              <div class="form-group">
                <label class="form-label" for="cancelReasonInput">Reason for cancellation *</label>
                <textarea
                  id="cancelReasonInput"
                  class="form-control"
                  rows="3"
                  [(ngModel)]="cancelReasonText"
                  placeholder="e.g. Changed my mind, found better price"
                ></textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn-secondary" [disabled]="cancelling()" (click)="closeCancelModal()">
                Back
              </button>
              <button
                class="btn btn-danger"
                [disabled]="cancelling() || !cancelReasonText.trim()"
                (click)="confirmCancelOrder()"
              >
                @if (cancelling()) {
                  <span class="spinner-sm"></span> Cancelling...
                } @else {
                  Confirm Cancellation
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .order-detail-page {
      padding-top: 2rem;
      padding-bottom: 5rem;
    }
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 1.5rem;
    }
    .breadcrumb a { color: var(--text-muted); }
    .breadcrumb a:hover { color: var(--primary); }

    .detail-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      gap: 1rem;
    }
    .detail-header h1 {
      font-size: 2rem;
      font-weight: 800;
      color: var(--text-main);
      margin-bottom: 0.25rem;
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .order-layout-grid {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 2rem;
      align-items: start;
    }
    .main-order-card {
      background: #ffffff;
      padding: 1.75rem;
    }
    .main-order-card h3 {
      font-size: 1.2rem;
      font-weight: 700;
      margin-bottom: 1.25rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border);
    }
    .items-table {
      width: 100%;
      margin-bottom: 1.5rem;
    }
    .table-header {
      display: grid;
      grid-template-columns: 3fr 1.5fr 1fr 0.8fr 1fr;
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      padding-bottom: 0.6rem;
      border-bottom: 1px solid var(--border);
    }
    .table-row {
      display: grid;
      grid-template-columns: 3fr 1.5fr 1fr 0.8fr 1fr;
      align-items: center;
      padding: 0.85rem 0;
      border-bottom: 1px solid var(--border);
      font-size: 0.9rem;
    }
    .item-sku { color: var(--text-muted); font-size: 0.8rem; }
    .item-subtotal { font-weight: 700; color: var(--primary); }
    .total-summary-bar {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 1rem;
      padding-top: 1rem;
      font-size: 1.1rem;
    }
    .total-amount {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--primary);
    }
    .sidebar-info {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .info-card {
      background: #ffffff;
      padding: 1.5rem;
    }
    .info-card h4 {
      font-size: 1rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
    }
    .info-card p {
      font-size: 0.9rem;
      color: var(--text-main);
      line-height: 1.5;
    }
    .card-title-badge {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }
    .payment-meta {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      font-size: 0.875rem;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      gap: 0.5rem;
    }
    .txn-code {
      font-family: monospace;
      font-size: 0.8rem;
      background: #f1f5f9;
      padding: 0.15rem 0.4rem;
      border-radius: var(--radius-sm);
    }
    /* Modal */
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 1.5rem;
    }
    .modal-card {
      width: 100%;
      max-width: 500px;
      padding: 2rem;
      background: #ffffff;
      animation: modalSlide 0.2s ease-out;
    }
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25rem;
    }
    .modal-header h3 { font-size: 1.2rem; font-weight: 700; }
    .modal-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted); }
    .warning-text { font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1.25rem; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
    .spinner-sm {
      display: inline-block;
      width: 0.85rem; height: 0.85rem;
      border: 2px solid #ffffff; border-radius: 50%;
      border-top-color: transparent;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes modalSlide {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @media (max-width: 900px) {
      .order-layout-grid { grid-template-columns: 1fr; }
      .detail-header { flex-direction: column; align-items: flex-start; }
      .table-header { display: none; }
      .table-row { grid-template-columns: 1fr; gap: 0.25rem; }
    }
  `]
})
export class OrderDetailComponent implements OnInit, OnDestroy {
  private orderService = inject(OrderService);
  private paymentService = inject(PaymentService);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);

  orderNumber = '';
  order = signal<OrderResponse | null>(null);
  payment = signal<PaymentResponse | null>(null);
  loading = signal(true);
  errorMessage = signal<string | null>(null);

  showCancelModal = signal(false);
  cancelReasonText = '';
  cancelling = signal(false);

  private destroy$ = new Subject<void>();
  private pollingSub?: Subscription;

  ngOnInit(): void {
    const num = this.route.snapshot.paramMap.get('orderNumber');
    if (!num) {
      this.errorMessage.set('Invalid order reference.');
      this.loading.set(false);
      return;
    }

    this.orderNumber = num;
    this.fetchOrderAndPayment(num);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.pollingSub?.unsubscribe();
  }

  fetchOrderAndPayment(orderNumber: string): void {
    this.orderService.getOrderByNumber(orderNumber).subscribe({
      next: (orderData) => {
        this.order.set(orderData);
        this.loading.set(false);
        this.fetchPayment(orderNumber);

        // If in pending status, run bounded polling
        if (orderData.status === 'CREATED' || orderData.status === 'INVENTORY_RESERVED') {
          this.startBoundedPolling(orderNumber);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Order not found.');
      }
    });
  }

  fetchPayment(orderNumber: string): void {
    this.paymentService.getPaymentByOrderNumber(orderNumber).subscribe({
      next: (payData) => this.payment.set(payData),
      error: () => {} // Payment may not exist yet or was handled externally
    });
  }

  startBoundedPolling(orderNumber: string): void {
    this.pollingSub = timer(POLLING_INTERVAL_MS, POLLING_INTERVAL_MS)
      .pipe(
        takeUntil(this.destroy$),
        take(MAX_POLLING_ATTEMPTS),
        switchMap(() => this.orderService.getOrderByNumber(orderNumber))
      )
      .subscribe({
        next: (orderData) => {
          this.order.set(orderData);
          if (orderData.status !== 'CREATED' && orderData.status !== 'INVENTORY_RESERVED') {
            this.destroy$.next();
            this.fetchPayment(orderNumber);
          }
        }
      });
  }

  canCancel(status: OrderStatus): boolean {
    return status === 'CREATED' || status === 'INVENTORY_RESERVED' || status === 'CONFIRMED';
  }

  openCancelModal(): void {
    this.showCancelModal.set(true);
    this.cancelReasonText = '';
  }

  closeCancelModal(): void {
    this.showCancelModal.set(false);
    this.cancelReasonText = '';
  }

  confirmCancelOrder(): void {
    if (!this.orderNumber || !this.cancelReasonText.trim()) return;

    this.cancelling.set(true);
    this.orderService.cancelOrder(this.orderNumber, this.cancelReasonText.trim()).subscribe({
      next: (updatedOrder) => {
        this.cancelling.set(false);
        this.order.set(updatedOrder);
        this.toastService.success(`Order #${this.orderNumber} cancelled successfully`);
        this.closeCancelModal();
        this.fetchPayment(this.orderNumber);
      },
      error: (err) => {
        this.cancelling.set(false);
        this.toastService.error(err.error?.message || 'Failed to cancel order.');
      }
    });
  }
}
