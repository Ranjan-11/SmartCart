import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CategoryResponse, ProductResponse } from '../../core/models/product.models';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent, LoadingSpinnerComponent],
  template: `
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="container hero-container">
        <div class="hero-content">
          <span class="hero-badge">⚡ Cloud Microservices Architecture</span>
          <h1 class="hero-title">Experience Fast, Reliable E-Commerce Shopping</h1>
          <p class="hero-subtitle">
            Explore thousands of quality products powered by distributed Saga choreography and real-time inventory management.
          </p>
          <div class="hero-actions">
            <a routerLink="/products" class="btn btn-primary btn-lg">Browse Products</a>
            <a routerLink="/cart" class="btn btn-secondary btn-lg">View Cart</a>
          </div>
        </div>
      </div>
    </section>

    <!-- Categories Highlights -->
    @if (categories().length > 0) {
      <section class="categories-section container">
        <div class="section-header">
          <h2>Shop by Category</h2>
          <p>Discover top-rated products tailored to your needs</p>
        </div>

        <div class="category-grid">
          @for (cat of categories(); track cat.id) {
            <a [routerLink]="['/products']" [queryParams]="{ category: cat.name }" class="category-card card">
              <div class="category-icon">📁</div>
              <h3 class="category-name">{{ cat.name }}</h3>
              <p class="category-desc">{{ cat.description || 'Explore products' }}</p>
            </a>
          }
        </div>
      </section>
    }

    <!-- Featured Products -->
    <section class="featured-section container">
      <div class="section-header">
        <h2>Featured Products</h2>
        <p>Hand-picked top quality merchandise with guaranteed fast fulfillment</p>
      </div>

      @if (loading()) {
        <app-loading-spinner message="Loading featured products..."></app-loading-spinner>
      } @else {
        <div class="products-grid">
          @for (product of featuredProducts(); track product.id) {
            <app-product-card [product]="product"></app-product-card>
          }
        </div>

        <div class="view-all-container">
          <a routerLink="/products" class="btn btn-secondary btn-lg">View All Products →</a>
        </div>
      }
    </section>
  `,
  styles: [`
    .hero-section {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      color: #ffffff;
      padding: 5rem 0;
      margin-bottom: 3.5rem;
    }
    .hero-container {
      display: flex;
      align-items: center;
    }
    .hero-content {
      max-width: 680px;
    }
    .hero-badge {
      display: inline-block;
      padding: 0.35rem 0.85rem;
      background: rgba(37, 99, 235, 0.2);
      border: 1px solid rgba(37, 99, 235, 0.4);
      color: #60a5fa;
      border-radius: var(--radius-full);
      font-size: 0.8rem;
      font-weight: 600;
      margin-bottom: 1.25rem;
    }
    .hero-title {
      font-size: 2.75rem;
      font-weight: 800;
      line-height: 1.2;
      margin-bottom: 1.25rem;
    }
    .hero-subtitle {
      font-size: 1.125rem;
      color: #94a3b8;
      line-height: 1.6;
      margin-bottom: 2rem;
    }
    .hero-actions {
      display: flex;
      gap: 1rem;
    }
    .btn-lg {
      padding: 0.75rem 1.75rem;
      font-size: 1rem;
    }
    .section-header {
      text-align: center;
      margin-bottom: 2.5rem;
    }
    .section-header h2 {
      font-size: 1.875rem;
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 0.5rem;
    }
    .section-header p {
      color: var(--text-muted);
      font-size: 1rem;
    }
    .categories-section {
      margin-bottom: 4rem;
    }
    .category-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1.5rem;
    }
    .category-card {
      padding: 1.5rem;
      text-align: center;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .category-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-md);
      border-color: var(--primary);
    }
    .category-icon {
      font-size: 2.5rem;
      margin-bottom: 0.75rem;
    }
    .category-name {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-main);
      margin-bottom: 0.25rem;
    }
    .category-desc {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .featured-section {
      margin-bottom: 5rem;
    }
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1.75rem;
      margin-bottom: 2.5rem;
    }
    .view-all-container {
      text-align: center;
    }
    @media (max-width: 768px) {
      .hero-title {
        font-size: 2rem;
      }
      .hero-subtitle {
        font-size: 1rem;
      }
    }
  `]
})
export class HomeComponent implements OnInit {
  private productService = inject(ProductService);

  categories = signal<CategoryResponse[]>([]);
  featuredProducts = signal<ProductResponse[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.productService.getAllCategories().subscribe({
      next: (cats) => this.categories.set(cats),
      error: () => {}
    });

    this.productService.getAllProducts({ size: 8, sortBy: 'id', sortDir: 'desc' }).subscribe({
      next: (page) => {
        this.featuredProducts.set(page.content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
