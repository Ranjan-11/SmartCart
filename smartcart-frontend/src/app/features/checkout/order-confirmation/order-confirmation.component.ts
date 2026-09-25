import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, Subscription, switchMap, take, takeUntil, timer } from 'rxjs';
import { OrderService } from '../../../core/services/order.service';
import { OrderResponse, OrderStatus } from '../../../core/models/order.models';
import { SagaProgressStepperComponent } from '../../../shared/components/saga-progress-stepper/saga-progress-stepper.component';
import { OrderStatusBadgeComponent } from '../../../shared/components/order-status-badge/order-status-badge.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

const MAX_POLLING_ATTEMPTS = 11; // ~15 seconds total polling window
const POLLING_INTERVAL_MS = 1500;

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    SagaProgressStepperComponent,
    OrderStatusBadgeComponent,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="confirmation-page container">
      @if (initialLoading()) {
        <app-loading-spinner message="Initializing order tracking..."></app-loading-spinner>
      } @else if (errorMessage()) {
        <div class="alert alert-danger">{{ errorMessage() }}</div>
      } @else if (order()) {
        <div class="confirmation-header">
          <div class="header-top">
            <span class="order-label">Order #{{ order()?.orderNumber }}</span>
            <app-order-status-badge [status]="order()!.status"></app-order-status-badge>
          </div>
          <h1>
            @if (order()?.status === 'CONFIRMED') {
              Order Confirmed! 🎉
            } @else if (order()?.status === 'FAILED' || order()?.status === 'CANCELLED') {
              Order {{ order()?.status }}
            } @else {
              Processing Your Order...
            }
          </h1>
          <p class="text-muted">Placed on {{ order()?.createdAt | date:'medium' }}</p>
        </div>

        <!-- Saga Real-Time Stepper -->
        <app-saga-progress-stepper
          [status]="order()!.status"
          [cancelReason]="order()?.cancelReason"
        ></app-saga-progress-stepper>

        <!-- Timeout Fallback Notice (if Saga takes > 15s without failing) -->
        @if (timedOut() && isPendingStatus(order()!.status)) {
          <div class="alert alert-info timeout-box">
            <div class="timeout-icon">ℹ️</div>
            <div>
              <strong>Your order is still being processed.</strong>
              <p>Payment verification or inventory confirmation is taking slightly longer than usual. You can safely check its status from your orders page.</p>
            </div>
          </div>
        }

        <!-- Order Summary Card -->
        <div class="order-details-card card">
          <div class="card-section">
            <h3>Order Details</h3>

            <div class="items-table">
              <div class="table-header">
                <span>Product</span>
                <span>SKU</span>
                <span>Price</span>
                <span>Qty</span>
                <span>Subtotal</span>
              </div>

              @for (item of order()?.items; track item.id) {
                <div class="table-row">
                  <span class="cell-name"><strong>{{ item.productName }}</strong></span>
                  <span class="cell-sku">{{ item.sku }}</span>
                  <span>\${{ item.unitPrice | number:'1.2-2' }}</span>
                  <span>{{ item.quantity }}</span>
                  <span class="cell-total">\${{ item.subtotal | number:'1.2-2' }}</span>
                </div>
              }
            </div>

            <div class="order-total-bar">
              <span class="total-label">Total Amount Paid:</span>
              <span class="total-value">\${{ order()?.totalAmount | number:'1.2-2' }}</span>
            </div>
          </div>

          <div class="card-grid-info">
            <div class="info-box">
              <h4>Shipping Address</h4>
              <p>{{ order()?.shippingAddress }}</p>
            </div>

            <div class="info-box">
              <h4>Payment Method</h4>
              <p>{{ order()?.paymentMethod || 'Credit / Debit Card' }}</p>
            </div>

            <div class="info-box">
              <h4>Customer Account</h4>
              <p>{{ order()?.userEmail }}</p>
            </div>
          </div>
        </div>

        <!-- Action Navigation Buttons -->
        <div class="action-buttons">
          <a routerLink="/products" class="btn btn-secondary btn-lg">
            Continue Shopping
          </a>
          <a routerLink="/cart" class="btn btn-primary btn-lg">
            View Cart
          </a>
        </div>
      }
    </div>
  `,
  styles: [`
    .confirmation-page {
      padding-top: 2.5rem;
      padding-bottom: 5rem;
      max-width: 900px;
    }
    .confirmation-header {
      text-align: center;
      margin-bottom: 1.5rem;
    }
    .header-top {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 0.75rem;
    }
    .order-label {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-muted);
    }
    .confirmation-header h1 {
      font-size: 2.25rem;
      font-weight: 800;
      color: var(--text-main);
      margin-bottom: 0.35rem;
    }
    .timeout-box {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.25rem;
      border-radius: var(--radius-md);
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1e40af;
      margin-bottom: 2rem;
    }
    .timeout-icon {
      font-size: 1.5rem;
    }
    .timeout-box p {
      margin: 0.25rem 0 0 0;
      font-size: 0.875rem;
    }
    .order-details-card {
      background: #ffffff;
      padding: 2rem;
      margin-bottom: 2.5rem;
    }
    .card-section h3 {
      font-size: 1.25rem;
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
    .cell-sku {
      color: var(--text-muted);
      font-size: 0.8rem;
    }
    .cell-total {
      font-weight: 700;
      color: var(--primary);
    }
    .order-total-bar {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 1rem;
      padding-top: 1rem;
    }
    .total-label {
      font-size: 1.1rem;
      font-weight: 700;
    }
    .total-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--primary);
    }
    .card-grid-info {
      display: grid;
      grid-template-grid: repeat(auto-fit, minmax(220px, 1fr));
      grid-template-columns: 1fr 1fr 1fr;
      gap: 1.5rem;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border);
    }
    .info-box h4 {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      margin-bottom: 0.35rem;
    }
    .info-box p {
      font-size: 0.9rem;
      color: var(--text-main);
      line-height: 1.4;
    }
    .action-buttons {
      display: flex;
      justify-content: center;
      gap: 1.5rem;
    }
    .btn-lg {
      padding: 0.75rem 2rem;
      font-size: 1rem;
      font-weight: 600;
    }
    .alert {
      padding: 1rem;
      border-radius: var(--radius-sm);
    }
    .alert-danger {
      background: var(--danger-light);
      color: var(--danger);
      border: 1px solid #fecaca;
    }
    @media (max-width: 768px) {
      .card-grid-info {
        grid-template-columns: 1fr;
      }
      .table-header {
        display: none;
      }
      .table-row {
        grid-template-columns: 1fr;
        gap: 0.25rem;
      }
      .action-buttons {
        flex-direction: column;
      }
    }
  `]
})
export class OrderConfirmationComponent implements OnInit, OnDestroy {
  private orderService = inject(OrderService);
  private route = inject(ActivatedRoute);

  order = signal<OrderResponse | null>(null);
  initialLoading = signal(true);
  timedOut = signal(false);
  errorMessage = signal<string | null>(null);

  private destroy$ = new Subject<void>();
  private pollingSub?: Subscription;

  ngOnInit(): void {
    const orderNumber = this.route.snapshot.paramMap.get('orderNumber');
    if (!orderNumber) {
      this.errorMessage.set('Invalid order reference.');
      this.initialLoading.set(false);
      return;
    }

    this.startSagaPolling(orderNumber);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.pollingSub?.unsubscribe();
  }

  isPendingStatus(status: OrderStatus): boolean {
    return status === 'CREATED' || status === 'INVENTORY_RESERVED';
  }

  private startSagaPolling(orderNumber: string): void {
    let attempts = 0;

    this.pollingSub = timer(0, POLLING_INTERVAL_MS)
      .pipe(
        takeUntil(this.destroy$),
        take(MAX_POLLING_ATTEMPTS),
        switchMap(() => this.orderService.getOrderByNumber(orderNumber))
      )
      .subscribe({
        next: (orderData) => {
          this.order.set(orderData);
          this.initialLoading.set(false);
          attempts++;

          // Terminal states: stop polling immediately
          if (orderData.status === 'CONFIRMED' || orderData.status === 'FAILED' || orderData.status === 'CANCELLED') {
            this.destroy$.next();
          } else if (attempts >= MAX_POLLING_ATTEMPTS) {
            this.timedOut.set(true);
          }
        },
        error: (err) => {
          this.initialLoading.set(false);
          this.errorMessage.set(err.error?.message || 'Failed to retrieve order status.');
          this.destroy$.next();
        },
        complete: () => {
          if (this.order() && this.isPendingStatus(this.order()!.status)) {
            this.timedOut.set(true);
          }
        }
      });
  }
}
