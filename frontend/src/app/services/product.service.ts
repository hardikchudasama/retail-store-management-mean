import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { Product } from '../models';
import { environment } from '../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  count?: number;
  data: T;
}

interface ApiProduct {
  _id: string;
  name: string;
  sku: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  minimumStock: number;
  description?: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/products`;

  private mapProduct(product: ApiProduct): Product {
    return {
      id: product._id,
      name: product.name,
      sku: product.sku,
      category: product.category,
      purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice,
      quantity: product.quantity,
      minimumStock: product.minimumStock,
      description: product.description,
      status: product.status,
      createdAt: new Date(product.createdAt),
      updatedAt: product.updatedAt ? new Date(product.updatedAt) : undefined,
    };
  }

  getProducts(): Observable<Product[]> {
    return this.http
      .get<ApiResponse<ApiProduct[]>>(this.apiUrl)
      .pipe(map((response) => response.data.map((product) => this.mapProduct(product))));
  }

  getProductById(id: string): Observable<Product> {
    return this.http
      .get<ApiResponse<ApiProduct>>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => this.mapProduct(response.data)));
  }

  createProduct(product: Partial<Product>): Observable<Product> {
    return this.http
      .post<ApiResponse<ApiProduct>>(this.apiUrl, product)
      .pipe(map((response) => this.mapProduct(response.data)));
  }

  updateProduct(id: string, product: Partial<Product>): Observable<Product> {
    return this.http
      .put<ApiResponse<ApiProduct>>(`${this.apiUrl}/${id}`, product)
      .pipe(map((response) => this.mapProduct(response.data)));
  }

  deleteProduct(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${this.apiUrl}/${id}`)
      .pipe(map(() => undefined));
  }
}
