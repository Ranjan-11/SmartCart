import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { ToastService } from '../../../core/services/toast.service';
import { OrderResponse, OrderStatus } from '../../../core/models/order.models';
import { OrderStatusBadgeComponent } from '../../../shared/components/order-status-badge/order-status-badge.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-admin-orders',
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
    <div class="admin-page">
      <div class="page-header">
        <div>
          <h1>System Order Management</h1>
          <p class="text-muted">Monitor global orders, inspect transactions and manage cancellations</p>
        </div>
      </div>

      @if (loading()) {
        <app-loading-spinner message="Loading system orders..."></app-loading-spinner>
      } @else if (orders().length === 0) {
        <app-empty-state
          icon="🛒"
          title="No Orders Found"
          description="Customer orders placed across the system will appear here."
        ></app-empty-state>
      } @else {
        <div class="card table-card">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Order Reference</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Placed Date</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (order of orders(); track order.orderNumber) {
                <tr>
                  <td>
                    <strong>
                      <a [routerLink]="['/orders', order.orderNumber]" class="order-link">
                        #{{ order.orderNumber }}
                      </a>
                    </strong>
                  </td>
                  <td>{{ order.userEmail }}</td>
                  <td>{{ order.items.length }} item(s)</td>
                  <td><strong>\${{ order.totalAmount | number:'1.2-2' }}</strong></td>
                  <td>
                    <app-order-status-badge [status]="order.status"></app-order-status-badge>
                  </td>
                  <td>{{ order.createdAt | date:'mediumDate' }}</td>
                  <td class="text-right actions-cell">
                    <a [routerLink]="['/orders', order.orderNumber]" class="btn btn-secondary btn-xs">
                      View
                    </a>
                    @if (canCancel(order.status)) {
                      <button class="btn btn-danger btn-xs" (click)="openCancelModal(order)">
                        Cancel
                      </button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <app-pagination
          [pageNumber]="currentPage()"
          [totalPages]="totalPages()"
          [totalElements]="totalElements()"
          (pageChange)="onPageChange($event)"
        ></app-pagination>
      }

      <!-- Admin Cancel Order Modal -->
      @if (selectedOrderForCancel()) {
        <div class="modal-backdrop">
          <div class="modal-card card">
            <div class="modal-header">
              <h3>Cancel Order #{{ selectedOrderForCancel()?.orderNumber }}</h3>
              <button class="modal-close" (click)="closeCancelModal()">&times;</button>
            </div>

            <div class="modal-body">
              <p class="text-muted mb-4">
                Cancelling this order as an Administrator will trigger a compensation Saga to refund payment and release stock.
              </p>

              <div class="form-group">
                <label class="form-label" for="adminReason">Cancellation Reason *</label>
                <textarea
                  id="adminReason"
                  class="form-control"
                  rows="3"
                  [(ngModel)]="cancelReasonText"
                  placeholder="e.g. Administrative cancellation, Customer requested via support"
                ></textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn-secondary" [disabled]="cancelling()" (click)="closeCancelModal()">Back</button>
              <button
                class="btn btn-danger"
                [disabled]="cancelling() || !cancelReasonText.trim()"
                (click)="confirmCancelOrder()"
              >
                @if (cancelling()) { <span class="spinner-sm"></span> Cancelling... }
                @else { Confirm Cancellation }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-page { display: flex; flex-direction: column; gap: 1.5rem; }
    .page-header h1 { font-size: 1.75rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.25rem; }
    .table-card { background: #ffffff; padding: 1.5rem; overflow-x: auto; }
    .admin-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    .admin-table th {
      text-align: left; padding: 0.75rem; font-size: 0.8rem; font-weight: 700;
      color: var(--text-muted); text-transform: uppercase; border-bottom: 2px solid var(--border);
    }
    .admin-table td { padding: 0.85rem 0.75rem; border-bottom: 1px solid var(--border); vertical-align: middle; }
    .actions-cell { display: flex; justify-content: flex-end; gap: 0.5rem; }
    .text-right { text-align: right; }
    .order-link { color: var(--primary); text-decoration: none; }
    .order-link:hover { text-decoration: underline; }
    .btn-xs { padding: 0.3rem 0.6rem; font-size: 0.75rem; }
    .mb-4 { margin-bottom: 1rem; }
    /* Modal */
    .modal-backdrop {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.6); display: flex; align-items: center; justify-content: center;
      z-index: 9999; padding: 1.5rem;
    }
    .modal-card { width: 100%; max-width: 500px; padding: 2rem; background: #ffffff; }
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 1.25rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border);
    }
    .modal-header h3 { font-size: 1.25rem; font-weight: 700; }
    .modal-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted); }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
    .spinner-sm {
      display: inline-block; width: 0.85rem; height: 0.85rem;
      border: 2px solid #ffffff; border-radius: 50%; border-top-color: transparent;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class AdminOrdersComponent implements OnInit {
  private orderService = inject(OrderService);
  private toastService = inject(ToastService);

  orders = signal<OrderResponse[]>([]);
  loading = signal(true);
  cancelling = signal(false);

  currentPage = signal(0);
  totalPages = signal(1);
  totalElements = signal(0);

  selectedOrderForCancel = signal<OrderResponse | null>(null);
  cancelReasonText = '';

  ngOnInit(): void {
    this.fetchOrders();
  }

  fetchOrders(): void {
    this.loading.set(true);
    this.orderService.getAllOrdersAdmin(this.currentPage(), 10).subscribe({
      next: (page) => {
        this.orders.set(page.content);
        this.currentPage.set(page.pageNumber);
        this.totalPages.set(page.totalPages);
        this.totalElements.set(page.totalElements);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toastService.error(err.error?.message || 'Failed to load system orders');
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
        this.toastService.success(`Order #${order.orderNumber} cancelled by admin`);
        this.closeCancelModal();
        this.fetchOrders();
      },
      error: (err) => {
        this.cancelling.set(false);
        this.toastService.error(err.error?.message || 'Failed to cancel order');
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.fetchOrders();
  }
}
