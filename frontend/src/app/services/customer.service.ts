import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Customer } from '../models/customer.model';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  count?: number;
  data: T;
}

interface ApiCustomer {
  _id: string;
  customerName: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  notes?: string;
  status: Customer['status'];
  createdAt: string;
}

export type CustomerPayload = Omit<Customer, 'id' | 'createdAt'>;

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/customers`;

  private mapCustomer(customer: ApiCustomer): Customer {
    return {
      id: customer._id,
      customerName: customer.customerName,
      phone: customer.phone,
      email: customer.email ?? '',
      address: customer.address ?? '',
      city: customer.city ?? '',
      state: customer.state ?? '',
      postalCode: customer.postalCode ?? '',
      notes: customer.notes ?? '',
      status: customer.status,
      createdAt: new Date(customer.createdAt),
    };
  }

  getCustomers(): Observable<Customer[]> {
    return this.http
      .get<ApiResponse<ApiCustomer[]>>(this.apiUrl)
      .pipe(map((response) => response.data.map((customer) => this.mapCustomer(customer))));
  }

  getCustomerById(id: string): Observable<Customer> {
    return this.http
      .get<ApiResponse<ApiCustomer>>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => this.mapCustomer(response.data)));
  }

  createCustomer(customer: CustomerPayload): Observable<Customer> {
    return this.http
      .post<ApiResponse<ApiCustomer>>(this.apiUrl, customer)
      .pipe(map((response) => this.mapCustomer(response.data)));
  }

  updateCustomer(id: string, customer: Partial<CustomerPayload>): Observable<Customer> {
    return this.http
      .put<ApiResponse<ApiCustomer>>(`${this.apiUrl}/${id}`, customer)
      .pipe(map((response) => this.mapCustomer(response.data)));
  }

  deleteCustomer(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<unknown>>(`${this.apiUrl}/${id}`)
      .pipe(map(() => undefined));
  }
}