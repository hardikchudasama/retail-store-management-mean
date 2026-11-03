import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import {
  CreatePurchaseOrderRequest,
  PurchaseOrder,
  PurchaseOrderListResponse,
  PurchaseOrderResponse,
} from '../models/purchase-order.model';

import {
  PurchaseProductOption,
  PurchaseSupplierOption,
} from '../models/purchase.model';

import { environment } from '../../environments/environment';

interface CollectionResponse<T> {
  success: boolean;
  count: number;
  data: T[];
}

@Injectable({
  providedIn: 'root',
})
export class PurchaseOrderService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}`;

  private readonly endpoint = `${this.apiUrl}/purchase-orders`;

  // Get all Purchase Orders
  getPurchaseOrders(): Observable<PurchaseOrder[]> {
    return this.http
      .get<PurchaseOrderListResponse>(this.endpoint)
      .pipe(map(response => response.data));
  }

  // Get one Purchase Order
  getPurchaseOrderById(id: string): Observable<PurchaseOrder> {
    return this.http
      .get<{ success: boolean; data: PurchaseOrder }>(
        `${this.endpoint}/${id}`
      )
      .pipe(map(response => response.data));
  }

  // Create a Purchase Order as Draft
  createPurchaseOrder(
    payload: CreatePurchaseOrderRequest
  ): Observable<PurchaseOrderResponse> {
    return this.http.post<PurchaseOrderResponse>(
      this.endpoint,
      payload
    );
  }

  // Update Draft Purchase Order
  updateDraftPurchaseOrder(
    id: string,
    payload: CreatePurchaseOrderRequest
  ): Observable<PurchaseOrderResponse> {
    return this.http.patch<PurchaseOrderResponse>(
      `${this.endpoint}/${id}`,
      payload
    );
  }

  // Place Purchase Order
  placePurchaseOrder(id: string): Observable<PurchaseOrderResponse> {
    return this.http.patch<PurchaseOrderResponse>(
      `${this.endpoint}/${id}/place-order`,
      {}
    );
  }

  // Cancel Purchase Order
  cancelPurchaseOrder(
    id: string,
    cancellationReason: string
  ): Observable<PurchaseOrderResponse> {
    return this.http.patch<PurchaseOrderResponse>(
      `${this.endpoint}/${id}/cancel`,
      { cancellationReason }
    );
  }

  // Get active suppliers for dropdown
  getActiveSuppliers(): Observable<PurchaseSupplierOption[]> {
    return this.http
      .get<CollectionResponse<PurchaseSupplierOption>>(
        `${this.apiUrl}/suppliers`
      )
      .pipe(
        map(response =>
          response.data.filter(supplier => supplier.status === 'Active')
        )
      );
  }

  // Get active products for dropdown
  getActiveProducts(): Observable<PurchaseProductOption[]> {
    return this.http
      .get<CollectionResponse<PurchaseProductOption>>(
        `${this.apiUrl}/products`
      )
      .pipe(
        map(response =>
          response.data.filter(product => product.status === 'Active')
        )
      );
  }
}
