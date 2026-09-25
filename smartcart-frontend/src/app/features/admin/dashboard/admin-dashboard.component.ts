import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { InventoryService } from '../../../core/services/inventory.service';
import { OrderService } from '../../../core/services/order.service';
import { PaymentService } from '../../../core/services/payment.service';
import { OrderResponse } from '../../../core/models/order.models';
import { InventoryResponse } from '../../../core/models/inventory.models';
import { OrderStatusBadgeComponent } from '../../../shared/components/order-status-badge/order-status-badge.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, OrderStatusBadgeComponent, LoadingSpinnerComponent],
  template: `
    <div class="dashboard-page">
      <div class="page-title-bar">
        <h1>Admin Operations Dashboard</h1>
        <p class="text-muted">Real-time system overview, stock alerts and transaction metrics</p>
      </div>

      @if (loading()) {
        <app-loading-spinner message="Loading operational statistics..."></app-loading-spinner>
      } @else {
        <!-- Metric Cards Grid -->
        <div class="metrics-grid">
          <div class="metric-card card">
            <div class="metric-icon bg-blue">📦</div>
            <div class="metric-details">
              <span class="metric-label">Total Catalog Products</span>
              <strong class="metric-value">{{ totalProducts() }}</strong>
            </div>
          </div>

          <div class="metric-card card">
            <div class="metric-icon bg-red">⚠️</div>
            <div class="metric-details">
              <span class="metric-label">Low Stock Alerts</span>
              <strong class="metric-value">{{ totalLowStock() }}</strong>
            </div>
          </div>

          <div class="metric-card card">
            <div class="metric-icon bg-green">🛒</div>
            <div class="metric-details">
              <span class="metric-label">Total System Orders</span>
              <strong class="metric-value">{{ totalOrders() }}</strong>
            </div>
          </div>

          <div class="metric-card card">
            <div class="metric-icon bg-purple">💳</div>
            <div class="metric-details">
              <span class="metric-label">Payment Transactions</span>
              <strong class="metric-value">{{ totalPayments() }}</strong>
            </div>
          </div>
        </div>

        <!-- Dashboard Split Grid -->
        <div class="dashboard-split-grid">
          <!-- Recent Orders Section -->
          <div class="dashboard-panel card">
            <div class="panel-header">
              <h3>Recent System Orders</h3>
              <a routerLink="/admin/orders" class="panel-link">View All →</a>
            </div>

            @if (recentOrders().length === 0) {
              <p class="text-muted text-center py-4">No recent orders recorded.</p>
            } @else {
              <div class="table-responsive">
                <table class="admin-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (order of recentOrders(); track order.orderNumber) {
                      <tr>
                        <td>
                          <a [routerLink]="['/orders', order.orderNumber]" class="order-link">
                            {{ order.orderNumber }}
                          </a>
                        </td>
                        <td>{{ order.userEmail }}</td>
                        <td><strong>\${{ order.totalAmount | number:'1.2-2' }}</strong></td>
                        <td>
                          <app-order-status-badge [status]="order.status"></app-order-status-badge>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>

          <!-- Low Stock Warnings Section -->
          <div class="dashboard-panel card">
            <div class="panel-header">
              <h3>Stock Alerts</h3>
              <a routerLink="/admin/inventory" class="panel-link">Manage Stock →</a>
            </div>

            @if (lowStockItems().length === 0) {
              <p class="text-muted text-center py-4">All inventory quantities are healthy!</p>
            } @else {
              <div class="table-responsive">
                <table class="admin-table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Available</th>
                      <th>Reserved</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (inv of lowStockItems(); track inv.sku) {
                      <tr>
                        <td><strong>{{ inv.sku }}</strong></td>
                        <td class="text-danger font-bold">{{ inv.availableQuantity }}</td>
                        <td>{{ inv.reservedQuantity }}</td>
                        <td>
                          @if (inv.availableQuantity === 0) {
                            <span class="badge badge-danger">Out of Stock</span>
                          } @else {
                            <span class="badge badge-warning">Low Stock</span>
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-page {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
    .page-title-bar h1 {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--text-main);
      margin-bottom: 0.25rem;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.5rem;
    }
    .metric-card {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding: 1.5rem;
      background: #ffffff;
    }
    .metric-icon {
      width: 52px;
      height: 52px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }
    .bg-blue { background: #eff6ff; }
    .bg-red { background: #fef2f2; }
    .bg-green { background: #ecfdf5; }
    .bg-purple { background: #faf5ff; }

    .metric-details {
      display: flex;
      flex-direction: column;
    }
    .metric-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
    }
    .metric-value {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--text-main);
    }
    .dashboard-split-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }
    .dashboard-panel {
      background: #ffffff;
      padding: 1.5rem;
    }
    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border);
    }
    .panel-header h3 {
      font-size: 1.1rem;
      font-weight: 700;
    }
    .panel-link {
      color: var(--primary);
      font-size: 0.85rem;
      font-weight: 600;
    }
    .panel-link:hover {
      text-decoration: underline;
    }
    .admin-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    .admin-table th {
      text-align: left;
      padding: 0.6rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      border-bottom: 1px solid var(--border);
    }
    .admin-table td {
      padding: 0.75rem 0.6rem;
      border-bottom: 1px solid var(--border);
    }
    .order-link {
      color: var(--primary);
      font-weight: 600;
    }
    .font-bold { font-weight: 700; }
    .text-center { text-align: center; }
    .py-4 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
    @media (max-width: 900px) {
      .dashboard-split-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private productService = inject(ProductService);
  private inventoryService = inject(InventoryService);
  private orderService = inject(OrderService);
  private paymentService = inject(PaymentService);

  totalProducts = signal(0);
  totalLowStock = signal(0);
  totalOrders = signal(0);
  totalPayments = signal(0);

  recentOrders = signal<OrderResponse[]>([]);
  lowStockItems = signal<InventoryResponse[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.productService.getAllProducts({ size: 1 }).subscribe({
      next: (res) => this.totalProducts.set(res.totalElements),
      error: () => {}
    });

    this.inventoryService.getLowStockInventory(0, 5).subscribe({
      next: (res) => {
        this.totalLowStock.set(res.totalElements);
        this.lowStockItems.set(res.content);
      },
      error: () => {}
    });

    this.orderService.getAllOrdersAdmin(0, 5).subscribe({
      next: (res) => {
        this.totalOrders.set(res.totalElements);
        this.recentOrders.set(res.content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });

    this.paymentService.getAllPaymentsAdmin(0, 1).subscribe({
      next: (res) => this.totalPayments.set(res.totalElements),
      error: () => {}
    });
  }
}
