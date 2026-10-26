import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { Product } from '../models';
import { ProductService } from './product.service';
import { environment } from '../../environments/environment';

describe('ProductService', () => {
  let service: ProductService;
  let httpTestingController: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/products`;
  const apiProduct = {
    _id: 'mongo-id',
    name: 'Wireless Mouse',
    sku: 'WM-001',
    category: 'Electronics',
    purchasePrice: 350,
    sellingPrice: 550,
    quantity: 25,
    minimumStock: 10,
    description: 'Wireless optical mouse',
    status: 'Active' as const,
    createdAt: '2026-10-20T00:00:00.000Z',
    updatedAt: '2026-10-21T00:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProductService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should map MongoDB product IDs and timestamps when fetching all products', () => {
    let products: Product[] = [];
    service.getProducts().subscribe((result) => (products = result));

    httpTestingController.expectOne(apiUrl).flush({
      success: true,
      count: 1,
      data: [apiProduct],
    });

    expect(products![0].id).toBe('mongo-id');
    expect(products![0].createdAt).toEqual(new Date(apiProduct.createdAt));
    expect(products![0].updatedAt).toEqual(new Date(apiProduct.updatedAt));
  });

  it('should fetch a product by ID', () => {
    let productId = '';
    service.getProductById('mongo-id').subscribe((product) => (productId = product.id));

    httpTestingController.expectOne(`${apiUrl}/mongo-id`).flush({
      success: true,
      data: apiProduct,
    });

    expect(productId).toBe('mongo-id');
  });

  it('should create a product', () => {
    let createdProductId = '';
    const payload = { name: 'Wireless Mouse', sku: 'WM-001' };
    service.createProduct(payload).subscribe((product) => (createdProductId = product.id));

    const request = httpTestingController.expectOne(apiUrl);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({ success: true, data: apiProduct });

    expect(createdProductId).toBe('mongo-id');
  });

  it('should update a product', () => {
    let updatedProductId = '';
    const payload = { sellingPrice: 600 };
    service.updateProduct('mongo-id', payload).subscribe((product) => (updatedProductId = product.id));

    const request = httpTestingController.expectOne(`${apiUrl}/mongo-id`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(payload);
    request.flush({ success: true, data: apiProduct });

    expect(updatedProductId).toBe('mongo-id');
  });

  it('should delete a product', () => {
    let completed = false;
    service.deleteProduct('mongo-id').subscribe(() => (completed = true));

    const request = httpTestingController.expectOne(`${apiUrl}/mongo-id`);
    expect(request.request.method).toBe('DELETE');
    request.flush({ success: true, message: 'Product deleted successfully' });

    expect(completed).toBeTrue();
  });
});
