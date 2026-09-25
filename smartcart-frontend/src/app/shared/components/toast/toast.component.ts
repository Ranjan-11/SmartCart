import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast-item" [ngClass]="'toast-' + toast.type">
          <div class="toast-content">
            @if (toast.title) {
              <div class="toast-title">{{ toast.title }}</div>
            }
            <div class="toast-message">{{ toast.message }}</div>
          </div>
          <button class="toast-close" (click)="toastService.remove(toast.id)" aria-label="Close">
            &times;
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 400px;
      width: calc(100% - 3rem);
    }
    .toast-item {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      border-radius: var(--radius-md);
      background: #ffffff;
      box-shadow: var(--shadow-lg);
      border-left: 4px solid #cbd5e1;
      animation: slideIn 0.25s ease-out;
    }
    .toast-success { border-left-color: var(--success); }
    .toast-error { border-left-color: var(--danger); }
    .toast-info { border-left-color: var(--info); }
    .toast-warning { border-left-color: var(--warning); }
    .toast-content { flex: 1; }
    .toast-title { font-weight: 600; font-size: 0.9rem; margin-bottom: 0.25rem; }
    .toast-message { font-size: 0.85rem; color: var(--text-muted); }
    .toast-close {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      color: var(--text-light);
      line-height: 1;
      margin-left: 0.5rem;
    }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastComponent {
  toastService = inject(ToastService);
}
