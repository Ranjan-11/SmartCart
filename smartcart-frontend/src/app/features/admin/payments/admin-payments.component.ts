import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../../../core/services/payment.service';
import { ToastService } from '../../../core/services/toast.service';
import { PaymentResponse } from '../../../core/models/payment.models';
import { PaymentStatusBadgeComponent } from '../../../shared/components/payment-status-badge/payment-status-badge.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-admin-payments',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    PaymentStatusBadgeComponent,
    PaginationComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <div>
          <h1>System Payment Transactions</h1>
          <p class="text-muted">Inspect payment charges, transaction logs, and process refunds</p>
        </div>
      </div>

      @if (loading()) {
        <app-loading-spinner message="Loading payment transactions..."></app-loading-spinner>
      } @else if (payments().length === 0) {
        <app-empty-state
          icon="💳"
          title="No Payment Records"
          description="System-wide payment transactions will be recorded here."
        ></app-empty-state>
      } @else {
        <div class="card table-card">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Order Ref</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Date</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (pay of payments(); track pay.id) {
                <tr>
                  <td><code>{{ pay.transactionId }}</code></td>
                  <td>
                    <strong>
                      <a [routerLink]="['/orders', pay.orderNumber]" class="order-link">
                        #{{ pay.orderNumber }}
                      </a>
                    </strong>
                  </td>
                  <td>{{ pay.userEmail || '—' }}</td>
                  <td><strong>\${{ pay.amount | number:'1.2-2' }} <small>{{ pay.currency }}</small></strong></td>
                  <td>{{ pay.paymentMethod }}</td>
                  <td>
                    <app-payment-status-badge [status]="pay.status"></app-payment-status-badge>
                  </td>
                  <td>{{ pay.createdAt | date:'mediumDate' }}</td>
                  <td class="text-right actions-cell">
                    @if (pay.status === 'SUCCESS') {
                      <button class="btn btn-secondary btn-xs" (click)="openRefundModal(pay)">
                        Refund
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

      <!-- Refund Modal -->
      @if (selectedForRefund()) {
        <div class="modal-backdrop">
          <div class="modal-card card">
            <div class="modal-header">
              <h3>Process Refund for Order #{{ selectedForRefund()?.orderNumber }}</h3>
              <button class="modal-close" (click)="closeRefundModal()">&times;</button>
            </div>

            <div class="modal-body">
              <p class="text-muted mb-4">
                Refunding transaction <strong>{{ selectedForRefund()?.transactionId }}</strong> for amount <strong>\${{ selectedForRefund()?.amount | number:'1.2-2' }}</strong>.
              </p>

              <div class="form-group">
                <label class="form-label" for="refundReason">Reason for Refund *</label>
                <textarea
                  id="refundReason"
                  class="form-control"
                  rows="3"
                  [(ngModel)]="refundReasonText"
                  placeholder="e.g. Customer returned merchandise, duplicate charge"
                ></textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn-secondary" [disabled]="refunding()" (click)="closeRefundModal()">Cancel</button>
              <button
                class="btn btn-danger"
                [disabled]="refunding() || !refundReasonText.trim()"
                (click)="confirmRefund()"
              >
                @if (refunding()) { <span class="spinner-sm"></span> Processing... }
                @else { Confirm Refund }
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
    .actions-cell { display: flex; justify-content: flex-end; }
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
export class AdminPaymentsComponent implements OnInit {
  private paymentService = inject(PaymentService);
  private toastService = inject(ToastService);

  payments = signal<PaymentResponse[]>([]);
  loading = signal(true);
  refunding = signal(false);

  currentPage = signal(0);
  totalPages = signal(1);
  totalElements = signal(0);

  selectedForRefund = signal<PaymentResponse | null>(null);
  refundReasonText = '';

  ngOnInit(): void {
    this.fetchPayments();
  }

  fetchPayments(): void {
    this.loading.set(true);
    this.paymentService.getAllPaymentsAdmin(this.currentPage(), 10).subscribe({
      next: (page) => {
        this.payments.set(page.content);
        this.currentPage.set(page.pageNumber);
        this.totalPages.set(page.totalPages);
        this.totalElements.set(page.totalElements);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toastService.error(err.error?.message || 'Failed to load payments');
      }
    });
  }

  openRefundModal(payment: PaymentResponse): void {
    this.selectedForRefund.set(payment);
    this.refundReasonText = '';
  }

  closeRefundModal(): void {
    this.selectedForRefund.set(null);
    this.refundReasonText = '';
  }

  confirmRefund(): void {
    const pay = this.selectedForRefund();
    if (!pay || !this.refundReasonText.trim()) return;

    this.refunding.set(true);
    this.paymentService.refundPayment(pay.orderNumber, this.refundReasonText.trim()).subscribe({
      next: () => {
        this.refunding.set(false);
        this.toastService.success(`Refund completed for order #${pay.orderNumber}`);
        this.closeRefundModal();
        this.fetchPayments();
      },
      error: (err) => {
        this.refunding.set(false);
        this.toastService.error(err.error?.message || 'Failed to process refund');
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.fetchPayments();
  }
}
