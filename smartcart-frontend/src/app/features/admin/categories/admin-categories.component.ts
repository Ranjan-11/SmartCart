import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { ToastService } from '../../../core/services/toast.service';
import { CategoryRequest, CategoryResponse } from '../../../core/models/product.models';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <div>
          <h1>Category Management</h1>
          <p class="text-muted">Organize catalog navigation and product classifications</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">
          + Add Category
        </button>
      </div>

      @if (loading()) {
        <app-loading-spinner message="Loading categories..."></app-loading-spinner>
      } @else if (categories().length === 0) {
        <app-empty-state
          icon="📁"
          title="No Categories Available"
          description="Create categories to help shoppers explore your catalog."
          actionLabel="+ Add Category"
          (actionClicked)="openCreateModal()"
        ></app-empty-state>
      } @else {
        <div class="card table-card">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Slug</th>
                <th>Description</th>
                <th>Created</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (cat of categories(); track cat.id) {
                <tr>
                  <td><strong>{{ cat.name }}</strong></td>
                  <td><code>{{ cat.slug }}</code></td>
                  <td>{{ cat.description || '—' }}</td>
                  <td>{{ cat.createdAt | date:'mediumDate' }}</td>
                  <td class="text-right actions-cell">
                    <button class="btn btn-secondary btn-xs" (click)="openEditModal(cat)">
                      Edit
                    </button>
                    <button class="btn btn-danger btn-xs" (click)="openDeleteModal(cat)">
                      Delete
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Modal -->
      @if (showCategoryModal()) {
        <div class="modal-backdrop">
          <div class="modal-card card">
            <div class="modal-header">
              <h3>{{ editingCategory() ? 'Edit Category' : 'Add New Category' }}</h3>
              <button class="modal-close" (click)="closeCategoryModal()">&times;</button>
            </div>

            <form [formGroup]="categoryForm" (ngSubmit)="onSubmitCategory()">
              <div class="modal-body">
                <div class="form-group">
                  <label class="form-label" for="catName">Category Name *</label>
                  <input
                    id="catName"
                    type="text"
                    class="form-control"
                    formControlName="name"
                    placeholder="e.g. Electronics, Home & Kitchen"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label" for="catSlug">URL Slug (Optional)</label>
                  <input
                    id="catSlug"
                    type="text"
                    class="form-control"
                    formControlName="slug"
                    placeholder="e.g. electronics (auto-generated if empty)"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label" for="catDesc">Description</label>
                  <textarea
                    id="catDesc"
                    class="form-control"
                    rows="3"
                    formControlName="description"
                    placeholder="Category overview"
                  ></textarea>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeCategoryModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="submitting() || categoryForm.invalid">
                  @if (submitting()) { <span class="spinner-sm"></span> Saving... }
                  @else { Save Category }
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Delete Modal -->
      @if (deletingCategory()) {
        <div class="modal-backdrop">
          <div class="modal-card card">
            <div class="modal-header">
              <h3>Delete Category</h3>
              <button class="modal-close" (click)="deletingCategory.set(null)">&times;</button>
            </div>
            <div class="modal-body">
              <p>Are you sure you want to delete category <strong>{{ deletingCategory()?.name }}</strong>?</p>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="deletingCategory.set(null)">Cancel</button>
              <button class="btn btn-danger" [disabled]="submitting()" (click)="confirmDeleteCategory()">
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-page { display: flex; flex-direction: column; gap: 1.5rem; }
    .page-header { display: flex; align-items: center; justify-content: space-between; }
    .page-header h1 { font-size: 1.75rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.25rem; }
    .table-card { background: #ffffff; padding: 1.5rem; overflow-x: auto; }
    .admin-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    .admin-table th {
      text-align: left; padding: 0.75rem; font-size: 0.8rem; font-weight: 700;
      color: var(--text-muted); text-transform: uppercase; border-bottom: 2px solid var(--border);
    }
    .admin-table td { padding: 0.85rem 0.75rem; border-bottom: 1px solid var(--border); vertical-align: middle; }
    .actions-cell { display: flex; justify-content: flex-end; gap: 0.5rem; }
    .text-right { text-align: right; }
    .btn-xs { padding: 0.3rem 0.6rem; font-size: 0.75rem; }
    /* Modal */
    .modal-backdrop {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.6); display: flex; align-items: center; justify-content: center;
      z-index: 9999; padding: 1.5rem;
    }
    .modal-card { width: 100%; max-width: 500px; padding: 2rem; background: #ffffff; }
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 1.25rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border);
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
export class AdminCategoriesComponent implements OnInit {
  private productService = inject(ProductService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  categories = signal<CategoryResponse[]>([]);
  loading = signal(true);
  submitting = signal(false);

  showCategoryModal = signal(false);
  editingCategory = signal<CategoryResponse | null>(null);
  deletingCategory = signal<CategoryResponse | null>(null);

  categoryForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    slug: [''],
    description: ['']
  });

  ngOnInit(): void {
    this.fetchCategories();
  }

  fetchCategories(): void {
    this.loading.set(true);
    this.productService.getAllCategories().subscribe({
      next: (cats) => {
        this.categories.set(cats);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openCreateModal(): void {
    this.editingCategory.set(null);
    this.categoryForm.reset({ name: '', slug: '', description: '' });
    this.showCategoryModal.set(true);
  }

  openEditModal(category: CategoryResponse): void {
    this.editingCategory.set(category);
    this.categoryForm.patchValue({
      name: category.name,
      slug: category.slug,
      description: category.description || ''
    });
    this.showCategoryModal.set(true);
  }

  closeCategoryModal(): void {
    this.showCategoryModal.set(false);
    this.editingCategory.set(null);
  }

  onSubmitCategory(): void {
    if (this.categoryForm.invalid) return;

    this.submitting.set(true);
    const req: CategoryRequest = {
      name: this.categoryForm.value.name,
      slug: this.categoryForm.value.slug || undefined,
      description: this.categoryForm.value.description || undefined
    };

    const editing = this.editingCategory();
    const action$ = editing
      ? this.productService.updateCategory(editing.id, req)
      : this.productService.createCategory(req);

    action$.subscribe({
      next: () => {
        this.submitting.set(false);
        this.toastService.success(`Category ${editing ? 'updated' : 'created'} successfully`);
        this.closeCategoryModal();
        this.fetchCategories();
      },
      error: (err) => {
        this.submitting.set(false);
        this.toastService.error(err.error?.message || 'Failed to save category');
      }
    });
  }

  openDeleteModal(category: CategoryResponse): void {
    this.deletingCategory.set(category);
  }

  confirmDeleteCategory(): void {
    const cat = this.deletingCategory();
    if (!cat) return;

    this.submitting.set(true);
    this.productService.deleteCategory(cat.id).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toastService.success(`Category "${cat.name}" deleted`);
        this.deletingCategory.set(null);
        this.fetchCategories();
      },
      error: (err) => {
        this.submitting.set(false);
        this.toastService.error(err.error?.message || 'Failed to delete category');
      }
    });
  }
}
