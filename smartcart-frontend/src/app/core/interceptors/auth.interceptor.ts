import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

const EXCLUDED_URLS = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh-token'
];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const isExcluded = EXCLUDED_URLS.some(url => req.url.includes(url));

  let authReq = req;
  const token = authService.getAccessToken();

  if (!isExcluded && token) {
    authReq = addToken(req, token);
  }

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !isExcluded) {
        return handle401Error(authReq, next, authService);
      }
      return throwError(() => error);
    })
  );
};

function addToken(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}

function handle401Error(
  req: HttpRequest<unknown>,
  next: Parameters<HttpInterceptorFn>[1],
  authService: AuthService
) {
  if (!authService.isRefreshing) {
    authService.isRefreshing = true;
    authService.refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap((authResponse) => {
        authService.isRefreshing = false;
        authService.refreshTokenSubject.next(authResponse.accessToken);
        return next(addToken(req, authResponse.accessToken));
      }),
      catchError((err) => {
        authService.isRefreshing = false;
        authService.logout();
        return throwError(() => err);
      })
    );
  } else {
    // Wait until refreshTokenSubject emits the new non-null access token
    return authService.refreshTokenSubject.pipe(
      filter((token): token is string => token !== null),
      take(1),
      switchMap((token) => next(addToken(req, token)))
    );
  }
}
