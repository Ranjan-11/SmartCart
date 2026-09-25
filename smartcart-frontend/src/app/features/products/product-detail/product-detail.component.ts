import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { InventoryService } from '../../../core/services/inventory.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ProductResponse } from '../../../core/models/product.models';
import { InventoryResponse } from '../../../core/models/inventory.models';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LoadingSpinnerComponent],
  template: `
    <div class="product-detail-page container">
      @if (loading()) {
        <app-loading-spinner message="Loading product details..."></app-loading-spinner>
      } @else if (errorMessage()) {
        <div class="alert alert-danger">{{ errorMessage() }}</div>
      } @else if (product()) {
        <!-- Breadcrumb -->
        <nav class="breadcrumb">
          <a routerLink="/">Home</a> &gt;
          <a routerLink="/products">Products</a> &gt;
          <a [routerLink]="['/products']" [queryParams]="{ category: product()?.categoryName }">
            {{ product()?.categoryName }}
          </a> &gt;
          <span>{{ product()?.name }}</span>
        </nav>

        <div class="product-main-grid">
          <!-- Image Section -->
          <div class="image-gallery card">
            @if (product()?.imageUrl) {
              <img [src]="product()?.imageUrl" [alt]="product()?.name" class="main-image" />
            } @else {
              <div class="detail-placeholder">
                <span>📦</span>
              </div>
            }
          </div>

          <!-- Product Details Section -->
          <div class="product-summary">
            <span class="category-pill">{{ product()?.categoryName }}</span>
            <h1 class="product-title">{{ product()?.name }}</h1>
            <p class="sku-label">SKU: <strong>{{ product()?.sku }}</strong></p>

            <!-- Price -->
            <div class="price-container">
              <span class="price">\${{ product()?.price | number:'1.2-2' }}</span>
            </div>

            <!-- Authoritative Inventory Stock Indicator -->
            <div class="stock-status-box">
              @if (inventoryLoading()) {
                <span class="text-muted">Checking stock availability...</span>
              } @else if (stockQuantity() === 0) {
                <span class="badge badge-danger">Out of Stock</span>
                <p class="stock-subtext">This item is currently unavailable.</p>
              } @else if (stockQuantity() != null && stockQuantity()! <= 5) {
                <span class="badge badge-warning">Only {{ stockQuantity() }} left in stock!</span>
                <p class="stock-subtext">Order soon before inventory runs out.</p>
              } @else {
                <span class="badge badge-success">In Stock</span>
                <p class="stock-subtext">Ready for fast fulfillment & dispatch.</p>
              }
            </div>

            <!-- Description -->
            <div class="product-description">
              <h3>Description</h3>
              <p>{{ product()?.description || 'No detailed description available.' }}</p>
            </div>

            <!-- Action / Cart Section -->
            <div class="action-box card">
              <div class="quantity-selector">
                <label for="qtyInput">Quantity:</label>
                <div class="qty-controls">
                  <button
                    class="btn btn-secondary btn-qty"
                    [disabled]="quantity <= 1 || isOutOfStock()"
                    (click)="decrementQty()"
                  >
                    -
                  </button>
                  <input
                    id="qtyInput"
                    type="number"
                    class="form-control qty-input"
                    [(ngModel)]="quantity"
                    [min]="1"
                    [max]="stockQuantity() || 99"
                    [disabled]="isOutOfStock()"
                  />
                  <button
                    class="btn btn-secondary btn-qty"
                    [disabled]="isOutOfStock() || (stockQuantity() != null && quantity >= stockQuantity()!)"
                    (click)="incrementQty()"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                class="btn btn-primary btn-add-cart"
                [disabled]="adding() || isOutOfStock()"
                (click)="onAddToCart()"
              >
                @if (adding()) {
                  <span class="spinner-sm"></span> Adding to Cart...
                } @else if (isOutOfStock()) {
                  Out of Stock
                } @else {
                  🛍️ Add to Cart
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .product-detail-page {
      padding-top: 2rem;
      padding-bottom: 5rem;
    }
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 2rem;
    }
    .breadcrumb a {
      color: var(--text-muted);
    }
    .breadcrumb a:hover {
      color: var(--primary);
    }
    .product-main-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3.5rem;
      align-items: start;
    }
    .image-gallery {
      height: 480px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8fafc;
      overflow: hidden;
    }
    .main-image {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .detail-placeholder {
      font-size: 6rem;
      opacity: 0.3;
    }
    .category-pill {
      display: inline-block;
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--primary);
      text-transform: uppercase;
      margin-bottom: 0.5rem;
    }
    .product-title {
      font-size: 2rem;
      font-weight: 800;
      line-height: 1.3;
      margin-bottom: 0.5rem;
    }
    .sku-label {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 1.5rem;
    }
    .price-container {
      margin-bottom: 1.5rem;
    }
    .price {
      font-size: 2rem;
      font-weight: 800;
      color: var(--text-main);
    }
    .stock-status-box {
      margin-bottom: 1.75rem;
    }
    .stock-subtext {
      font-size: 0.825rem;
      color: var(--text-muted);
      margin-top: 0.35rem;
    }
    .product-description {
      margin-bottom: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border);
    }
    .product-description h3 {
      font-size: 1.1rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
    }
    .product-description p {
      color: var(--text-muted);
      line-height: 1.6;
    }
    .action-box {
      padding: 1.75rem;
      background: #ffffff;
    }
    .quantity-selector {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .qty-controls {
      display: flex;
      align-items: center;
    }
    .btn-qty {
      padding: 0.5rem 0.85rem;
      font-weight: 700;
      border-radius: 0;
    }
    .btn-qty:first-child {
      border-top-left-radius: var(--radius-sm);
      border-bottom-left-radius: var(--radius-sm);
    }
    .btn-qty:last-child {
      border-top-right-radius: var(--radius-sm);
      border-bottom-right-radius: var(--radius-sm);
    }
    .qty-input {
      width: 60px;
      text-align: center;
      border-radius: 0;
      border-left: none;
      border-right: none;
    }
    .btn-add-cart {
      width: 100%;
      padding: 0.85rem;
      font-size: 1.05rem;
      font-weight: 600;
    }
    .spinner-sm {
      display: inline-block;
      width: 1rem;
      height: 1rem;
      border: 2px solid #ffffff;
      border-radius: 50%;
      border-top-color: transparent;
      animation: spin 0.6s linear infinite;
    }
    .alert {
      padding: 1rem;
      border-radius: var(--radius-sm);
    }
    .alert-danger {
      background: var(--danger-light);
      color: var(--danger);
      border: 1px solid #fecaca;
    }
    @media (max-width: 900px) {
      .product-main-grid {
        grid-template-columns: 1fr;
        gap: 2rem;
      }
      .image-gallery {
        height: 320px;
      }
    }
  `]
})
export class ProductDetailComponent implements OnInit {
  private productService = inject(ProductService);
  private inventoryService = inject(InventoryService);
  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  product = signal<ProductResponse | null>(null);
  stockQuantity = signal<number | null>(null);
  loading = signal(true);
  inventoryLoading = signal(true);
  errorMessage = signal<string | null>(null);
  adding = signal(false);
  quantity = 1;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.errorMessage.set('Invalid product ID');
      this.loading.set(false);
      return;
    }

    const productId = Number(idParam);
    this.productService.getProductById(productId).subscribe({
      next: (prod) => {
        this.product.set(prod);
        this.loading.set(false);
        this.checkAuthoritativeStock(prod.sku);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Product not found.');
      }
    });
  }

  checkAuthoritativeStock(sku: string): void {
    this.inventoryLoading.set(true);
    this.inventoryService.getInventoryBySku(sku).subscribe({
      next: (inv: InventoryResponse) => {
        this.stockQuantity.set(inv.availableQuantity);
        this.inventoryLoading.set(false);
      },
      error: () => {
        // Fallback to product's catalog stock if inventory check fails
        this.stockQuantity.set(this.product()?.stockQuantity ?? 0);
        this.inventoryLoading.set(false);
      }
    });
  }

  isOutOfStock(): boolean {
    return this.stockQuantity() === 0;
  }

  incrementQty(): void {
    if (this.stockQuantity() == null || this.quantity < this.stockQuantity()!) {
      this.quantity++;
    }
  }

  decrementQty(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  onAddToCart(): void {
    const prod = this.product();
    if (!prod) return;

    if (!this.authService.isAuthenticated()) {
      this.toastService.info('Please sign in to add items to your cart');
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: `/products/${prod.id}` }
      });
      return;
    }

    this.adding.set(true);
    this.cartService.addItem(prod.sku, this.quantity).subscribe({
      next: () => {
        this.adding.set(false);
        this.toastService.success(`Added ${this.quantity} item(s) to your cart!`);
      },
      error: (err) => {
        this.adding.set(false);
        const msg = err.error?.message || 'Could not add item to cart.';
        this.toastService.error(msg);
      }
    });
  }
}
