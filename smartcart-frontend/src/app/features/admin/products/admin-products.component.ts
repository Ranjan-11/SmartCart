import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { ToastService } from '../../../core/services/toast.service';
import { CategoryResponse, ProductRequest, ProductResponse } from '../../../core/models/product.models';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginationComponent, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <div>
          <h1>Product Management</h1>
          <p class="text-muted">Create, edit, search and manage your product catalog</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">
          + Add Product
        </button>
      </div>

      <!-- Filter / Search Bar -->
      <div class="card filter-card">
        <div class="filter-controls">
          <input
            type="text"
            class="form-control"
            placeholder="Search by name or SKU..."
            [(ngModel)]="searchKeyword"
            (keyup.enter)="onSearch()"
          />
          <button class="btn btn-secondary" (click)="onSearch()">Search</button>
          @if (searchKeyword) {
            <button class="btn btn-secondary" (click)="clearSearch()">Clear</button>
          }
        </div>
      </div>

      <!-- Products Table -->
      @if (loading()) {
        <app-loading-spinner message="Loading catalog products..."></app-loading-spinner>
      } @else if (products().length === 0) {
        <app-empty-state
          icon="📦"
          title="No Products Found"
          description="Get started by adding your first product to the catalog."
          actionLabel="+ Add Product"
          (actionClicked)="openCreateModal()"
        ></app-empty-state>
      } @else {
        <div class="card table-card">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (prod of products(); track prod.id) {
                <tr>
                  <td>
                    <div class="prod-cell">
                      <span class="prod-thumb">📦</span>
                      <strong>{{ prod.name }}</strong>
                    </div>
                  </td>
                  <td><code>{{ prod.sku }}</code></td>
                  <td>{{ prod.categoryName }}</td>
                  <td><strong>\${{ prod.price | number:'1.2-2' }}</strong></td>
                  <td>{{ prod.stockQuantity }}</td>
                  <td>
                    @if (prod.active) {
                      <span class="badge badge-success">Active</span>
                    } @else {
                      <span class="badge badge-danger">Inactive</span>
                    }
                  </td>
                  <td class="text-right actions-cell">
                    <button class="btn btn-secondary btn-xs" (click)="openEditModal(prod)">
                      Edit
                    </button>
                    <button class="btn btn-danger btn-xs" (click)="openDeleteModal(prod)">
                      Delete
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <app-pagination
          [pageNumber]="currentPage()"
          [totalPages]="totalPages()"
          [totalElements]="totalElements()"
          (pageChange)="onPageChange($event)"
        ></app-pagination>
      }

      <!-- Create / Edit Product Modal -->
      @if (showProductModal()) {
        <div class="modal-backdrop">
          <div class="modal-card card">
            <div class="modal-header">
              <h3>{{ editingProduct() ? 'Edit Product' : 'Add New Product' }}</h3>
              <button class="modal-close" (click)="closeProductModal()">&times;</button>
            </div>

            <form [formGroup]="productForm" (ngSubmit)="onSubmitProduct()">
              <div class="modal-body">
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label" for="sku">SKU *</label>
                    <input
                      id="sku"
                      type="text"
                      class="form-control"
                      formControlName="sku"
                      placeholder="e.g. SKU-PROD-001"
                      [readonly]="!!editingProduct()"
                    />
                  </div>

                  <div class="form-group">
                    <label class="form-label" for="name">Product Name *</label>
                    <input
                      id="name"
                      type="text"
                      class="form-control"
                      formControlName="name"
                      placeholder="e.g. Wireless Noise-Cancelling Headphones"
                    />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label" for="categoryId">Category *</label>
                  <select id="categoryId" class="form-control" formControlName="categoryId">
                    <option value="">Select Category</option>
                    @for (cat of categories(); track cat.id) {
                      <option [value]="cat.id">{{ cat.name }}</option>
                    }
                  </select>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label" for="price">Price (\$) *</label>
                    <input
                      id="price"
                      type="number"
                      class="form-control"
                      formControlName="price"
                      min="0.01"
                      step="0.01"
                      placeholder="99.99"
                    />
                  </div>

                  <div class="form-group">
                    <label class="form-label" for="stockQuantity">Display Stock Quantity</label>
                    <input
                      id="stockQuantity"
                      type="number"
                      class="form-control"
                      formControlName="stockQuantity"
                      min="0"
                      placeholder="100"
                    />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label" for="imageUrl">Image URL</label>
                  <input
                    id="imageUrl"
                    type="url"
                    class="form-control"
                    formControlName="imageUrl"
                    placeholder="https://example.com/product.jpg"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label" for="description">Description</label>
                  <textarea
                    id="description"
                    class="form-control"
                    rows="3"
                    formControlName="description"
                    placeholder="Detailed product features and specifications"
                  ></textarea>
                </div>

                <div class="form-check">
                  <label class="checkbox-label">
                    <input type="checkbox" formControlName="active" />
                    <span>Product is Active and available for sale</span>
                  </label>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeProductModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="submitting() || productForm.invalid">
                  @if (submitting()) { <span class="spinner-sm"></span> Saving... }
                  @else { Save Product }
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Delete Confirmation Modal -->
      @if (deletingProduct()) {
        <div class="modal-backdrop">
          <div class="modal-card card">
            <div class="modal-header">
              <h3>Delete Product</h3>
              <button class="modal-close" (click)="deletingProduct.set(null)">&times;</button>
            </div>
            <div class="modal-body">
              <p>Are you sure you want to delete <strong>{{ deletingProduct()?.name }}</strong> (SKU: {{ deletingProduct()?.sku }})? This action cannot be undone.</p>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="deletingProduct.set(null)">Cancel</button>
              <button class="btn btn-danger" [disabled]="submitting()" (click)="confirmDeleteProduct()">
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .page-header h1 {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--text-main);
      margin-bottom: 0.25rem;
    }
    .filter-card {
      padding: 1rem 1.25rem;
      background: #ffffff;
    }
    .filter-controls {
      display: flex;
      gap: 0.75rem;
      max-width: 450px;
    }
    .table-card {
      background: #ffffff;
      padding: 1.5rem;
      overflow-x: auto;
    }
    .admin-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }
    .admin-table th {
      text-align: left;
      padding: 0.75rem;
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      border-bottom: 2px solid var(--border);
    }
    .admin-table td {
      padding: 0.85rem 0.75rem;
      border-bottom: 1px solid var(--border);
      vertical-align: middle;
    }
    .prod-cell {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .prod-thumb {
      font-size: 1.2rem;
    }
    .actions-cell {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
    .text-right { text-align: right; }
    .btn-xs {
      padding: 0.3rem 0.6rem;
      font-size: 0.75rem;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .form-check {
      margin-top: 0.5rem;
    }
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      cursor: pointer;
    }
    /* Modal */
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 1.5rem;
    }
    .modal-card {
      width: 100%;
      max-width: 580px;
      padding: 2rem;
      background: #ffffff;
      max-height: 90vh;
      overflow-y: auto;
    }
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border);
    }
    .modal-header h3 { font-size: 1.25rem; font-weight: 700; }
    .modal-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted); }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
    .spinner-sm {
      display: inline-block; width: 0.85rem; height: 0.85rem;
      border: 2px solid #ffffff; border-radius: 50%; border-top-color: transparent;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class AdminProductsComponent implements OnInit {
  private productService = inject(ProductService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  products = signal<ProductResponse[]>([]);
  categories = signal<CategoryResponse[]>([]);
  loading = signal(true);
  submitting = signal(false);

  currentPage = signal(0);
  totalPages = signal(1);
  totalElements = signal(0);
  searchKeyword = '';

  showProductModal = signal(false);
  editingProduct = signal<ProductResponse | null>(null);
  deletingProduct = signal<ProductResponse | null>(null);

  productForm: FormGroup = this.fb.group({
    sku: ['', [Validators.required]],
    name: ['', [Validators.required]],
    categoryId: ['', [Validators.required]],
    price: [0, [Validators.required, Validators.min(0.01)]],
    stockQuantity: [0, [Validators.min(0)]],
    imageUrl: [''],
    description: [''],
    active: [true]
  });

  ngOnInit(): void {
    this.productService.getAllCategories().subscribe({
      next: (cats) => this.categories.set(cats),
      error: () => {}
    });
    this.fetchProducts();
  }

  fetchProducts(): void {
    this.loading.set(true);
    this.productService.getAllProducts({
      page: this.currentPage(),
      size: 10,
      keyword: this.searchKeyword || undefined
    }).subscribe({
      next: (page) => {
        this.products.set(page.content);
        this.currentPage.set(page.pageNumber);
        this.totalPages.set(page.totalPages);
        this.totalElements.set(page.totalElements);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toastService.error(err.error?.message || 'Failed to load products');
      }
    });
  }

  onSearch(): void {
    this.currentPage.set(0);
    this.fetchProducts();
  }

  clearSearch(): void {
    this.searchKeyword = '';
    this.currentPage.set(0);
    this.fetchProducts();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.fetchProducts();
  }

  openCreateModal(): void {
    this.editingProduct.set(null);
    this.productForm.reset({
      sku: '',
      name: '',
      categoryId: '',
      price: 0,
      stockQuantity: 0,
      imageUrl: '',
      description: '',
      active: true
    });
    this.showProductModal.set(true);
  }

  openEditModal(product: ProductResponse): void {
    this.editingProduct.set(product);
    this.productForm.patchValue({
      sku: product.sku,
      name: product.name,
      categoryId: product.categoryId,
      price: product.price,
      stockQuantity: product.stockQuantity,
      imageUrl: product.imageUrl || '',
      description: product.description || '',
      active: product.active
    });
    this.showProductModal.set(true);
  }

  closeProductModal(): void {
    this.showProductModal.set(false);
    this.editingProduct.set(null);
  }

  onSubmitProduct(): void {
    if (this.productForm.invalid) return;

    this.submitting.set(true);
    const formVal = this.productForm.value;
    const req: ProductRequest = {
      sku: formVal.sku,
      name: formVal.name,
      categoryId: Number(formVal.categoryId),
      price: formVal.price,
      stockQuantity: formVal.stockQuantity,
      imageUrl: formVal.imageUrl || undefined,
      description: formVal.description || undefined,
      active: formVal.active
    };

    const editing = this.editingProduct();
    const action$ = editing
      ? this.productService.updateProduct(editing.id, req)
      : this.productService.createProduct(req);

    action$.subscribe({
      next: () => {
        this.submitting.set(false);
        this.toastService.success(`Product ${editing ? 'updated' : 'created'} successfully`);
        this.closeProductModal();
        this.fetchProducts();
      },
      error: (err) => {
        this.submitting.set(false);
        this.toastService.error(err.error?.message || 'Failed to save product');
      }
    });
  }

  openDeleteModal(product: ProductResponse): void {
    this.deletingProduct.set(product);
  }

  confirmDeleteProduct(): void {
    const prod = this.deletingProduct();
    if (!prod) return;

    this.submitting.set(true);
    this.productService.deleteProduct(prod.id).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toastService.success(`Product "${prod.name}" deleted`);
        this.deletingProduct.set(null);
        this.fetchProducts();
      },
      error: (err) => {
        this.submitting.set(false);
        this.toastService.error(err.error?.message || 'Failed to delete product');
      }
    });
  }
}
