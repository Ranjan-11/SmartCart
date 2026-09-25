import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="footer-wrapper">
      <div class="container footer-container">
        <div class="footer-brand">
          <div class="brand-logo">🛒 SmartCart</div>
          <p class="brand-tagline">
            Next-Generation Cloud Microservices E-Commerce Platform built with Spring Cloud and Angular.
          </p>
        </div>

        <div class="footer-column">
          <h4>Explore</h4>
          <ul>
            <li><a routerLink="/products">All Products</a></li>
            <li><a routerLink="/products" [queryParams]="{ category: 'Electronics' }">Electronics</a></li>
            <li><a routerLink="/products" [queryParams]="{ category: 'Fashion' }">Fashion</a></li>
          </ul>
        </div>

        <div class="footer-column">
          <h4>Customer Care</h4>
          <ul>
            <li><a routerLink="/cart">Shopping Cart</a></li>
            <li><a routerLink="/auth/login">My Account</a></li>
            <li><a routerLink="/products">Track Orders</a></li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <div class="container">
          <p>&copy; 2026 SmartCart Enterprise. All rights reserved.</p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer-wrapper {
      background-color: var(--bg-sidebar);
      color: #e2e8f0;
      padding-top: 3.5rem;
      margin-top: auto;
    }
    .footer-container {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: 3rem;
      padding-bottom: 3rem;
    }
    .brand-logo {
      font-size: 1.5rem;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 0.75rem;
    }
    .brand-tagline {
      color: var(--text-light);
      font-size: 0.9rem;
      line-height: 1.6;
      max-width: 380px;
    }
    .footer-column h4 {
      font-size: 1rem;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 1.25rem;
    }
    .footer-column ul {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }
    .footer-column a {
      color: var(--text-light);
      font-size: 0.875rem;
      transition: color 0.15s ease;
    }
    .footer-column a:hover {
      color: #ffffff;
    }
    .footer-bottom {
      border-top: 1px solid #1e293b;
      padding: 1.5rem 0;
      text-align: center;
      font-size: 0.825rem;
      color: #64748b;
    }
    @media (max-width: 768px) {
      .footer-container {
        grid-template-columns: 1fr;
        gap: 2rem;
      }
    }
  `]
})
export class FooterComponent {}
