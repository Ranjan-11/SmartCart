import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-wrapper">
      <div class="auth-card card">
        <div class="auth-header">
          <div class="auth-logo">🛒 SmartCart</div>
          <h2>Create Account</h2>
          <p>Join SmartCart to explore thousands of products</p>
        </div>

        @if (errorMessage()) {
          <div class="alert alert-danger">
            {{ errorMessage() }}
          </div>
        }

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="firstName">First Name</label>
              <input
                id="firstName"
                type="text"
                class="form-control"
                formControlName="firstName"
                placeholder="John"
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="lastName">Last Name</label>
              <input
                id="lastName"
                type="text"
                class="form-control"
                formControlName="lastName"
                placeholder="Doe"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="email">Email Address *</label>
            <input
              id="email"
              type="email"
              class="form-control"
              formControlName="email"
              placeholder="name@example.com"
              [class.is-invalid]="isFieldInvalid('email') || validationErrors()['email']"
            />
            @if (isFieldInvalid('email')) {
              <div class="form-error">Please enter a valid email address</div>
            }
            @if (validationErrors()['email']) {
              <div class="form-error">{{ validationErrors()['email'] }}</div>
            }
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password *</label>
            <input
              id="password"
              type="password"
              class="form-control"
              formControlName="password"
              placeholder="Min. 6 characters"
              [class.is-invalid]="isFieldInvalid('password') || validationErrors()['password']"
            />
            @if (isFieldInvalid('password')) {
              <div class="form-error">Password must be at least 6 characters</div>
            }
            @if (validationErrors()['password']) {
              <div class="form-error">{{ validationErrors()['password'] }}</div>
            }
          </div>

          <div class="form-group">
            <label class="form-label" for="phone">Phone Number</label>
            <input
              id="phone"
              type="tel"
              class="form-control"
              formControlName="phone"
              placeholder="+1 (555) 000-0000"
            />
          </div>

          <button type="submit" class="btn btn-primary w-full" [disabled]="loading() || registerForm.invalid">
            @if (loading()) {
              <span class="spinner"></span> Creating Account...
            } @else {
              Create Account
            }
          </button>
        </form>

        <div class="auth-footer">
          Already have an account? <a routerLink="/auth/login" class="auth-link">Sign in</a>
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
      max-width: 480px;
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
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .w-full {
      width: 100%;
      padding-top: 0.75rem;
      padding-bottom: 0.75rem;
      font-size: 1rem;
      margin-top: 0.5rem;
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
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  registerForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    firstName: [''],
    lastName: [''],
    phone: ['']
  });

  loading = signal(false);
  errorMessage = signal<string | null>(null);
  validationErrors = signal<Record<string, string>>({});

  isFieldInvalid(field: string): boolean {
    const control = this.registerForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.validationErrors.set({});

    this.authService.register(this.registerForm.value).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.toastService.success('Account created successfully! Welcome to SmartCart.');
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading.set(false);
        const errorResp = err.error;
        const msg = errorResp?.message || 'Registration failed. Please check your inputs.';
        this.errorMessage.set(msg);
        if (errorResp?.validationErrors) {
          this.validationErrors.set(errorResp.validationErrors);
        }
        this.toastService.error(msg);
      }
    });
  }
}
