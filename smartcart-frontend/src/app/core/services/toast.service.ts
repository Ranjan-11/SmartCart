import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<ToastMessage[]>([]);

  show(toast: Omit<ToastMessage, 'id'>): void {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = {
      ...toast,
      id,
      duration: toast.duration ?? 4000
    };

    this.toasts.update(current => [...current, newToast]);

    setTimeout(() => {
      this.remove(id);
    }, newToast.duration);
  }

  success(message: string, title: string = 'Success'): void {
    this.show({ type: 'success', title, message });
  }

  error(message: string, title: string = 'Error'): void {
    this.show({ type: 'error', title, message, duration: 6000 });
  }

  info(message: string, title: string = 'Info'): void {
    this.show({ type: 'info', title, message });
  }

  warning(message: string, title: string = 'Warning'): void {
    this.show({ type: 'warning', title, message });
  }

  remove(id: string): void {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}
