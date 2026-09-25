import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderStatus } from '../../../core/models/order.models';

@Component({
  selector: 'app-order-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [ngClass]="getBadgeClass()">
      {{ getDisplayLabel() }}
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
export class OrderStatusBadgeComponent {
  @Input({ required: true }) status!: OrderStatus;

  getBadgeClass(): string {
    switch (this.status) {
      case 'CONFIRMED':
      case 'DELIVERED':
        return 'badge-success';
      case 'CREATED':
      case 'INVENTORY_RESERVED':
      case 'SHIPPED':
        return 'badge-info';
      case 'FAILED':
      case 'CANCELLED':
        return 'badge-danger';
      default:
        return 'badge-warning';
    }
  }

  getDisplayLabel(): string {
    switch (this.status) {
      case 'CREATED':
        return 'Submitted';
      case 'INVENTORY_RESERVED':
        return 'Inventory Reserved';
      case 'CONFIRMED':
        return 'Confirmed';
      case 'CANCELLED':
        return 'Cancelled';
      case 'FAILED':
        return 'Failed';
      case 'SHIPPED':
        return 'Shipped';
      case 'DELIVERED':
        return 'Delivered';
      default:
        return this.status;
    }
  }
}
