import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { ToastService } from '../../../core/services/toast.service';
import { OrderResponse, OrderStatus } from '../../../core/models/order.models';
import { OrderStatusBadgeComponent } from '../../../shared/components/order-status-badge/order-status-badge.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    OrderStatusBadgeComponent,
    PaginationComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="orders-page container">
      <div class="page-header">
        <div>
          <h1>My Orders</h1>
          <p class="text-muted">Track, manage and view history of your purchases</p>
        </div>
        <a routerLink="/products" class="btn btn-secondary">
          Continue Shopping
        </a>
      </div>

      @if (loading()) {
        <app-loading-spinner message="Loading your order history..."></app-loading-spinner>
      } @else if (errorMessage()) {
        <div class="alert alert-danger">{{ errorMessage() }}</div>
      } @else if (orders().length === 0) {
        <app-empty-state
          icon="📦"
          title="No Orders Placed Yet"
          description="When you place an order, it will appear here with live tracking."
          actionLabel="Start Shopping"
          (actionClicked)="navigateToProducts()"
        ></app-empty-state>
      } @else {
        <div class="orders-list">
          @for (order of orders(); track order.orderNumber) {
            <div class="order-card card">
              <div class="order-card-header">
                <div class="order-meta">
                  <span class="order-num">Order #<strong>{{ order.orderNumber }}</strong></span>
                  <span class="order-date">{{ order.createdAt | date:'mediumDate' }}</span>
                </div>
                <app-order-status-badge [status]="order.status"></app-order-status-badge>
              </div>

              <div class="order-card-body">
                <div class="items-summary">
                  <span class="items-count">{{ order.items.length }} Item(s):</span>
                  <div class="items-tags">
                    @for (item of order.items; track item.id) {
                      <span class="item-tag">{{ item.quantity }}x {{ item.productName }}</span>
                    }
                  </div>
                </div>

                <div class="order-details-meta">
                  <div class="meta-field">
                    <span class="meta-label">Shipping To:</span>
                    <span class="meta-val">{{ order.shippingAddress }}</span>
                  </div>

                  <div class="meta-field">
                    <span class="meta-label">Payment:</span>
                    <span class="meta-val">{{ order.paymentMethod || 'Card' }}</span>
                  </div>

                  @if (order.cancelReason) {
                    <div class="meta-field text-danger">
                      <span class="meta-label">Reason:</span>
                      <span class="meta-val">{{ order.cancelReason }}</span>
                    </div>
                  }
                </div>
              </div>

              <div class="order-card-footer">
                <div class="order-total">
                  <span>Total Amount:</span>
                  <strong class="price-val">\${{ order.totalAmount | number:'1.2-2' }}</strong>
                </div>

                <div class="card-actions">
                  @if (canCancel(order.status)) {
                    <button class="btn btn-secondary btn-sm" (click)="openCancelModal(order)">
                      Cancel Order
                    </button>
                  }
                  <a [routerLink]="['/orders', order.orderNumber]" class="btn btn-primary btn-sm">
                    View Details →
                  </a>
                </div>
              </div>
            </div>
          }
        </div>

        <app-pagination
          [pageNumber]="currentPage()"
          [totalPages]="totalPages()"
          [totalElements]="totalElements()"
          (pageChange)="onPageChange($event)"
        ></app-pagination>
      }

      <!-- Cancel Order Modal -->
      @if (selectedOrderForCancel()) {
        <div class="modal-backdrop">
          <div class="modal-card card">
            <div class="modal-header">
              <h3>Cancel Order #{{ selectedOrderForCancel()?.orderNumber }}</h3>
              <button class="modal-close" (click)="closeCancelModal()">&times;</button>
            </div>

            <div class="modal-body">
              <p class="warning-text">
                Are you sure you want to cancel this order? This action will release any reserved inventory and reverse the transaction.
              </p>

              <div class="form-group">
                <label class="form-label" for="cancelReason">Reason for cancellation *</label>
                <textarea
                  id="cancelReason"
                  class="form-control"
                  rows="3"
                  [(ngModel)]="cancelReasonText"
                  placeholder="e.g. Changed my mind, found better price, ordered by mistake"
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
    .orders-page {
      padding-top: 2rem;
      padding-bottom: 5rem;
    }
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2.5rem;
      gap: 1rem;
    }
    .page-header h1 {
      font-size: 2rem;
      font-weight: 800;
      color: var(--text-main);
      margin-bottom: 0.25rem;
    }
    .orders-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .order-card {
      background: #ffffff;
      padding: 1.5rem;
      transition: box-shadow 0.2s ease;
    }
    .order-card:hover {
      box-shadow: var(--shadow-md);
    }
    .order-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border);
      gap: 1rem;
    }
    .order-meta {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .order-num {
      font-size: 1.05rem;
      color: var(--text-main);
    }
    .order-date {
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .order-card-body {
      padding: 1.25rem 0;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .items-summary {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .items-count {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-muted);
    }
    .items-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .item-tag {
      background: #f8fafc;
      border: 1px solid var(--border);
      font-size: 0.8rem;
      padding: 0.2rem 0.6rem;
      border-radius: var(--radius-sm);
    }
    .order-details-meta {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1rem;
      font-size: 0.875rem;
      background: #f8fafc;
      padding: 0.85rem 1rem;
      border-radius: var(--radius-sm);
    }
    .meta-field {
      display: flex;
      gap: 0.5rem;
    }
    .meta-label {
      font-weight: 600;
      color: var(--text-muted);
    }
    .order-card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 1rem;
      border-top: 1px solid var(--border);
    }
    .order-total {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.95rem;
    }
    .price-val {
      font-size: 1.25rem;
      color: var(--primary);
    }
    .card-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .btn-sm {
      padding: 0.45rem 1rem;
      font-size: 0.85rem;
    }
    /* Modal Styles */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
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
    .modal-header h3 {
      font-size: 1.2rem;
      font-weight: 700;
    }
    .modal-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--text-muted);
    }
    .warning-text {
      font-size: 0.9rem;
      color: var(--text-muted);
      margin-bottom: 1.25rem;
      line-height: 1.5;
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }
    .spinner-sm {
      display: inline-block;
      width: 0.85rem;
      height: 0.85rem;
      border: 2px solid #ffffff;
      border-radius: 50%;
      border-top-color: transparent;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes modalSlide {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @media (max-width: 768px) {
      .order-card-header, .order-card-footer {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
      }
      .order-details-meta {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class OrderListComponent implements OnInit {
  private orderService = inject(OrderService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  orders = signal<OrderResponse[]>([]);
  loading = signal(true);
  errorMessage = signal<string | null>(null);

  currentPage = signal(0);
  totalPages = signal(1);
  totalElements = signal(0);

  selectedOrderForCancel = signal<OrderResponse | null>(null);
  cancelReasonText = '';
  cancelling = signal(false);

  ngOnInit(): void {
    this.fetchOrders();
  }

  fetchOrders(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.orderService.getMyOrders(this.currentPage(), 10).subscribe({
      next: (page) => {
        this.orders.set(page.content);
        this.currentPage.set(page.pageNumber);
        this.totalPages.set(page.totalPages);
        this.totalElements.set(page.totalElements);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to load orders.');
      }
    });
  }

  canCancel(status: OrderStatus): boolean {
    return status === 'CREATED' || status === 'INVENTORY_RESERVED' || status === 'CONFIRMED';
  }

  openCancelModal(order: OrderResponse): void {
    this.selectedOrderForCancel.set(order);
    this.cancelReasonText = '';
  }

  closeCancelModal(): void {
    this.selectedOrderForCancel.set(null);
    this.cancelReasonText = '';
  }

  confirmCancelOrder(): void {
    const order = this.selectedOrderForCancel();
    if (!order || !this.cancelReasonText.trim()) return;

    this.cancelling.set(true);
    this.orderService.cancelOrder(order.orderNumber, this.cancelReasonText.trim()).subscribe({
      next: () => {
        this.cancelling.set(false);
        this.toastService.success(`Order #${order.orderNumber} cancelled successfully`);
        this.closeCancelModal();
        this.fetchOrders();
      },
      error: (err) => {
        this.cancelling.set(false);
        this.toastService.error(err.error?.message || 'Failed to cancel order.');
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.fetchOrders();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navigateToProducts(): void {
    this.router.navigate(['/products']);
  }
}
