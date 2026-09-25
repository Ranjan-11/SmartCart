import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, map, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import { AuthResponse, LoginRequest, RefreshTokenRequest, RegisterRequest, UserSession } from '../models/auth.models';

const ACCESS_TOKEN_KEY = 'smartcart_access_token';
const REFRESH_TOKEN_KEY = 'smartcart_refresh_token';
const USER_SESSION_KEY = 'smartcart_user_session';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private currentUserSignal = signal<UserSession | null>(this.loadStoredSession());

  // Public Signals
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  readonly isAdmin = computed(() => this.currentUserSignal()?.roles.includes('ROLE_ADMIN') ?? false);
  readonly isCustomer = computed(() => this.currentUserSignal()?.roles.includes('ROLE_CUSTOMER') ?? false);

  // Concurrency lock and queue for token refresh
  isRefreshing = false;
  refreshTokenSubject = new BehaviorSubject<string | null>(null);

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${environment.apiUrl}/api/v1/auth/login`, request).pipe(
      map(res => res.data),
      tap(authData => this.handleAuthSuccess(authData))
    );
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${environment.apiUrl}/api/v1/auth/register`, request).pipe(
      map(res => res.data),
      tap(authData => this.handleAuthSuccess(authData))
    );
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('No refresh token available'));
    }

    const payload: RefreshTokenRequest = { refreshToken };
    return this.http.post<ApiResponse<AuthResponse>>(`${environment.apiUrl}/api/v1/auth/refresh-token`, payload).pipe(
      map(res => res.data),
      tap(authData => this.handleAuthSuccess(authData)),
      catchError(err => {
        this.logout();
        return throwError(() => err);
      })
    );
  }

  logout(redirectUrl: string = '/auth/login'): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_SESSION_KEY);
    }
    this.currentUserSignal.set(null);
    this.isRefreshing = false;
    this.refreshTokenSubject.next(null);
    this.router.navigate([redirectUrl]);
  }

  getAccessToken(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    }
    return null;
  }

  getRefreshToken(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return null;
  }

  private handleAuthSuccess(authData: AuthResponse): void {
    const session: UserSession = {
      userId: authData.userId,
      email: authData.email,
      roles: authData.roles,
      accessToken: authData.accessToken,
      refreshToken: authData.refreshToken
    };

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ACCESS_TOKEN_KEY, authData.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, authData.refreshToken);
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
    }

    this.currentUserSignal.set(session);
  }

  private loadStoredSession(): UserSession | null {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(USER_SESSION_KEY);
      if (stored) {
        try {
          return JSON.parse(stored) as UserSession;
        } catch {
          return null;
        }
      }
    }
    return null;
  }
}
