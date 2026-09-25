import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/auth.models';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    localStorage.clear();
    routerSpy = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created with no initial authenticated user', () => {
    expect(service).toBeTruthy();
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.isAdmin()).toBeFalse();
    expect(service.isCustomer()).toBeFalse();
  });

  it('should login, store session, and update signals for customer', () => {
    const loginReq: LoginRequest = { email: 'customer@smartcart.com', password: 'password123' };
    const authData: AuthResponse = {
      accessToken: 'acc-token-123',
      refreshToken: 'ref-token-123',
      tokenType: 'Bearer',
      expiresIn: 900000,
      userId: 1,
      email: 'customer@smartcart.com',
      roles: ['ROLE_CUSTOMER']
    };
    const apiResponse: ApiResponse<AuthResponse> = {
      success: true,
      data: authData,
      timestamp: new Date().toISOString()
    };

    service.login(loginReq).subscribe((res) => {
      expect(res.userId).toBe(1);
      expect(res.accessToken).toBe('acc-token-123');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(apiResponse);

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.isCustomer()).toBeTrue();
    expect(service.isAdmin()).toBeFalse();
    expect(service.getAccessToken()).toBe('acc-token-123');
    expect(service.getRefreshToken()).toBe('ref-token-123');
  });

  it('should update isAdmin signal when user has ROLE_ADMIN', () => {
    const authData: AuthResponse = {
      accessToken: 'admin-token',
      refreshToken: 'admin-ref-token',
      tokenType: 'Bearer',
      expiresIn: 900000,
      userId: 2,
      email: 'admin@smartcart.com',
      roles: ['ROLE_ADMIN']
    };
    const apiResponse: ApiResponse<AuthResponse> = {
      success: true,
      data: authData,
      timestamp: new Date().toISOString()
    };

    service.login({ email: 'admin@smartcart.com', password: 'secret' }).subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/auth/login`);
    req.flush(apiResponse);

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.isAdmin()).toBeTrue();
    expect(service.isCustomer()).toBeFalse();
  });

  it('should logout and clear all stored session tokens and signals', () => {
    const authData: AuthResponse = {
      accessToken: 'token',
      refreshToken: 'reftoken',
      tokenType: 'Bearer',
      expiresIn: 900000,
      userId: 1,
      email: 'test@smartcart.com',
      roles: ['ROLE_CUSTOMER']
    };
    service.login({ email: 'test@smartcart.com', password: 'password' }).subscribe();
    httpMock.expectOne(`${environment.apiUrl}/api/v1/auth/login`).flush({ success: true, data: authData, timestamp: '' });

    expect(service.isAuthenticated()).toBeTrue();

    service.logout();

    expect(service.isAuthenticated()).toBeFalse();
    expect(service.currentUser()).toBeNull();
    expect(service.getAccessToken()).toBeNull();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
  });
});
