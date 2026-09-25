import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // Customer Storefront Layout & Routes
  {
    path: '',
    loadComponent: () => import('./layout/customer-layout/customer-layout.component').then(m => m.CustomerLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'products',
        loadComponent: () => import('./features/products/product-list/product-list.component').then(m => m.ProductListComponent)
      },
      {
        path: 'products/:id',
        loadComponent: () => import('./features/products/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
      },
      {
        path: 'cart',
        loadComponent: () => import('./features/cart/cart.component').then(m => m.CartComponent)
      },
      {
        path: 'checkout',
        canActivate: [authGuard],
        loadComponent: () => import('./features/checkout/checkout.component').then(m => m.CheckoutComponent)
      },
      {
        path: 'checkout/confirmation/:orderNumber',
        canActivate: [authGuard],
        loadComponent: () => import('./features/checkout/order-confirmation/order-confirmation.component').then(m => m.OrderConfirmationComponent)
      },
      {
        path: 'orders',
        canActivate: [authGuard],
        loadComponent: () => import('./features/orders/order-list/order-list.component').then(m => m.OrderListComponent)
      },
      {
        path: 'orders/:orderNumber',
        canActivate: [authGuard],
        loadComponent: () => import('./features/orders/order-detail/order-detail.component').then(m => m.OrderDetailComponent)
      },
      {
        path: 'payments',
        canActivate: [authGuard],
        loadComponent: () => import('./features/payments/payment-list/payment-list.component').then(m => m.PaymentListComponent)
      }
    ]
  },
  // Authentication Routes
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  // Dedicated Admin Portal Layout & Routes
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./layout/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'products',
        loadComponent: () => import('./features/admin/products/admin-products.component').then(m => m.AdminProductsComponent)
      },
      {
        path: 'categories',
        loadComponent: () => import('./features/admin/categories/admin-categories.component').then(m => m.AdminCategoriesComponent)
      },
      {
        path: 'inventory',
        loadComponent: () => import('./features/admin/inventory/admin-inventory.component').then(m => m.AdminInventoryComponent)
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/admin/orders/admin-orders.component').then(m => m.AdminOrdersComponent)
      },
      {
        path: 'payments',
        loadComponent: () => import('./features/admin/payments/admin-payments.component').then(m => m.AdminPaymentsComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./features/admin/users/admin-users.component').then(m => m.AdminUsersComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
