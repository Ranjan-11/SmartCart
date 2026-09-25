import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';
import { UserProfileResponse } from '../../../core/models/user.models';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <div>
          <h1>User & Customer Management</h1>
          <p class="text-muted">Lookup user profiles, verify account status, and view customer records</p>
        </div>
      </div>

      <!-- User Search Card -->
      <div class="card search-card">
        <div class="search-form">
          <label class="form-label" for="searchId">Search Customer Profile by Auth User ID:</label>
          <div class="search-input-group">
            <input
              id="searchId"
              type="number"
              class="form-control"
              placeholder="e.g. 1, 2, 3..."
              [(ngModel)]="searchUserId"
              (keyup.enter)="onSearchUser()"
            />
            <button class="btn btn-primary" [disabled]="loading() || !searchUserId" (click)="onSearchUser()">
              Lookup User
            </button>
          </div>
        </div>
      </div>

      <!-- Profile Result -->
      @if (loading()) {
        <app-loading-spinner message="Looking up user record..."></app-loading-spinner>
      } @else if (userProfile()) {
        <div class="card profile-card">
          <div class="profile-card-header">
            <div class="user-avatar">👤</div>
            <div>
              <h3>{{ userProfile()?.firstName }} {{ userProfile()?.lastName }}</h3>
              <p class="text-muted">Auth User ID: <strong>{{ userProfile()?.authUserId }}</strong></p>
            </div>
          </div>

          <div class="profile-meta-grid">
            <div class="meta-item">
              <span class="meta-label">Email Address</span>
              <span class="meta-val">{{ userProfile()?.email }}</span>
            </div>

            <div class="meta-item">
              <span class="meta-label">Phone Number</span>
              <span class="meta-val">{{ userProfile()?.phone || 'Not provided' }}</span>
            </div>

            <div class="meta-item">
              <span class="meta-label">Member Since</span>
              <span class="meta-val">{{ userProfile()?.createdAt | date:'medium' }}</span>
            </div>
          </div>

          <div class="addresses-section">
            <h4>Saved Shipping Addresses ({{ userProfile()?.addresses?.length || 0 }})</h4>
            @if (!userProfile()?.addresses || userProfile()!.addresses!.length === 0) {
              <p class="text-muted">No shipping addresses registered for this customer.</p>
            } @else {
              <div class="addresses-grid">
                @for (addr of userProfile()?.addresses; track addr.id) {
                  <div class="address-item-card">
                    @if (addr.isDefault) {
                      <span class="badge badge-primary default-badge">Default</span>
                    }
                    <p class="address-text">
                      <strong>{{ addr.street }}</strong><br />
                      {{ addr.city }}, {{ addr.state }} {{ addr.postalCode }}<br />
                      {{ addr.country }}
                    </p>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      } @else if (searched()) {
        <app-empty-state
          icon="👤"
          title="User Not Found"
          description="No customer record found with the specified User ID."
        ></app-empty-state>
      }
    </div>
  `,
  styles: [`
    .admin-page { display: flex; flex-direction: column; gap: 1.5rem; }
    .page-header h1 { font-size: 1.75rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.25rem; }
    .search-card { padding: 1.5rem; background: #ffffff; max-width: 550px; }
    .search-input-group { display: flex; gap: 0.75rem; margin-top: 0.35rem; }
    .profile-card { padding: 2rem; background: #ffffff; }
    .profile-card-header {
      display: flex; align-items: center; gap: 1.25rem;
      padding-bottom: 1.5rem; border-bottom: 1px solid var(--border);
    }
    .user-avatar {
      width: 56px; height: 56px; border-radius: 50%;
      background: #eff6ff; display: flex; align-items: center; justify-content: center;
      font-size: 1.75rem;
    }
    .profile-meta-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem; padding: 1.5rem 0; border-bottom: 1px solid var(--border);
    }
    .meta-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .meta-label { font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
    .meta-val { font-size: 0.95rem; font-weight: 600; color: var(--text-main); }
    .addresses-section { padding-top: 1.5rem; }
    .addresses-section h4 { font-size: 1.05rem; font-weight: 700; margin-bottom: 1rem; }
    .addresses-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }
    .address-item-card {
      padding: 1rem; background: #f8fafc; border: 1px solid var(--border);
      border-radius: var(--radius-sm); position: relative;
    }
    .default-badge { position: absolute; top: 0.75rem; right: 0.75rem; }
    .address-text { font-size: 0.85rem; line-height: 1.5; margin: 0; }
  `]
})
export class AdminUsersComponent implements OnInit {
  private userService = inject(UserService);
  private toastService = inject(ToastService);

  searchUserId?: number = 1;
  userProfile = signal<UserProfileResponse | null>(null);
  loading = signal(false);
  searched = signal(false);

  ngOnInit(): void {
    this.onSearchUser();
  }

  onSearchUser(): void {
    if (!this.searchUserId) return;

    this.loading.set(true);
    this.searched.set(true);

    this.userService.getUserById(this.searchUserId).subscribe({
      next: (profile) => {
        this.userProfile.set(profile);
        this.loading.set(false);
      },
      error: (err) => {
        this.userProfile.set(null);
        this.loading.set(false);
        this.toastService.error(err.error?.message || 'User profile not found');
      }
    });
  }
}
