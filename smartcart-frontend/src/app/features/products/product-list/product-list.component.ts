import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { CategoryResponse, ProductFilterParams, ProductResponse } from '../../../core/models/product.models';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ProductCardComponent,
    PaginationComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="catalog-page container">
      <!-- Breadcrumb & Header -->
      <div class="catalog-header">
        <h1>Product Catalog</h1>
        <p class="text-muted">Browse our entire inventory of quality products</p>
      </div>

      <div class="catalog-layout">
        <!-- Filter Sidebar -->
        <aside class="filter-sidebar card">
          <div class="filter-header">
            <h3>Filters</h3>
            <button class="btn-clear" (click)="clearFilters()">Reset All</button>
          </div>

          <!-- Keyword Search -->
          <div class="filter-group">
            <label class="filter-label">Search</label>
            <input
              type="text"
              class="form-control"
              placeholder="Product name or SKU..."
              [(ngModel)]="keyword"
              (keyup.enter)="applyFilters()"
            />
          </div>

          <!-- Category Filter -->
          <div class="filter-group">
            <label class="filter-label">Category</label>
            <select class="form-control" [(ngModel)]="selectedCategory" (change)="applyFilters()">
              <option value="">All Categories</option>
              @for (cat of categories(); track cat.id) {
                <option [value]="cat.name">{{ cat.name }}</option>
              }
            </select>
          </div>

          <!-- Price Range -->
          <div class="filter-group">
            <label class="filter-label">Price Range (\$) </label>
            <div class="price-inputs">
              <input
                type="number"
                class="form-control"
                placeholder="Min"
                [(ngModel)]="minPrice"
                min="0"
              />
              <span>—</span>
              <input
                type="number"
                class="form-control"
                placeholder="Max"
                [(ngModel)]="maxPrice"
                min="0"
              />
            </div>
          </div>

          <!-- Apply Filter Button -->
          <button class="btn btn-primary w-full" (click)="applyFilters()">
            Apply Filters
          </button>
        </aside>

        <!-- Product Grid & Toolbar -->
        <main class="catalog-main">
          <!-- Toolbar -->
          <div class="catalog-toolbar">
            <div class="results-count">
              Showing <strong>{{ totalElements() }}</strong> products
            </div>

            <div class="sort-control">
              <label for="sortSelect">Sort by:</label>
              <select id="sortSelect" class="form-control select-sm" [(ngModel)]="sortOption" (change)="onSortChange()">
                <option value="id-desc">Newest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
              </select>
            </div>
          </div>

          <!-- Content Grid / Loading / Empty State -->
          @if (loading()) {
            <app-loading-spinner message="Loading products..."></app-loading-spinner>
          } @else if (errorMessage()) {
            <div class="alert alert-danger">{{ errorMessage() }}</div>
          } @else if (products().length === 0) {
            <app-empty-state
              icon="🛍️"
              title="No Products Found"
              description="Try adjusting your search criteria or clearing filters to see more results."
              actionLabel="Reset Filters"
              (actionClicked)="clearFilters()"
            ></app-empty-state>
          } @else {
            <div class="products-grid">
              @for (product of products(); track product.id) {
                <app-product-card [product]="product"></app-product-card>
              }
            </div>

            <app-pagination
              [pageNumber]="currentPage()"
              [totalPages]="totalPages()"
              [totalElements]="totalElements()"
              (pageChange)="onPageChange($event)"
            ></app-pagination>
          }
        </main>
      </div>
    </div>
  `,
  styles: [`
    .catalog-page {
      padding-top: 2rem;
      padding-bottom: 4rem;
    }
    .catalog-header {
      margin-bottom: 2rem;
    }
    .catalog-header h1 {
      font-size: 2rem;
      font-weight: 800;
      color: var(--text-main);
      margin-bottom: 0.25rem;
    }
    .catalog-layout {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 2rem;
      align-items: start;
    }
    .filter-sidebar {
      padding: 1.5rem;
      background: #ffffff;
      position: sticky;
      top: 90px;
    }
    .filter-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border);
    }
    .filter-header h3 {
      font-size: 1.1rem;
      font-weight: 700;
    }
    .btn-clear {
      background: none;
      border: none;
      color: var(--primary);
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-clear:hover {
      text-decoration: underline;
    }
    .filter-group {
      margin-bottom: 1.25rem;
    }
    .filter-label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-main);
      margin-bottom: 0.4rem;
    }
    .price-inputs {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .w-full {
      width: 100%;
      margin-top: 0.5rem;
    }
    .catalog-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border);
    }
    .results-count {
      font-size: 0.9rem;
      color: var(--text-muted);
    }
    .sort-control {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
    }
    .select-sm {
      padding: 0.4rem 0.75rem;
      width: auto;
    }
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1.75rem;
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
      .catalog-layout {
        grid-template-columns: 1fr;
      }
      .filter-sidebar {
        position: static;
      }
    }
  `]
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  categories = signal<CategoryResponse[]>([]);
  products = signal<ProductResponse[]>([]);
  loading = signal(true);
  errorMessage = signal<string | null>(null);

  currentPage = signal(0);
  totalPages = signal(1);
  totalElements = signal(0);
  pageSize = 12;

  keyword = '';
  selectedCategory = '';
  minPrice?: number;
  maxPrice?: number;
  sortOption = 'id-desc';

  ngOnInit(): void {
    this.productService.getAllCategories().subscribe({
      next: (cats) => this.categories.set(cats),
      error: () => {}
    });

    this.route.queryParams.subscribe(params => {
      this.keyword = params['keyword'] || '';
      this.selectedCategory = params['category'] || '';
      this.minPrice = params['minPrice'] ? Number(params['minPrice']) : undefined;
      this.maxPrice = params['maxPrice'] ? Number(params['maxPrice']) : undefined;
      const page = params['page'] ? Number(params['page']) : 0;
      this.currentPage.set(page);

      if (params['sortBy'] && params['sortDir']) {
        this.sortOption = `${params['sortBy']}-${params['sortDir']}`;
      }

      this.fetchProducts();
    });
  }

  fetchProducts(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    const [sortBy, sortDir] = this.sortOption.split('-');

    const params: ProductFilterParams = {
      keyword: this.keyword || undefined,
      category: this.selectedCategory || undefined,
      minPrice: this.minPrice,
      maxPrice: this.maxPrice,
      page: this.currentPage(),
      size: this.pageSize,
      sortBy: sortBy || 'id',
      sortDir: (sortDir as 'asc' | 'desc') || 'desc',
      active: true
    };

    this.productService.getAllProducts(params).subscribe({
      next: (pageData) => {
        this.products.set(pageData.content);
        this.currentPage.set(pageData.pageNumber);
        this.totalPages.set(pageData.totalPages);
        this.totalElements.set(pageData.totalElements);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to load products. Please try again later.');
      }
    });
  }

  applyFilters(): void {
    this.currentPage.set(0);
    this.updateUrlParams();
  }

  onSortChange(): void {
    this.updateUrlParams();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.updateUrlParams();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  clearFilters(): void {
    this.keyword = '';
    this.selectedCategory = '';
    this.minPrice = undefined;
    this.maxPrice = undefined;
    this.sortOption = 'id-desc';
    this.currentPage.set(0);
    this.updateUrlParams();
  }

  private updateUrlParams(): void {
    const [sortBy, sortDir] = this.sortOption.split('-');
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        keyword: this.keyword || null,
        category: this.selectedCategory || null,
        minPrice: this.minPrice || null,
        maxPrice: this.maxPrice || null,
        sortBy,
        sortDir,
        page: this.currentPage()
      },
      queryParamsHandling: 'merge'
    });
  }
}
