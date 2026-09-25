export interface AddressDto {
  id?: number;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface UserProfileResponse {
  id: number;
  authUserId: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  addresses?: AddressDto[];
  createdAt: string;
}

export interface UpdateUserProfileRequest {
  firstName: string;
  lastName: string;
  phone?: string;
}
