import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../environments/environment';

import {
  CreateGoodsReceiptRequest,
  GoodsReceipt,
  GoodsReceiptListResponse,
  GoodsReceiptResponse,
} from '../models/goods-receipt.model';

import {
  PurchaseOrder,
  PurchaseOrderListResponse,
} from '../models/purchase-order.model';

@Injectable({
  providedIn: 'root',
})
export class GoodsReceiptService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/goods-receipts`;
  private readonly purchaseOrderUrl = `${environment.apiUrl}/purchase-orders`;

  // Get all goods receipts
  getGoodsReceipts(): Observable<GoodsReceipt[]> {
    return this.http
      .get<GoodsReceiptListResponse>(this.apiUrl)
      .pipe(map(response => response.data));
  }

  // Get a goods receipt by ID
  getGoodsReceiptById(id: string): Observable<GoodsReceipt> {
    return this.http
      .get<GoodsReceiptResponse>(`${this.apiUrl}/${id}`)
      .pipe(map(response => response.data));
  }

  // Create a goods receipt
  createGoodsReceipt(
    payload: CreateGoodsReceiptRequest
  ): Observable<GoodsReceipt> {
    return this.http
      .post<GoodsReceiptResponse>(this.apiUrl, payload)
      .pipe(map(response => response.data));
  }

  // Get purchase orders for goods receipt
  getPurchaseOrders(): Observable<PurchaseOrder[]> {
    return this.http
      .get<PurchaseOrderListResponse>(this.purchaseOrderUrl)
      .pipe(map(response => response.data));
  }
}
