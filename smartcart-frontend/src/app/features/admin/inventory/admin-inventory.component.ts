import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { InventoryService } from '../../../core/services/inventory.service';
import { ToastService } from '../../../core/services/toast.service';
import { InventoryRequest, InventoryResponse } from '../../../core/models/inventory.models';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-admin-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginationComponent, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <div>
          <h1>Authoritative Inventory & Stock</h1>
          <p class="text-muted">Monitor warehouse stock, optimistic locks, and restock levels</p>
        </div>
        <button class="btn btn-primary" (click)="openAddInventoryModal()">
          + Initialize SKU Stock
        </button>
      </div>

      <!-- Filter Controls -->
      <div class="card filter-card">
        <div class="toggle-group">
          <button
            class="btn btn-sm"
            [class.btn-primary]="!showLowStockOnly()"
            [class.btn-secondary]="showLowStockOnly()"
            (click)="toggleLowStock(false)"
          >
            All Inventory
          </button>
          <button
            class="btn btn-sm"
            [class.btn-danger]="showLowStockOnly()"
            [class.btn-secondary]="!showLowStockOnly()"
            (click)="toggleLowStock(true)"
          >
            ⚠️ Low Stock Only
          </button>
        </div>
      </div>

      <!-- Inventory Table -->
      @if (loading()) {
        <app-loading-spinner message="Loading inventory data..."></app-loading-spinner>
      } @else if (inventoryList().length === 0) {
        <app-empty-state
          icon="📋"
          title="No Inventory Records"
          description="Initialize inventory for your product SKUs."
          actionLabel="+ Initialize Stock"
          (actionClicked)="openAddInventoryModal()"
        ></app-empty-state>
      } @else {
        <div class="card table-card">
          <table class="admin-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Available Stock</th>
                <th>Reserved Stock</th>
                <th>Threshold</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (inv of inventoryList(); track inv.sku) {
                <tr>
                  <td><code>{{ inv.sku }}</code></td>
                  <td><strong [class.text-danger]="inv.availableQuantity === 0">{{ inv.availableQuantity }}</strong></td>
                  <td>{{ inv.reservedQuantity }}</td>
                  <td>{{ inv.lowStockThreshold || 10 }}</td>
                  <td>
                    @if (inv.availableQuantity === 0) {
                      <span class="badge badge-danger">Out of Stock</span>
                    } @else if (inv.lowStock || (inv.lowStockThreshold && inv.availableQuantity <= inv.lowStockThreshold)) {
                      <span class="badge badge-warning">Low Stock</span>
                    } @else {
                      <span class="badge badge-success">Healthy</span>
                    }
                  </td>
                  <td class="text-right actions-cell">
                    <button class="btn btn-secondary btn-xs" (click)="openRestockModal(inv)">
                      + Restock
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

      <!-- Initialize Stock Modal -->
      @if (showAddModal()) {
        <div class="modal-backdrop">
          <div class="modal-card card">
            <div class="modal-header">
              <h3>Initialize SKU Inventory</h3>
              <button class="modal-close" (click)="showAddModal.set(false)">&times;</button>
            </div>

            <form [formGroup]="addInventoryForm" (ngSubmit)="onSubmitAddInventory()">
              <div class="modal-body">
                <div class="form-group">
                  <label class="form-label" for="skuInput">SKU *</label>
                  <input
                    id="skuInput"
                    type="text"
                    class="form-control"
                    formControlName="sku"
                    placeholder="e.g. SKU-12345"
                  />
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label" for="availInput">Initial Available Stock *</label>
                    <input
                      id="availInput"
                      type="number"
                      class="form-control"
                      formControlName="availableQuantity"
                      min="0"
                      placeholder="100"
                    />
                  </div>

                  <div class="form-group">
                    <label class="form-label" for="threshInput">Low Stock Threshold</label>
                    <input
                      id="threshInput"
                      type="number"
                      class="form-control"
                      formControlName="lowStockThreshold"
                      min="1"
                      placeholder="10"
                    />
                  </div>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="showAddModal.set(false)">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="submitting() || addInventoryForm.invalid">
                  @if (submitting()) { <span class="spinner-sm"></span> Initializing... }
                  @else { Initialize Stock }
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Restock Modal -->
      @if (selectedForRestock()) {
        <div class="modal-backdrop">
          <div class="modal-card card">
            <div class="modal-header">
              <h3>Restock SKU: {{ selectedForRestock()?.sku }}</h3>
              <button class="modal-close" (click)="selectedForRestock.set(null)">&times;</button>
            </div>

            <div class="modal-body">
              <p class="text-muted mb-4">
                Current Available: <strong>{{ selectedForRestock()?.availableQuantity }}</strong> | Reserved: <strong>{{ selectedForRestock()?.reservedQuantity }}</strong>
              </p>

              <div class="form-group">
                <label class="form-label" for="qtyToAdd">Quantity to Add *</label>
                <input
                  id="qtyToAdd"
                  type="number"
                  class="form-control"
                  [(ngModel)]="restockQty"
                  min="1"
                  placeholder="50"
                />
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="selectedForRestock.set(null)">Cancel</button>
              <button class="btn btn-primary" [disabled]="submitting() || restockQty < 1" (click)="confirmRestock()">
                @if (submitting()) { <span class="spinner-sm"></span> Updating... }
                @else { Confirm Restock }
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
    .filter-card { padding: 1rem 1.25rem; background: #ffffff; }
    .toggle-group { display: flex; gap: 0.5rem; }
    .table-card { background: #ffffff; padding: 1.5rem; overflow-x: auto; }
    .admin-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    .admin-table th {
      text-align: left; padding: 0.75rem; font-size: 0.8rem; font-weight: 700;
      color: var(--text-muted); text-transform: uppercase; border-bottom: 2px solid var(--border);
    }
    .admin-table td { padding: 0.85rem 0.75rem; border-bottom: 1px solid var(--border); vertical-align: middle; }
    .actions-cell { display: flex; justify-content: flex-end; }
    .text-right { text-align: right; }
    .btn-xs { padding: 0.3rem 0.6rem; font-size: 0.75rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .mb-4 { margin-bottom: 1rem; }
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
export class AdminInventoryComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  inventoryList = signal<InventoryResponse[]>([]);
  loading = signal(true);
  submitting = signal(false);
  showLowStockOnly = signal(false);

  currentPage = signal(0);
  totalPages = signal(1);
  totalElements = signal(0);

  showAddModal = signal(false);
  selectedForRestock = signal<InventoryResponse | null>(null);
  restockQty = 50;

  addInventoryForm: FormGroup = this.fb.group({
    sku: ['', [Validators.required]],
    availableQuantity: [100, [Validators.required, Validators.min(0)]],
    lowStockThreshold: [10, [Validators.min(1)]]
  });

  ngOnInit(): void {
    this.fetchInventory();
  }

  fetchInventory(): void {
    this.loading.set(true);
    const action$ = this.showLowStockOnly()
      ? this.inventoryService.getLowStockInventory(this.currentPage(), 10)
      : this.inventoryService.getAllInventory(this.currentPage(), 10);

    action$.subscribe({
      next: (page) => {
        this.inventoryList.set(page.content);
        this.currentPage.set(page.pageNumber);
        this.totalPages.set(page.totalPages);
        this.totalElements.set(page.totalElements);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toastService.error(err.error?.message || 'Failed to load inventory');
      }
    });
  }

  toggleLowStock(lowStock: boolean): void {
    this.showLowStockOnly.set(lowStock);
    this.currentPage.set(0);
    this.fetchInventory();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.fetchInventory();
  }

  openAddInventoryModal(): void {
    this.addInventoryForm.reset({ sku: '', availableQuantity: 100, lowStockThreshold: 10 });
    this.showAddModal.set(true);
  }

  onSubmitAddInventory(): void {
    if (this.addInventoryForm.invalid) return;

    this.submitting.set(true);
    const req: InventoryRequest = {
      sku: this.addInventoryForm.value.sku,
      availableQuantity: this.addInventoryForm.value.availableQuantity,
      lowStockThreshold: this.addInventoryForm.value.lowStockThreshold
    };

    this.inventoryService.addInventory(req).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toastService.success(`Inventory initialized for SKU: ${req.sku}`);
        this.showAddModal.set(false);
        this.fetchInventory();
      },
      error: (err) => {
        this.submitting.set(false);
        this.toastService.error(err.error?.message || 'Failed to initialize inventory');
      }
    });
  }

  openRestockModal(inv: InventoryResponse): void {
    this.selectedForRestock.set(inv);
    this.restockQty = 50;
  }

  confirmRestock(): void {
    const inv = this.selectedForRestock();
    if (!inv || this.restockQty < 1) return;

    this.submitting.set(true);
    this.inventoryService.restock(inv.sku, this.restockQty).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toastService.success(`Restocked ${this.restockQty} units for SKU: ${inv.sku}`);
        this.selectedForRestock.set(null);
        this.fetchInventory();
      },
      error: (err) => {
        this.submitting.set(false);
        this.toastService.error(err.error?.message || 'Failed to restock');
      }
    });
  }
}
