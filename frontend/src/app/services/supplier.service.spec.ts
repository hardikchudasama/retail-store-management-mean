import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { environment } from '../../environments/environment';
import { Supplier } from '../models';
import { SupplierPayload, SupplierService } from './supplier.service';

describe('SupplierService', () => {
  let service: SupplierService;
  let httpTestingController: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/suppliers`;
  const apiSupplier = {
    _id: 'supplier-1',
    supplierName: 'ABC Electronics',
    companyName: 'ABC Electronics Pvt. Ltd.',
    phone: '9876543210',
    email: 'abc@gmail.com',
    address: 'CG Road',
    city: 'Ahmedabad',
    state: 'Gujarat',
    postalCode: '380009',
    notes: 'Electronics supplier',
    status: 'Active' as const,
    createdAt: '2026-10-26T11:13:16.340Z',
  };
  const supplierPayload: SupplierPayload = {
    supplierName: 'ABC Electronics',
    companyName: 'ABC Electronics Pvt. Ltd.',
    phone: '9876543210',
    email: 'abc@gmail.com',
    address: 'CG Road',
    city: 'Ahmedabad',
    state: 'Gujarat',
    postalCode: '380009',
    notes: 'Electronics supplier',
    status: 'Active',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SupplierService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('should map supplier API records and optional fields', () => {
    let suppliers: Supplier[] = [];
    service.getSuppliers().subscribe((result) => (suppliers = result));

    httpTestingController.expectOne(apiUrl).flush({
      success: true,
      count: 1,
      data: [apiSupplier, { ...apiSupplier, _id: 'supplier-2', companyName: undefined, email: undefined }],
    });

    expect(suppliers[0].id).toBe('supplier-1');
    expect(suppliers[0].createdAt).toEqual(new Date(apiSupplier.createdAt));
    expect(suppliers[1].companyName).toBe('');
    expect(suppliers[1].email).toBe('');
  });

  it('should get, create, update, and delete suppliers through their API endpoints', () => {
    let result: Supplier | undefined;
    service.getSupplierById('supplier-1').subscribe((supplier) => (result = supplier));
    httpTestingController.expectOne(`${apiUrl}/supplier-1`).flush({
      success: true,
      data: apiSupplier,
    });
    expect(result?.id).toBe('supplier-1');

    service.createSupplier(supplierPayload).subscribe((supplier) => (result = supplier));
    const createRequest = httpTestingController.expectOne(apiUrl);
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual(supplierPayload);
    createRequest.flush({ success: true, data: apiSupplier });

    service.updateSupplier('supplier-1', { status: 'Inactive' }).subscribe((supplier) => (result = supplier));
    const updateRequest = httpTestingController.expectOne(`${apiUrl}/supplier-1`);
    expect(updateRequest.request.method).toBe('PUT');
    updateRequest.flush({ success: true, data: { ...apiSupplier, status: 'Inactive' } });
    expect(result?.status).toBe('Inactive');

    service.deleteSupplier('supplier-1').subscribe();
    const deleteRequest = httpTestingController.expectOne(`${apiUrl}/supplier-1`);
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush({ success: true, data: apiSupplier });
  });
});
