import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../core/services/toast.service';
import { AddressDto } from '../../core/models/user.models';
import { CheckoutRequest } from '../../core/models/order.models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <div class="checkout-page container">
      <div class="checkout-header">
        <h1>Secure Checkout</h1>
        <p class="text-muted">Complete your shipping and payment details to place your order</p>
      </div>

      @if (cartLoading()) {
        <app-loading-spinner message="Loading your order details..."></app-loading-spinner>
      } @else if (cartService.items().length === 0) {
        <app-empty-state
          icon="🛍️"
          title="Your Cart is Empty"
          description="You cannot checkout with an empty cart. Please add products first."
          actionLabel="Browse Products"
          (actionClicked)="navigateToProducts()"
        ></app-empty-state>
      } @else {
        <div class="checkout-grid">
          <!-- Checkout Form -->
          <div class="checkout-form-section">
            <form [formGroup]="checkoutForm" (ngSubmit)="onPlaceOrder()">
              <!-- Shipping Address Card -->
              <div class="card checkout-card">
                <div class="card-header">
                  <h3>1. Shipping Address</h3>
                </div>

                @if (savedAddresses().length > 0) {
                  <div class="saved-addresses">
                    <label class="form-label">Select Saved Address:</label>
                    <div class="address-options">
                      @for (addr of savedAddresses(); track addr.id) {
                        <label class="address-radio-label">
                          <input
                            type="radio"
                            name="savedAddress"
                            (change)="onSelectSavedAddress(addr)"
                          />
                          <div class="address-box">
                            <strong>{{ addr.street }}</strong>, {{ addr.city }}, {{ addr.state }} {{ addr.postalCode }}, {{ addr.country }}
                          </div>
                        </label>
                      }
                    </div>
                    <div class="or-divider"><span>OR Enter Shipping Address</span></div>
                  </div>
                }

                <div class="form-group">
                  <label class="form-label" for="shippingAddress">Full Shipping Address *</label>
                  <textarea
                    id="shippingAddress"
                    class="form-control"
                    rows="3"
                    formControlName="shippingAddress"
                    placeholder="123 Main St, Apt 4B, New York, NY 10001, USA"
                    [class.is-invalid]="isFieldInvalid('shippingAddress')"
                  ></textarea>
                  @if (isFieldInvalid('shippingAddress')) {
                    <div class="form-error">Shipping address is required</div>
                  }
                </div>
              </div>

              <!-- Payment Method Card -->
              <div class="card checkout-card">
                <div class="card-header">
                  <h3>2. Payment Method</h3>
                </div>

                <div class="payment-methods-grid">
                  <label class="payment-option" [class.selected]="checkoutForm.get('paymentMethod')?.value === 'CREDIT_CARD'">
                    <input type="radio" formControlName="paymentMethod" value="CREDIT_CARD" />
                    <div class="payment-option-content">
                      <span class="payment-icon">💳</span>
                      <div>
                        <strong>Credit / Debit Card</strong>
                        <p class="text-muted">Instant processing via Saga</p>
                      </div>
                    </div>
                  </label>

                  <label class="payment-option" [class.selected]="checkoutForm.get('paymentMethod')?.value === 'PAYPAL'">
                    <input type="radio" formControlName="paymentMethod" value="PAYPAL" />
                    <div class="payment-option-content">
                      <span class="payment-icon">🅿️</span>
                      <div>
                        <strong>PayPal</strong>
                        <p class="text-muted">Safe digital wallet</p>
                      </div>
                    </div>
                  </label>

                  <label class="payment-option" [class.selected]="checkoutForm.get('paymentMethod')?.value === 'CASH_ON_DELIVERY'">
                    <input type="radio" formControlName="paymentMethod" value="CASH_ON_DELIVERY" />
                    <div class="payment-option-content">
                      <span class="payment-icon">💵</span>
                      <div>
                        <strong>Cash on Delivery</strong>
                        <p class="text-muted">Pay at doorstep</p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                class="btn btn-primary btn-place-order"
                [disabled]="submitting() || checkoutForm.invalid"
              >
                @if (submitting()) {
                  <span class="spinner"></span> Placing Your Order...
                } @else {
                  Place Order (\${{ cartService.totalPrice() | number:'1.2-2' }})
                }
              </button>
            </form>
          </div>

          <!-- Order Summary Sidebar -->
          <div class="order-summary-sidebar card">
            <h3>Order Summary</h3>
            <div class="summary-items">
              @for (item of cartService.items(); track item.sku) {
                <div class="summary-item">
                  <div class="summary-item-info">
                    <span class="item-qty-badge">{{ item.quantity }}x</span>
                    <span class="summary-item-name">{{ item.productName }}</span>
                  </div>
                  <span class="summary-item-price">\${{ item.subtotal | number:'1.2-2' }}</span>
                </div>
              }
            </div>

            <div class="summary-divider"></div>

            <div class="summary-row">
              <span>Subtotal</span>
              <span>\${{ cartService.totalPrice() | number:'1.2-2' }}</span>
            </div>

            <div class="summary-row">
              <span>Shipping</span>
              <span class="text-success">FREE</span>
            </div>

            <div class="summary-divider"></div>

            <div class="summary-row total-row">
              <span>Total Amount</span>
              <span class="total-price">\${{ cartService.totalPrice() | number:'1.2-2' }}</span>
            </div>

            <div class="security-guarantee">
              <span>🔒 100% Guaranteed Safe & Secure Checkout</span>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .checkout-page {
      padding-top: 2rem;
      padding-bottom: 5rem;
    }
    .checkout-header {
      margin-bottom: 2.5rem;
    }
    .checkout-header h1 {
      font-size: 2rem;
      font-weight: 800;
      color: var(--text-main);
      margin-bottom: 0.25rem;
    }
    .checkout-grid {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 2.5rem;
      align-items: start;
    }
    .checkout-card {
      padding: 1.75rem;
      background: #ffffff;
      margin-bottom: 2rem;
    }
    .card-header h3 {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 1.25rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border);
    }
    .saved-addresses {
      margin-bottom: 1.5rem;
    }
    .address-options {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }
    .address-radio-label {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.85rem;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .address-radio-label:hover {
      border-color: var(--primary);
      background: #f8fafc;
    }
    .address-box {
      font-size: 0.875rem;
      color: var(--text-main);
    }
    .or-divider {
      text-align: center;
      margin: 1.5rem 0 1rem 0;
      position: relative;
    }
    .or-divider::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      right: 0;
      border-top: 1px solid var(--border);
    }
    .or-divider span {
      position: relative;
      background: #ffffff;
      padding: 0 0.75rem;
      font-size: 0.8rem;
      color: var(--text-muted);
      font-weight: 600;
    }
    .payment-methods-grid {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .payment-option {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .payment-option.selected {
      border-color: var(--primary);
      background: #eff6ff;
    }
    .payment-option-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .payment-icon {
      font-size: 1.5rem;
    }
    .payment-option-content p {
      font-size: 0.8rem;
      margin: 0;
    }
    .btn-place-order {
      width: 100%;
      padding: 1rem;
      font-size: 1.1rem;
      font-weight: 700;
    }
    .order-summary-sidebar {
      background: #ffffff;
      padding: 1.75rem;
      position: sticky;
      top: 90px;
    }
    .order-summary-sidebar h3 {
      font-size: 1.2rem;
      font-weight: 700;
      margin-bottom: 1.25rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border);
    }
    .summary-items {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      max-height: 260px;
      overflow-y: auto;
      margin-bottom: 1.25rem;
    }
    .summary-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.875rem;
    }
    .summary-item-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      max-width: 70%;
    }
    .item-qty-badge {
      background: #f1f5f9;
      font-weight: 700;
      font-size: 0.75rem;
      padding: 0.15rem 0.4rem;
      border-radius: var(--radius-sm);
    }
    .summary-item-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .summary-item-price {
      font-weight: 600;
    }
    .summary-divider {
      border-top: 1px solid var(--border);
      margin: 1rem 0;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.95rem;
      margin-bottom: 0.75rem;
    }
    .total-row {
      font-size: 1.2rem;
      font-weight: 800;
    }
    .total-price {
      color: var(--primary);
    }
    .text-success {
      color: var(--success);
      font-weight: 700;
    }
    .security-guarantee {
      margin-top: 1.5rem;
      text-align: center;
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .spinner {
      display: inline-block;
      width: 1rem;
      height: 1rem;
      border: 2px solid #ffffff;
      border-radius: 50%;
      border-top-color: transparent;
      animation: spin 0.6s linear infinite;
    }
    .is-invalid {
      border-color: var(--danger);
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @media (max-width: 900px) {
      .checkout-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CheckoutComponent implements OnInit {
  cartService = inject(CartService);
  private orderService = inject(OrderService);
  private userService = inject(UserService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);

  cartLoading = signal(true);
  submitting = signal(false);
  savedAddresses = signal<AddressDto[]>([]);

  checkoutForm: FormGroup = this.fb.group({
    shippingAddress: ['', [Validators.required]],
    paymentMethod: ['CREDIT_CARD', [Validators.required]]
  });

  ngOnInit(): void {
    this.cartService.loadCart().subscribe({
      next: () => {
        this.cartLoading.set(false);
        this.loadUserAddresses();
      },
      error: () => this.cartLoading.set(false)
    });
  }

  loadUserAddresses(): void {
    this.userService.getAddresses().subscribe({
      next: (addresses) => {
        this.savedAddresses.set(addresses);
        const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
        if (defaultAddr) {
          this.onSelectSavedAddress(defaultAddr);
        }
      },
      error: () => {}
    });
  }

  onSelectSavedAddress(addr: AddressDto): void {
    const formatted = `${addr.street}, ${addr.city}, ${addr.state} ${addr.postalCode}, ${addr.country}`;
    this.checkoutForm.patchValue({ shippingAddress: formatted });
  }

  isFieldInvalid(field: string): boolean {
    const ctrl = this.checkoutForm.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  navigateToProducts(): void {
    this.router.navigate(['/products']);
  }

  onPlaceOrder(): void {
    if (this.checkoutForm.invalid || this.cartService.items().length === 0) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    const request: CheckoutRequest = {
      shippingAddress: this.checkoutForm.value.shippingAddress.trim(),
      paymentMethod: this.checkoutForm.value.paymentMethod
    };

    this.orderService.checkout(request).subscribe({
      next: (createdOrder) => {
        this.submitting.set(false);
        this.toastService.success('Order submitted! Processing payment and reservation...');
        // Refresh cart state to reflect checked-out cart
        this.cartService.loadCart().subscribe();
        // Route to confirmation / Saga stepper
        this.router.navigate(['/checkout/confirmation', createdOrder.orderNumber]);
      },
      error: (err) => {
        this.submitting.set(false);
        const msg = err.error?.message || 'Failed to place order. Please try again.';
        this.toastService.error(msg);
      }
    });
  }
}
