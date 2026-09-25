import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <div class="cart-page container">
      <div class="cart-header">
        <h1>Shopping Cart</h1>
        <p class="text-muted">Review items in your cart before checking out</p>
      </div>

      @if (!authService.isAuthenticated()) {
        <app-empty-state
          icon="🔒"
          title="Sign in to View Your Cart"
          description="Your cart is tied to your SmartCart account. Please log in to view and manage your items."
          actionLabel="Sign In Now"
          (actionClicked)="navigateToLogin()"
        ></app-empty-state>
      } @else if (loading()) {
        <app-loading-spinner message="Loading your shopping cart..."></app-loading-spinner>
      } @else if (cartService.items().length === 0) {
        <app-empty-state
          icon="🛍️"
          title="Your Cart is Empty"
          description="Looks like you haven't added any products to your cart yet."
          actionLabel="Start Shopping"
          (actionClicked)="navigateToProducts()"
        ></app-empty-state>
      } @else {
        <div class="cart-layout">
          <!-- Cart Items List -->
          <div class="cart-items-section card">
            <div class="cart-table-header">
              <span class="col-product">Product</span>
              <span class="col-price">Price</span>
              <span class="col-qty">Quantity</span>
              <span class="col-total">Subtotal</span>
              <span class="col-actions"></span>
            </div>

            <div class="cart-items-list">
              @for (item of cartService.items(); track item.sku) {
                <div class="cart-item-row">
                  <!-- Product Info -->
                  <div class="col-product item-product">
                    <div class="item-image-box">
                      @if (item.imageUrl) {
                        <img [src]="item.imageUrl" [alt]="item.productName" class="item-thumb" />
                      } @else {
                        <span class="item-placeholder">📦</span>
                      }
                    </div>
                    <div class="item-details">
                      <div class="item-name">{{ item.productName }}</div>
                      <div class="item-sku">SKU: {{ item.sku }}</div>
                    </div>
                  </div>

                  <!-- Unit Price -->
                  <div class="col-price item-price">
                    \${{ item.unitPrice | number:'1.2-2' }}
                  </div>

                  <!-- Quantity Controls -->
                  <div class="col-qty item-qty">
                    <div class="qty-btn-group">
                      <button
                        class="btn-qty-sm"
                        [disabled]="item.quantity <= 1 || updatingSku() === item.sku"
                        (click)="updateQuantity(item.sku, item.quantity - 1)"
                      >
                        -
                      </button>
                      <span class="qty-display">{{ item.quantity }}</span>
                      <button
                        class="btn-qty-sm"
                        [disabled]="updatingSku() === item.sku"
                        (click)="updateQuantity(item.sku, item.quantity + 1)"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <!-- Item Subtotal (Authoritative from Backend) -->
                  <div class="col-total item-subtotal">
                    \${{ item.subtotal | number:'1.2-2' }}
                  </div>

                  <!-- Remove Action -->
                  <div class="col-actions item-remove">
                    <button
                      class="btn-icon-danger"
                      [disabled]="updatingSku() === item.sku"
                      (click)="removeItem(item.sku)"
                      title="Remove item"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              }
            </div>

            <!-- Cart Table Footer -->
            <div class="cart-table-footer">
              <button class="btn btn-secondary btn-sm" (click)="clearCart()">
                Clear Entire Cart
              </button>
              <a routerLink="/products" class="continue-link">
                ← Continue Shopping
              </a>
            </div>
          </div>

          <!-- Order Summary Sidebar -->
          <div class="order-summary-section card">
            <h3 class="summary-title">Order Summary</h3>

            <div class="summary-row">
              <span>Items Total ({{ cartService.itemCount() }})</span>
              <span>\${{ cartService.totalPrice() | number:'1.2-2' }}</span>
            </div>

            <div class="summary-row">
              <span>Estimated Shipping</span>
              <span class="text-success">FREE</span>
            </div>

            <div class="summary-divider"></div>

            <div class="summary-row total-row">
              <span>Total</span>
              <span class="total-amount">\${{ cartService.totalPrice() | number:'1.2-2' }}</span>
            </div>

            <button class="btn btn-primary btn-checkout" (click)="proceedToCheckout()">
              Proceed to Checkout →
            </button>

            <div class="checkout-assurance">
              <span>🔒 Secure 256-Bit Encrypted Checkout</span>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .cart-page {
      padding-top: 2rem;
      padding-bottom: 5rem;
    }
    .cart-header {
      margin-bottom: 2rem;
    }
    .cart-header h1 {
      font-size: 2rem;
      font-weight: 800;
      color: var(--text-main);
      margin-bottom: 0.25rem;
    }
    .cart-layout {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 2rem;
      align-items: start;
    }
    .cart-items-section {
      background: #ffffff;
      padding: 1.5rem;
    }
    .cart-table-header {
      display: grid;
      grid-template-columns: 3fr 1fr 1.2fr 1fr 0.5fr;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid var(--border);
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
    }
    .cart-item-row {
      display: grid;
      grid-template-columns: 3fr 1fr 1.2fr 1fr 0.5fr;
      align-items: center;
      padding: 1.25rem 0;
      border-bottom: 1px solid var(--border);
    }
    .item-product {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .item-image-box {
      width: 60px;
      height: 60px;
      background: #f8fafc;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
    }
    .item-thumb {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .item-placeholder {
      font-size: 1.5rem;
    }
    .item-name {
      font-weight: 600;
      font-size: 0.95rem;
      color: var(--text-main);
      margin-bottom: 0.2rem;
    }
    .item-sku {
      font-size: 0.75rem;
      color: var(--text-light);
    }
    .item-price, .item-subtotal {
      font-weight: 600;
      font-size: 0.95rem;
    }
    .item-subtotal {
      color: var(--primary);
      font-weight: 700;
    }
    .qty-btn-group {
      display: flex;
      align-items: center;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      width: fit-content;
    }
    .btn-qty-sm {
      background: none;
      border: none;
      padding: 0.35rem 0.6rem;
      cursor: pointer;
      font-weight: 700;
    }
    .btn-qty-sm:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
    .qty-display {
      padding: 0 0.5rem;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .btn-icon-danger {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.1rem;
      padding: 0.25rem;
    }
    .cart-table-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 1.5rem;
      padding-top: 1rem;
    }
    .continue-link {
      color: var(--primary);
      font-size: 0.875rem;
      font-weight: 600;
    }
    .order-summary-section {
      background: #ffffff;
      padding: 1.75rem;
      position: sticky;
      top: 90px;
    }
    .summary-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.95rem;
      margin-bottom: 1rem;
    }
    .summary-divider {
      border-top: 1px solid var(--border);
      margin: 1.25rem 0;
    }
    .total-row {
      font-weight: 800;
      font-size: 1.2rem;
    }
    .total-amount {
      color: var(--primary);
    }
    .text-success {
      color: var(--success);
      font-weight: 700;
    }
    .btn-checkout {
      width: 100%;
      padding: 0.85rem;
      font-size: 1.05rem;
      font-weight: 600;
      margin-top: 1.5rem;
    }
    .checkout-assurance {
      margin-top: 1rem;
      text-align: center;
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    @media (max-width: 900px) {
      .cart-layout {
        grid-template-columns: 1fr;
      }
      .cart-table-header {
        display: none;
      }
      .cart-item-row {
        grid-template-columns: 1fr;
        gap: 0.75rem;
      }
    }
  `]
})
export class CartComponent implements OnInit {
  cartService = inject(CartService);
  authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  loading = signal(false);
  updatingSku = signal<string | null>(null);

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.loading.set(true);
      this.cartService.loadCart().subscribe({
        next: () => this.loading.set(false),
        error: () => this.loading.set(false)
      });
    }
  }

  navigateToLogin(): void {
    this.router.navigate(['/auth/login'], { queryParams: { returnUrl: '/cart' } });
  }

  navigateToProducts(): void {
    this.router.navigate(['/products']);
  }

  updateQuantity(sku: string, newQty: number): void {
    if (newQty < 1) return;

    this.updatingSku.set(sku);
    this.cartService.updateQuantity(sku, newQty).subscribe({
      next: () => this.updatingSku.set(null),
      error: (err) => {
        this.updatingSku.set(null);
        this.toastService.error(err.error?.message || 'Failed to update item quantity.');
      }
    });
  }

  removeItem(sku: string): void {
    this.updatingSku.set(sku);
    this.cartService.removeItem(sku).subscribe({
      next: () => {
        this.updatingSku.set(null);
        this.toastService.success('Item removed from cart');
      },
      error: (err) => {
        this.updatingSku.set(null);
        this.toastService.error(err.error?.message || 'Failed to remove item.');
      }
    });
  }

  clearCart(): void {
    this.cartService.clearCart().subscribe({
      next: () => this.toastService.info('Cart cleared'),
      error: (err) => this.toastService.error('Failed to clear cart')
    });
  }

  proceedToCheckout(): void {
    if (!this.authService.isAuthenticated()) {
      this.navigateToLogin();
      return;
    }
    // Will be routed to /checkout in Phase 4
    this.router.navigate(['/checkout']);
  }
}
