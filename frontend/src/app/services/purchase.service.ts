import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import {
  CreatePurchaseRequest,
  Purchase,
  PurchaseProductOption,
  PurchaseSupplierOption,
} from '../models/purchase.model';
import { environment } from '../../environments/environment';

interface PurchaseListResponse {
  count: number;
  purchases: Purchase[];
}

interface PurchaseResponse {
  message: string;
  purchase: Purchase;
}

interface CollectionResponse<T> {
  success: boolean;
  count: number;
  data: T[];
}

@Injectable({
  providedIn: 'root',
})
export class PurchaseService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}`;

  getPurchases(): Observable<Purchase[]> {
    return this.http
      .get<PurchaseListResponse>(`${this.apiUrl}/purchases`)
      .pipe(map(response => response.purchases));
  }

  getPurchaseById(id: string): Observable<Purchase> {
    return this.http
      .get<{ purchase: Purchase }>(`${this.apiUrl}/purchases/${id}`)
      .pipe(map(response => response.purchase));
  }

  createPurchase(payload: CreatePurchaseRequest): Observable<PurchaseResponse> {
    return this.http.post<PurchaseResponse>(`${this.apiUrl}/purchases`, payload);
  }

  cancelPurchase(id: string, cancellationReason: string): Observable<PurchaseResponse> {
    return this.http.patch<PurchaseResponse>(
      `${this.apiUrl}/purchases/${id}/cancel`,
      { cancellationReason }
    );
  }

  getActiveSuppliers(): Observable<PurchaseSupplierOption[]> {
    return this.http
      .get<CollectionResponse<PurchaseSupplierOption>>(`${this.apiUrl}/suppliers`)
      .pipe(map(response => response.data.filter(supplier => supplier.status === 'Active')));
  }

  getActiveProducts(): Observable<PurchaseProductOption[]> {
    return this.http
      .get<CollectionResponse<PurchaseProductOption>>(`${this.apiUrl}/products`)
      .pipe(map(response => response.data.filter(product => product.status === 'Active')));
  }
}
