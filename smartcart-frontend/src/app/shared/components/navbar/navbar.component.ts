import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  template: `
    <header class="navbar-wrapper">
      <div class="container navbar-container">
        <!-- Brand Logo -->
        <a routerLink="/" class="navbar-brand">
          <span class="brand-icon">🛒</span>
          <span class="brand-name">SmartCart</span>
        </a>

        <!-- Search Bar -->
        <div class="navbar-search">
          <input
            type="text"
            class="search-input"
            placeholder="Search products, brands, and categories..."
            [(ngModel)]="searchQuery"
            (keyup.enter)="onSearch()"
          />
          <button class="search-btn" (click)="onSearch()" aria-label="Search">
            🔍
          </button>
        </div>

        <!-- Navigation Links -->
        <nav class="navbar-links" [class.mobile-open]="mobileMenuOpen()">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="nav-link" (click)="closeMenu()">Home</a>
          <a routerLink="/products" routerLinkActive="active" class="nav-link" (click)="closeMenu()">Products</a>

          <!-- Cart Link with Badge -->
          <a routerLink="/cart" routerLinkActive="active" class="nav-link cart-link" (click)="closeMenu()">
            <span class="cart-icon">🛍️</span>
            <span class="cart-text">Cart</span>
            @if (cartService.itemCount() > 0) {
              <span class="cart-badge">{{ cartService.itemCount() }}</span>
            }
          </a>

          <!-- Authentication State Links -->
          @if (authService.isAuthenticated()) {
            <a routerLink="/orders" routerLinkActive="active" class="nav-link" (click)="closeMenu()">My Orders</a>
            <a routerLink="/payments" routerLinkActive="active" class="nav-link" (click)="closeMenu()">Payments</a>
            @if (authService.isAdmin()) {
              <a routerLink="/admin" class="nav-link admin-pill" (click)="closeMenu()">⚙️ Admin</a>
            }
            <div class="user-dropdown">
              <span class="user-email">👤 {{ authService.currentUser()?.email }}</span>
              <button class="btn btn-secondary btn-sm" (click)="logout()">Sign Out</button>
            </div>
          } @else {
            <a routerLink="/auth/login" class="btn btn-secondary btn-sm" (click)="closeMenu()">Sign In</a>
            <a routerLink="/auth/register" class="btn btn-primary btn-sm" (click)="closeMenu()">Register</a>
          }
        </nav>

        <!-- Mobile Menu Toggle -->
        <button class="mobile-toggle" (click)="toggleMobileMenu()" aria-label="Toggle navigation">
          ☰
        </button>
      </div>
    </header>
  `,
  styles: [`
    .navbar-wrapper {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: #ffffff;
      border-bottom: 1px solid var(--border);
      box-shadow: var(--shadow-sm);
    }
    .navbar-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 70px;
      gap: 1.5rem;
    }
    .navbar-brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--primary);
      text-decoration: none;
    }
    .navbar-search {
      flex: 1;
      max-width: 500px;
      display: flex;
      position: relative;
    }
    .search-input {
      width: 100%;
      padding: 0.6rem 2.75rem 0.6rem 1rem;
      border: 1px solid var(--border);
      border-radius: var(--radius-full);
      background: var(--bg-main);
      font-size: 0.875rem;
      outline: none;
      transition: all 0.2s ease;
    }
    .search-input:focus {
      border-color: var(--primary);
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
    .search-btn {
      position: absolute;
      right: 0.5rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      padding: 0.25rem 0.5rem;
    }
    .navbar-links {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }
    .nav-link {
      font-weight: 500;
      font-size: 0.925rem;
      color: var(--text-main);
      text-decoration: none;
      transition: color 0.15s ease;
    }
    .nav-link:hover, .nav-link.active {
      color: var(--primary);
    }
    .cart-link {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      position: relative;
    }
    .cart-badge {
      background: var(--primary);
      color: #ffffff;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.15rem 0.5rem;
      border-radius: var(--radius-full);
      line-height: 1;
    }
    .admin-pill {
      background: #f1f5f9;
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-full);
      font-size: 0.85rem;
      font-weight: 600;
      color: #0f172a;
    }
    .user-dropdown {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .user-email {
      font-size: 0.85rem;
      color: var(--text-muted);
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .btn-sm {
      padding: 0.4rem 0.85rem;
      font-size: 0.85rem;
    }
    .mobile-toggle {
      display: none;
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
    }
    @media (max-width: 900px) {
      .navbar-search {
        display: none;
      }
      .mobile-toggle {
        display: block;
      }
      .navbar-links {
        position: absolute;
        top: 70px;
        left: 0;
        right: 0;
        background: #ffffff;
        flex-direction: column;
        align-items: flex-start;
        padding: 1.5rem;
        border-bottom: 1px solid var(--border);
        box-shadow: var(--shadow-md);
        display: none;
      }
      .navbar-links.mobile-open {
        display: flex;
      }
    }
  `]
})
export class NavbarComponent {
  authService = inject(AuthService);
  cartService = inject(CartService);
  private router = inject(Router);

  searchQuery = '';
  mobileMenuOpen = signal(false);

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  closeMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/products'], {
        queryParams: { keyword: this.searchQuery.trim(), page: 0 }
      });
      this.closeMenu();
    }
  }

  logout(): void {
    this.authService.logout();
    this.closeMenu();
  }
}
