import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state-wrapper">
      <div class="empty-icon">{{ icon }}</div>
      <h3 class="empty-title">{{ title }}</h3>
      <p class="empty-description">{{ description }}</p>
      @if (actionLabel) {
        <button class="btn btn-primary" (click)="actionClicked.emit()">
          {{ actionLabel }}
        </button>
      }
    </div>
  `,
  styles: [`
    .empty-state-wrapper {
      text-align: center;
      padding: 4rem 1.5rem;
      max-width: 480px;
      margin: 0 auto;
    }
    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }
    .empty-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 0.5rem;
    }
    .empty-description {
      font-size: 0.925rem;
      color: var(--text-muted);
      margin-bottom: 1.5rem;
      line-height: 1.5;
    }
  `]
})
export class EmptyStateComponent {
  @Input() icon: string = '🔍';
  @Input() title: string = 'No Items Found';
  @Input() description: string = 'There are no records to display at this time.';
  @Input() actionLabel?: string;
  @Output() actionClicked = new EventEmitter<void>();
}
