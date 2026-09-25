import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (totalPages > 1) {
      <div class="pagination-wrapper">
        <button
          class="btn btn-secondary btn-pagination"
          [disabled]="pageNumber === 0"
          (click)="onPageChange(pageNumber - 1)"
        >
          ← Previous
        </button>

        <span class="pagination-info">
          Page <strong>{{ pageNumber + 1 }}</strong> of <strong>{{ totalPages }}</strong>
          <span class="text-muted">({{ totalElements }} items)</span>
        </span>

        <button
          class="btn btn-secondary btn-pagination"
          [disabled]="pageNumber >= totalPages - 1"
          (click)="onPageChange(pageNumber + 1)"
        >
          Next →
        </button>
      </div>
    }
  `,
  styles: [`
    .pagination-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1.25rem;
      margin-top: 2.5rem;
      margin-bottom: 2rem;
    }
    .pagination-info {
      font-size: 0.9rem;
      color: var(--text-main);
    }
    .btn-pagination {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    }
  `]
})
export class PaginationComponent {
  @Input() pageNumber: number = 0;
  @Input() totalPages: number = 1;
  @Input() totalElements: number = 0;
  @Output() pageChange = new EventEmitter<number>();

  onPageChange(newPage: number): void {
    if (newPage >= 0 && newPage < this.totalPages) {
      this.pageChange.emit(newPage);
    }
  }
}
