import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import { AddressDto, UserProfileResponse } from '../models/user.models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/users`;

  getProfile(): Observable<UserProfileResponse> {
    return this.http.get<ApiResponse<UserProfileResponse>>(`${this.baseUrl}/me`).pipe(
      map(res => res.data)
    );
  }

  getUserById(authUserId: number): Observable<UserProfileResponse> {
    return this.http.get<ApiResponse<UserProfileResponse>>(`${this.baseUrl}/${authUserId}`).pipe(
      map(res => res.data)
    );
  }

  getAddresses(): Observable<AddressDto[]> {
    return this.http.get<ApiResponse<AddressDto[]>>(`${this.baseUrl}/me/addresses`).pipe(
      map(res => res.data)
    );
  }

  addAddress(address: AddressDto): Observable<AddressDto> {
    return this.http.post<ApiResponse<AddressDto>>(`${this.baseUrl}/me/addresses`, address).pipe(
      map(res => res.data)
    );
  }
}
