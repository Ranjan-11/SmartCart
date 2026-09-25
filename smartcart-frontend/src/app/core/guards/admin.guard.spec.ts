import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { adminGuard } from './admin.guard';
import { AuthService } from '../auth/auth.service';

describe('adminGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'isAdmin']);
    routerSpy = jasmine.createSpyObj('Router', ['createUrlTree']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });
  });

  it('should allow access if user is authenticated and has ROLE_ADMIN', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.isAdmin.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      adminGuard({} as ActivatedRouteSnapshot, { url: '/admin' } as RouterStateSnapshot)
    );

    expect(result).toBeTrue();
  });

  it('should redirect non-admin authenticated users to home', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.isAdmin.and.returnValue(false);

    TestBed.runInInjectionContext(() =>
      adminGuard({} as ActivatedRouteSnapshot, { url: '/admin' } as RouterStateSnapshot)
    );

    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/']);
  });

  it('should redirect unauthenticated users to login with returnUrl', () => {
    authServiceSpy.isAuthenticated.and.returnValue(false);

    TestBed.runInInjectionContext(() =>
      adminGuard({} as ActivatedRouteSnapshot, { url: '/admin/dashboard' } as RouterStateSnapshot)
    );

    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/auth/login'], {
      queryParams: { returnUrl: '/admin/dashboard' }
    });
  });
});
