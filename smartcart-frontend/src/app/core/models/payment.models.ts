export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface PaymentResponse {
  id: number;
  orderNumber: string;
  transactionId: string;
  userId: number;
  userEmail?: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: PaymentStatus;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRequest {
  orderNumber: string;
  amount: number;
  currency?: string;
  paymentMethod?: string;
}

export interface RefundRequest {
  reason: string;
}
