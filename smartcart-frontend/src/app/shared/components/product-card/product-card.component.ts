import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProductResponse } from '../../../core/models/product.models';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="product-card card">
      <!-- Product Image & Badges -->
      <a [routerLink]="['/products', product.id]" class="product-image-link">
        <div class="product-image-container">
          @if (product.imageUrl) {
            <img [src]="product.imageUrl" [alt]="product.name" class="product-image" loading="lazy" />
          } @else {
            <div class="product-placeholder">
              <span>📦</span>
            </div>
          }

          <div class="badge-overlay">
            @if (product.stockQuantity === 0) {
              <span class="badge badge-danger">Out of Stock</span>
            } @else if (product.stockQuantity != null && product.stockQuantity <= 5) {
              <span class="badge badge-warning">Only {{ product.stockQuantity }} left</span>
            } @else {
              <span class="badge badge-success">In Stock</span>
            }
          </div>
        </div>
      </a>

      <!-- Product Content -->
      <div class="product-info">
        <span class="product-category">{{ product.categoryName || 'General' }}</span>
        <h3 class="product-title">
          <a [routerLink]="['/products', product.id]">{{ product.name }}</a>
        </h3>
        <p class="product-sku">SKU: {{ product.sku }}</p>

        <div class="product-bottom">
          <div class="product-price">
            \${{ product.price | number:'1.2-2' }}
          </div>

          <button
            class="btn btn-primary btn-sm"
            [disabled]="adding() || product.stockQuantity === 0"
            (click)="onAddToCart($event)"
          >
            @if (adding()) {
              <span class="spinner-sm"></span>
            } @else {
              Add to Cart
            }
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .product-card {
      display: flex;
      flex-direction: column;
      height: 100%;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .product-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
    }
    .product-image-container {
      position: relative;
      width: 100%;
      height: 220px;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .product-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    .product-card:hover .product-image {
      transform: scale(1.05);
    }
    .product-placeholder {
      font-size: 3.5rem;
      opacity: 0.4;
    }
    .badge-overlay {
      position: absolute;
      top: 0.75rem;
      left: 0.75rem;
    }
    .product-info {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .product-category {
      font-size: 0.75rem;
      text-transform: uppercase;
      font-weight: 600;
      color: var(--primary);
      margin-bottom: 0.35rem;
    }
    .product-title {
      font-size: 1rem;
      font-weight: 600;
      line-height: 1.4;
      margin-bottom: 0.25rem;
    }
    .product-title a:hover {
      color: var(--primary);
    }
    .product-sku {
      font-size: 0.75rem;
      color: var(--text-light);
      margin-bottom: 1rem;
    }
    .product-bottom {
      margin-top: auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }
    .product-price {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-main);
    }
    .btn-sm {
      padding: 0.45rem 0.9rem;
      font-size: 0.85rem;
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
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class ProductCardComponent {
  @Input({ required: true }) product!: ProductResponse;

  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  adding = signal(false);

  onAddToCart(event: Event): void {
    event.stopPropagation();

    if (!this.authService.isAuthenticated()) {
      this.toastService.info('Please sign in to add items to your cart');
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: `/products/${this.product.id}` }
      });
      return;
    }

    this.adding.set(true);
    this.cartService.addItem(this.product.sku, 1).subscribe({
      next: () => {
        this.adding.set(false);
        this.toastService.success(`Added "${this.product.name}" to cart!`);
      },
      error: (err) => {
        this.adding.set(false);
        const msg = err.error?.message || 'Could not add item to cart.';
        this.toastService.error(msg);
      }
    });
  }
}
