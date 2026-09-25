import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PaymentService } from '../../../core/services/payment.service';
import { PaymentResponse } from '../../../core/models/payment.models';
import { PaymentStatusBadgeComponent } from '../../../shared/components/payment-status-badge/payment-status-badge.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    PaymentStatusBadgeComponent,
    PaginationComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="payments-page container">
      <div class="page-header">
        <div>
          <h1>Payment Transactions</h1>
          <p class="text-muted">Review your transaction history and payment receipts</p>
        </div>
        <a routerLink="/orders" class="btn btn-secondary">
          View Orders
        </a>
      </div>

      @if (loading()) {
        <app-loading-spinner message="Loading your payment records..."></app-loading-spinner>
      } @else if (errorMessage()) {
        <div class="alert alert-danger">{{ errorMessage() }}</div>
      } @else if (payments().length === 0) {
        <app-empty-state
          icon="💳"
          title="No Transactions Found"
          description="Your completed and processed payment transactions will be recorded here."
          actionLabel="Explore Products"
          (actionClicked)="navigateToProducts()"
        ></app-empty-state>
      } @else {
        <div class="payments-table-card card">
          <div class="payments-table">
            <div class="table-header">
              <span>Transaction ID</span>
              <span>Order Ref</span>
              <span>Amount</span>
              <span>Method</span>
              <span>Status</span>
              <span>Date</span>
            </div>

            @for (pay of payments(); track pay.id) {
              <div class="table-row">
                <span class="cell-txn">
                  <strong class="txn-code">{{ pay.transactionId }}</strong>
                </span>
                <span class="cell-order">
                  <a [routerLink]="['/orders', pay.orderNumber]" class="order-link">
                    #{{ pay.orderNumber }}
                  </a>
                </span>
                <span class="cell-amount">
                  \${{ pay.amount | number:'1.2-2' }} <small>{{ pay.currency }}</small>
                </span>
                <span class="cell-method">{{ pay.paymentMethod }}</span>
                <span class="cell-status">
                  <app-payment-status-badge [status]="pay.status"></app-payment-status-badge>
                </span>
                <span class="cell-date">{{ pay.createdAt | date:'mediumDate' }}</span>
              </div>
            }
          </div>
        </div>

        <app-pagination
          [pageNumber]="currentPage()"
          [totalPages]="totalPages()"
          [totalElements]="totalElements()"
          (pageChange)="onPageChange($event)"
        ></app-pagination>
      }
    </div>
  `,
  styles: [`
    .payments-page {
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
    .payments-table-card {
      background: #ffffff;
      padding: 1.5rem;
      margin-bottom: 2rem;
      overflow-x: auto;
    }
    .payments-table {
      min-width: 700px;
    }
    .table-header {
      display: grid;
      grid-template-columns: 2fr 1.8fr 1.2fr 1fr 1.2fr 1.2fr;
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid var(--border);
    }
    .table-row {
      display: grid;
      grid-template-columns: 2fr 1.8fr 1.2fr 1fr 1.2fr 1.2fr;
      align-items: center;
      padding: 1.1rem 0;
      border-bottom: 1px solid var(--border);
      font-size: 0.9rem;
    }
    .txn-code {
      font-family: monospace;
      font-size: 0.85rem;
      background: #f1f5f9;
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-sm);
    }
    .order-link {
      color: var(--primary);
      font-weight: 600;
    }
    .order-link:hover {
      text-decoration: underline;
    }
    .cell-amount {
      font-weight: 700;
      color: var(--text-main);
    }
    .cell-date {
      color: var(--text-muted);
      font-size: 0.85rem;
    }
    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class PaymentListComponent implements OnInit {
  private paymentService = inject(PaymentService);
  private router = inject(Router);

  payments = signal<PaymentResponse[]>([]);
  loading = signal(true);
  errorMessage = signal<string | null>(null);

  currentPage = signal(0);
  totalPages = signal(1);
  totalElements = signal(0);

  ngOnInit(): void {
    this.fetchPayments();
  }

  fetchPayments(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.paymentService.getMyPayments(this.currentPage(), 10).subscribe({
      next: (page) => {
        this.payments.set(page.content);
        this.currentPage.set(page.pageNumber);
        this.totalPages.set(page.totalPages);
        this.totalElements.set(page.totalElements);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to load payments.');
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.fetchPayments();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navigateToProducts(): void {
    this.router.navigate(['/products']);
  }
}
