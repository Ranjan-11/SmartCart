import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentStatus } from '../../../core/models/payment.models';

@Component({
  selector: 'app-payment-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [ngClass]="getBadgeClass()">
      {{ status }}
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.35rem 0.75rem;
      font-size: 0.8rem;
      font-weight: 700;
      border-radius: var(--radius-full);
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }
  `]
})
export class PaymentStatusBadgeComponent {
  @Input({ required: true }) status!: PaymentStatus;

  getBadgeClass(): string {
    switch (this.status) {
      case 'SUCCESS':
        return 'badge-success';
      case 'FAILED':
        return 'badge-danger';
      case 'REFUNDED':
        return 'badge-info';
      case 'PENDING':
      default:
        return 'badge-warning';
    }
  }
}
