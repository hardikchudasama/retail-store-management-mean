import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { Supplier } from '../models';
import { environment } from '../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  count?: number;
  data: T;
}

interface ApiSupplier {
  _id: string;
  supplierName: string;
  companyName?: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  notes?: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export type SupplierPayload = Omit<Supplier, 'id' | 'createdAt'>;

@Injectable({
  providedIn: 'root',
})
export class SupplierService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/suppliers`;

  private mapSupplier(supplier: ApiSupplier): Supplier {
    return {
      id: supplier._id,
      supplierName: supplier.supplierName,
      companyName: supplier.companyName ?? '',
      phone: supplier.phone,
      email: supplier.email ?? '',
      address: supplier.address ?? '',
      city: supplier.city ?? '',
      state: supplier.state ?? '',
      postalCode: supplier.postalCode ?? '',
      notes: supplier.notes ?? '',
      status: supplier.status,
      createdAt: new Date(supplier.createdAt),
    };
  }

  getSuppliers(): Observable<Supplier[]> {
    return this.http
      .get<ApiResponse<ApiSupplier[]>>(this.apiUrl)
      .pipe(map((response) => response.data.map((supplier) => this.mapSupplier(supplier))));
  }

  getSupplierById(id: string): Observable<Supplier> {
    return this.http
      .get<ApiResponse<ApiSupplier>>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => this.mapSupplier(response.data)));
  }

  createSupplier(supplier: SupplierPayload): Observable<Supplier> {
    return this.http
      .post<ApiResponse<ApiSupplier>>(this.apiUrl, supplier)
      .pipe(map((response) => this.mapSupplier(response.data)));
  }

  updateSupplier(id: string, supplier: Partial<SupplierPayload>): Observable<Supplier> {
    return this.http
      .put<ApiResponse<ApiSupplier>>(`${this.apiUrl}/${id}`, supplier)
      .pipe(map((response) => this.mapSupplier(response.data)));
  }

  deleteSupplier(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<ApiSupplier>>(`${this.apiUrl}/${id}`)
      .pipe(map(() => undefined));
  }
}
