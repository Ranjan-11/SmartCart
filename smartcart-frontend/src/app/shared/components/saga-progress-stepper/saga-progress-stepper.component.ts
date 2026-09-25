import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderStatus } from '../../../core/models/order.models';

@Component({
  selector: 'app-saga-progress-stepper',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stepper-wrapper">
      <!-- Status Description Banner -->
      <div class="status-banner" [ngClass]="getBannerClass()">
        <div class="banner-icon">{{ getBannerIcon() }}</div>
        <div class="banner-text">
          <h4>{{ getBannerTitle() }}</h4>
          <p>{{ getBannerDescription() }}</p>
        </div>
      </div>

      <!-- Stepper Steps -->
      @if (status !== 'FAILED' && status !== 'CANCELLED') {
        <div class="stepper-track">
          <!-- Step 1: Order Created -->
          <div class="step-item" [ngClass]="getStepState(1)">
            <div class="step-circle">
              @if (getStepState(1) === 'completed') { ✓ }
              @else if (getStepState(1) === 'active') { <span class="pulse-dot"></span> }
              @else { 1 }
            </div>
            <div class="step-label">
              <span class="step-title">Order Placed</span>
              <span class="step-desc">Order details recorded</span>
            </div>
          </div>

          <div class="step-line" [class.completed]="getStepState(2) !== 'pending'"></div>

          <!-- Step 2: Inventory Reserved -->
          <div class="step-item" [ngClass]="getStepState(2)">
            <div class="step-circle">
              @if (getStepState(2) === 'completed') { ✓ }
              @else if (getStepState(2) === 'active') { <span class="pulse-dot"></span> }
              @else { 2 }
            </div>
            <div class="step-label">
              <span class="step-title">Inventory Reserved</span>
              <span class="step-desc">Stock locked & verified</span>
            </div>
          </div>

          <div class="step-line" [class.completed]="getStepState(3) === 'completed'"></div>

          <!-- Step 3: Payment Processed & Confirmed -->
          <div class="step-item" [ngClass]="getStepState(3)">
            <div class="step-circle">
              @if (getStepState(3) === 'completed') { ✓ }
              @else if (getStepState(3) === 'active') { <span class="pulse-dot"></span> }
              @else { 3 }
            </div>
            <div class="step-label">
              <span class="step-title">Payment & Confirmation</span>
              <span class="step-desc">Order confirmed</span>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .stepper-wrapper {
      margin: 2rem 0;
    }
    .status-banner {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding: 1.25rem 1.5rem;
      border-radius: var(--radius-md);
      margin-bottom: 2.5rem;
    }
    .banner-info { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; }
    .banner-success { background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; }
    .banner-danger { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }

    .banner-icon { font-size: 2rem; flex-shrink: 0; }
    .banner-text h4 { font-size: 1.1rem; font-weight: 700; margin-bottom: 0.25rem; }
    .banner-text p { font-size: 0.9rem; opacity: 0.9; margin: 0; }

    .stepper-track {
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
    }
    .step-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      z-index: 2;
      flex: 1;
    }
    .step-circle {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #f1f5f9;
      color: var(--text-muted);
      border: 2px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.9rem;
      margin-bottom: 0.75rem;
      transition: all 0.3s ease;
    }
    .step-label {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .step-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-main);
    }
    .step-desc {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .step-line {
      flex: 1;
      height: 3px;
      background: var(--border);
      margin: 0 0.5rem;
      margin-bottom: 2rem;
      transition: background 0.3s ease;
    }
    .step-line.completed {
      background: var(--success);
    }

    .step-item.active .step-circle {
      border-color: var(--primary);
      background: #eff6ff;
      color: var(--primary);
    }
    .step-item.completed .step-circle {
      border-color: var(--success);
      background: var(--success);
      color: #ffffff;
    }
    .pulse-dot {
      width: 10px;
      height: 10px;
      background: var(--primary);
      border-radius: 50%;
      animation: pulse 1s infinite alternate;
    }
    @keyframes pulse {
      from { transform: scale(0.8); opacity: 0.6; }
      to { transform: scale(1.3); opacity: 1; }
    }
    @media (max-width: 640px) {
      .stepper-track {
        flex-direction: column;
        align-items: flex-start;
        gap: 1.5rem;
      }
      .step-item {
        flex-direction: row;
        align-items: center;
        gap: 1rem;
        text-align: left;
      }
      .step-circle {
        margin-bottom: 0;
      }
      .step-line {
        display: none;
      }
    }
  `]
})
export class SagaProgressStepperComponent {
  @Input({ required: true }) status!: OrderStatus;
  @Input() cancelReason?: string;

  getBannerClass(): string {
    switch (this.status) {
      case 'CONFIRMED':
      case 'SHIPPED':
      case 'DELIVERED':
        return 'banner-success';
      case 'FAILED':
      case 'CANCELLED':
        return 'banner-danger';
      default:
        return 'banner-info';
    }
  }

  getBannerIcon(): string {
    switch (this.status) {
      case 'CONFIRMED':
      case 'SHIPPED':
      case 'DELIVERED':
        return '🎉';
      case 'FAILED':
      case 'CANCELLED':
        return '⚠️';
      case 'INVENTORY_RESERVED':
        return '💳';
      default:
        return '⏳';
    }
  }

  getBannerTitle(): string {
    switch (this.status) {
      case 'CREATED':
        return 'Order Processing';
      case 'INVENTORY_RESERVED':
        return 'Inventory Reserved';
      case 'CONFIRMED':
        return 'Order Confirmed!';
      case 'FAILED':
        return 'Order Processing Failed';
      case 'CANCELLED':
        return 'Order Cancelled';
      default:
        return 'Order Status: ' + this.status;
    }
  }

  getBannerDescription(): string {
    switch (this.status) {
      case 'CREATED':
        return 'Your order has been submitted and is waiting for inventory confirmation.';
      case 'INVENTORY_RESERVED':
        return 'Inventory has been reserved. Payment is being processed.';
      case 'CONFIRMED':
        return 'Your order has been confirmed successfully and queued for dispatch.';
      case 'FAILED':
        return this.cancelReason || 'Inventory or payment validation could not be completed for this order.';
      case 'CANCELLED':
        return this.cancelReason || 'This order was cancelled and any reserved resources have been released.';
      default:
        return 'Your order status is currently ' + this.status;
    }
  }

  getStepState(stepNumber: number): 'pending' | 'active' | 'completed' {
    if (this.status === 'CONFIRMED' || this.status === 'SHIPPED' || this.status === 'DELIVERED') {
      return 'completed';
    }

    if (stepNumber === 1) {
      return this.status === 'CREATED' ? 'active' : 'completed';
    }

    if (stepNumber === 2) {
      if (this.status === 'CREATED') return 'pending';
      if (this.status === 'INVENTORY_RESERVED') return 'active';
      return 'completed';
    }

    if (stepNumber === 3) {
      return 'pending';
    }

    return 'pending';
  }
}
