import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-wrapper">
      <div class="auth-card card">
        <div class="auth-header">
          <div class="auth-logo">🛒 SmartCart</div>
          <h2>Welcome Back</h2>
          <p>Log in to your account to continue shopping</p>
        </div>

        @if (errorMessage()) {
          <div class="alert alert-danger">
            {{ errorMessage() }}
          </div>
        }

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label" for="email">Email Address</label>
            <input
              id="email"
              type="email"
              class="form-control"
              formControlName="email"
              placeholder="name@example.com"
              [class.is-invalid]="isFieldInvalid('email')"
            />
            @if (isFieldInvalid('email')) {
              <div class="form-error">Please enter a valid email address</div>
            }
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <input
              id="password"
              type="password"
              class="form-control"
              formControlName="password"
              placeholder="••••••••"
              [class.is-invalid]="isFieldInvalid('password')"
            />
            @if (isFieldInvalid('password')) {
              <div class="form-error">Password is required</div>
            }
          </div>

          <button type="submit" class="btn btn-primary w-full" [disabled]="loading() || loginForm.invalid">
            @if (loading()) {
              <span class="spinner"></span> Signing In...
            } @else {
              Sign In
            }
          </button>
        </form>

        <div class="auth-footer">
          Don't have an account? <a routerLink="/auth/register" class="auth-link">Sign up</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    }
    .auth-card {
      width: 100%;
      max-width: 440px;
      padding: 2.5rem;
      background: #ffffff;
    }
    .auth-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .auth-logo {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--primary);
      margin-bottom: 0.5rem;
    }
    .auth-header h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 0.25rem;
    }
    .auth-header p {
      font-size: 0.875rem;
      color: var(--text-muted);
    }
    .w-full {
      width: 100%;
      padding-top: 0.75rem;
      padding-bottom: 0.75rem;
      font-size: 1rem;
    }
    .auth-footer {
      margin-top: 2rem;
      text-align: center;
      font-size: 0.875rem;
      color: var(--text-muted);
    }
    .auth-link {
      color: var(--primary);
      font-weight: 600;
    }
    .auth-link:hover {
      text-decoration: underline;
    }
    .alert {
      padding: 0.75rem 1rem;
      border-radius: var(--radius-sm);
      margin-bottom: 1.25rem;
      font-size: 0.875rem;
    }
    .alert-danger {
      background-color: var(--danger-light);
      color: var(--danger);
      border: 1px solid #fecaca;
    }
    .is-invalid {
      border-color: var(--danger);
    }
    .spinner {
      display: inline-block;
      width: 1rem;
      height: 1rem;
      border: 2px solid #ffffff;
      border-radius: 50%;
      border-top-color: transparent;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  loading = signal(false);
  errorMessage = signal<string | null>(null);

  isFieldInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.toastService.success(`Welcome back, ${res.email}!`);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.message || 'Invalid email or password. Please try again.';
        this.errorMessage.set(msg);
        this.toastService.error(msg);
      }
    });
  }
}
