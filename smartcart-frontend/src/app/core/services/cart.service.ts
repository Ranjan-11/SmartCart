import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import { AddToCartRequest, CartResponse, UpdateCartItemRequest } from '../models/cart.models';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/cart`;

  private cartSignal = signal<CartResponse | null>(null);

  readonly cart = this.cartSignal.asReadonly();
  readonly itemCount = computed(() => this.cartSignal()?.totalItemCount ?? 0);
  readonly totalPrice = computed(() => this.cartSignal()?.totalPrice ?? 0);
  readonly items = computed(() => this.cartSignal()?.items ?? []);

  constructor() {
    // Automatically load cart when authenticated; clear when logged out
    effect(() => {
      if (this.authService.isAuthenticated()) {
        this.loadCart().subscribe();
      } else {
        this.cartSignal.set(null);
      }
    }, { allowSignalWrites: true });
  }

  loadCart(): Observable<CartResponse | null> {
    if (!this.authService.isAuthenticated()) {
      this.cartSignal.set(null);
      return of(null);
    }

    return this.http.get<ApiResponse<CartResponse>>(this.baseUrl).pipe(
      map(res => res.data),
      tap(cartData => this.cartSignal.set(cartData)),
      catchError(() => {
        this.cartSignal.set(null);
        return of(null);
      })
    );
  }

  addItem(sku: string, quantity: number = 1): Observable<CartResponse> {
    const payload: AddToCartRequest = { sku, quantity };
    return this.http.post<ApiResponse<CartResponse>>(`${this.baseUrl}/items`, payload).pipe(
      map(res => res.data),
      tap(cartData => this.cartSignal.set(cartData))
    );
  }

  updateQuantity(sku: string, quantity: number): Observable<CartResponse> {
    const payload: UpdateCartItemRequest = { quantity };
    return this.http.put<ApiResponse<CartResponse>>(`${this.baseUrl}/items/${sku}`, payload).pipe(
      map(res => res.data),
      tap(cartData => this.cartSignal.set(cartData))
    );
  }

  removeItem(sku: string): Observable<CartResponse> {
    return this.http.delete<ApiResponse<CartResponse>>(`${this.baseUrl}/items/${sku}`).pipe(
      map(res => res.data),
      tap(cartData => this.cartSignal.set(cartData))
    );
  }

  clearCart(): Observable<void> {
    return this.http.delete<ApiResponse<void>>(this.baseUrl).pipe(
      map(() => {}),
      tap(() => {
        const current = this.cartSignal();
        if (current) {
          this.cartSignal.set({
            ...current,
            items: [],
            totalItemCount: 0,
            totalPrice: 0
          });
        }
      })
    );
  }
}
