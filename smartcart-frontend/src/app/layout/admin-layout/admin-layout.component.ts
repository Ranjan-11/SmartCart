import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="admin-container">
      <!-- Admin Sidebar -->
      <aside class="admin-sidebar">
        <div class="sidebar-header">
          <a routerLink="/admin/dashboard" class="sidebar-brand">
            <span class="brand-icon">⚙️</span>
            <span class="brand-title">SmartCart Admin</span>
          </a>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/admin/dashboard" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📊</span> Dashboard
          </a>
          <a routerLink="/admin/products" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📦</span> Products
          </a>
          <a routerLink="/admin/categories" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📁</span> Categories
          </a>
          <a routerLink="/admin/inventory" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📋</span> Inventory & Stock
          </a>
          <a routerLink="/admin/orders" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🛒</span> Orders
          </a>
          <a routerLink="/admin/payments" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">💳</span> Payments
          </a>
          <a routerLink="/admin/users" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">👥</span> Users
          </a>
        </nav>

        <div class="sidebar-footer">
          <a routerLink="/" class="store-link">
            🛍️ Storefront View
          </a>
          <button class="btn-sidebar-logout" (click)="logout()">
            🚪 Sign Out
          </button>
        </div>
      </aside>

      <!-- Main Content Area -->
      <div class="admin-main">
        <header class="admin-topbar">
          <div class="topbar-left">
            <span class="topbar-badge">ADMIN CONSOLE</span>
          </div>
          <div class="topbar-user">
            <span class="admin-user-email">👤 {{ authService.currentUser()?.email }}</span>
          </div>
        </header>

        <main class="admin-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .admin-container {
      display: flex;
      min-height: 100vh;
      background: #f8fafc;
    }
    .admin-sidebar {
      width: 260px;
      background: var(--bg-sidebar);
      color: #e2e8f0;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      position: sticky;
      top: 0;
      height: 100vh;
    }
    .sidebar-header {
      padding: 1.5rem 1.25rem;
      border-bottom: 1px solid #1e293b;
    }
    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      color: #ffffff;
      font-size: 1.15rem;
      font-weight: 700;
      text-decoration: none;
    }
    .sidebar-nav {
      flex: 1;
      padding: 1.25rem 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      overflow-y: auto;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      color: #94a3b8;
      border-radius: var(--radius-sm);
      font-size: 0.9rem;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.15s ease;
    }
    .nav-item:hover {
      background: #1e293b;
      color: #ffffff;
    }
    .nav-item.active {
      background: var(--primary);
      color: #ffffff;
      font-weight: 600;
    }
    .sidebar-footer {
      padding: 1.25rem;
      border-top: 1px solid #1e293b;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .store-link {
      display: block;
      padding: 0.6rem;
      background: #1e293b;
      color: #e2e8f0;
      text-align: center;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      font-weight: 600;
      text-decoration: none;
    }
    .store-link:hover {
      background: #334155;
    }
    .btn-sidebar-logout {
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 0.85rem;
      cursor: pointer;
      text-align: left;
      padding: 0.5rem;
    }
    .btn-sidebar-logout:hover {
      color: #ef4444;
    }
    .admin-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
    }
    .admin-topbar {
      height: 64px;
      background: #ffffff;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2rem;
    }
    .topbar-badge {
      background: #f1f5f9;
      color: #0f172a;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.6rem;
      border-radius: var(--radius-full);
      letter-spacing: 0.05em;
    }
    .admin-user-email {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-muted);
    }
    .admin-content {
      flex: 1;
      padding: 2rem;
    }
  `]
})
export class AdminLayoutComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  logout(): void {
    this.authService.logout();
  }
}
