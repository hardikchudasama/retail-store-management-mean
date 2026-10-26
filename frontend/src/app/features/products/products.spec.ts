import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Confirmation, ConfirmationService, MessageService } from 'primeng/api';

import { ProductService } from '../../services/product.service';
import { Product } from '../../models';
import { Products } from './products';

describe('Products', () => {
  let component: Products;
  let fixture: ComponentFixture<Products>;
  let confirmationService: ConfirmationService;
  let messageService: MessageService;
  let productService: jasmine.SpyObj<ProductService>;
  let serverProducts: Product[];

  const initialProducts: Product[] = [
    {
      id: '1',
      name: 'Wireless Mouse',
      sku: 'WM-001',
      category: 'Electronics',
      purchasePrice: 350,
      sellingPrice: 550,
      quantity: 25,
      minimumStock: 10,
      description: 'Wireless optical mouse',
      status: 'Active',
      createdAt: new Date('2026-10-20'),
    },
    {
      id: '2',
      name: 'Office Chair',
      sku: 'OC-002',
      category: 'Furniture',
      purchasePrice: 2500,
      sellingPrice: 3500,
      quantity: 8,
      minimumStock: 5,
      description: 'Ergonomic office chair',
      status: 'Active',
      createdAt: new Date('2026-10-19'),
    },
    {
      id: '3',
      name: 'USB Keyboard',
      sku: 'UK-003',
      category: 'Electronics',
      purchasePrice: 450,
      sellingPrice: 700,
      quantity: 5,
      minimumStock: 10,
      description: 'USB wired keyboard',
      status: 'Active',
      createdAt: new Date('2026-10-18'),
    },
    {
      id: '4',
      name: 'Notebook',
      sku: 'NB-004',
      category: 'Stationery',
      purchasePrice: 30,
      sellingPrice: 50,
      quantity: 100,
      minimumStock: 20,
      description: 'A4 ruled notebook',
      status: 'Active',
      createdAt: new Date('2026-10-17'),
    },
  ];

  beforeEach(async () => {
    serverProducts = [...initialProducts];
    productService = jasmine.createSpyObj<ProductService>('ProductService', [
      'getProducts',
      'getProductById',
      'createProduct',
      'updateProduct',
      'deleteProduct',
    ]);
    productService.getProducts.and.callFake(() => of([...serverProducts]));
    productService.getProductById.and.callFake((id) =>
      of(serverProducts.find((product) => product.id === id)!)
    );
    productService.createProduct.and.callFake((data) => {
      const product: Product = {
        id: 'new-product',
        name: data.name!,
        sku: data.sku!,
        category: data.category!,
        purchasePrice: data.purchasePrice!,
        sellingPrice: data.sellingPrice!,
        quantity: data.quantity!,
        minimumStock: data.minimumStock!,
        description: data.description,
        status: 'Active',
        createdAt: new Date(),
      };
      serverProducts = [...serverProducts, product];
      return of(product);
    });
    productService.updateProduct.and.callFake((id, data) => {
      serverProducts = serverProducts.map((product) =>
        product.id === id ? { ...product, ...data } : product
      );
      return of(serverProducts.find((product) => product.id === id)!);
    });
    productService.deleteProduct.and.callFake((id) => {
      serverProducts = serverProducts.filter((product) => product.id !== id);
      return of(undefined);
    });

    await TestBed.configureTestingModule({
      imports: [Products],
      providers: [{ provide: ProductService, useValue: productService }],
    }).compileComponents();

    fixture = TestBed.createComponent(Products);
    component = fixture.componentInstance;
    confirmationService = fixture.debugElement.injector.get(ConfirmationService);
    messageService = fixture.debugElement.injector.get(MessageService);
    fixture.detectChanges();
  });

  it('should load products when initialized', () => {
    expect(component.products).toEqual(initialProducts);
    expect(component.filteredProducts).toEqual(initialProducts);
    expect(component.isLoading).toBeFalse();
    expect(productService.getProducts).toHaveBeenCalled();
  });

  it('should reject a purchase price of zero', () => {
    const field = component.productForm.get('purchasePrice');
    field?.setValue(0);
    field?.markAsTouched();

    expect(component.showFieldError('purchasePrice', 'min')).toBeTrue();
  });

  it('should reject a selling price of zero', () => {
    const field = component.productForm.get('sellingPrice');
    field?.setValue(0);
    field?.markAsTouched();

    expect(component.showFieldError('sellingPrice', 'min')).toBeTrue();
  });

  it('should reject a negative quantity', () => {
    const field = component.productForm.get('quantity');
    field?.setValue(-5);
    field?.markAsTouched();

    expect(component.showFieldError('quantity', 'min')).toBeTrue();
  });

  it('should reject negative minimum stock', () => {
    const field = component.productForm.get('minimumStock');
    field?.setValue(-2);
    field?.markAsTouched();

    expect(component.showFieldError('minimumStock', 'min')).toBeTrue();
  });

  it('should invalidate the form when selling price is below purchase price', () => {
    component.productForm.patchValue({ purchasePrice: 500, sellingPrice: 400 });

    expect(component.productForm.hasError('sellingPriceBelowPurchase')).toBeTrue();
  });

  it('should allow a selling price equal to or above purchase price', () => {
    component.productForm.patchValue({ purchasePrice: 500, sellingPrice: 500 });
    expect(component.productForm.hasError('sellingPriceBelowPurchase')).toBeFalse();

    component.productForm.patchValue({ sellingPrice: 600 });
    expect(component.productForm.hasError('sellingPriceBelowPurchase')).toBeFalse();
  });

  it('should let the minimum validator reject a zero purchase price', () => {
    component.productForm.patchValue({ purchasePrice: 0, sellingPrice: 600 });

    expect(component.productForm.get('purchasePrice')?.hasError('min')).toBeTrue();
    expect(component.productForm.hasError('sellingPriceBelowPurchase')).toBeFalse();
  });

  it('should create a product through the service, reload, and reset the dialog', () => {
    spyOn(messageService, 'add');
    component.openAddProductDialog();
    component.productForm.patchValue({
      name: 'Bluetooth Speaker',
      category: 'Electronics',
      purchasePrice: 800,
      sellingPrice: 1200,
      quantity: 15,
      minimumStock: 5,
      description: 'Portable Bluetooth speaker',
    });
    component.onCategoryChange('Electronics');
    component.searchText = 'bluetooth';
    component.selectedCategory = 'Electronics';

    component.saveProduct();

    expect(productService.createProduct).toHaveBeenCalledWith({
      name: 'Bluetooth Speaker',
      sku: 'ELE-001',
      category: 'Electronics',
      purchasePrice: 800,
      sellingPrice: 1200,
      quantity: 15,
      minimumStock: 5,
      description: 'Portable Bluetooth speaker',
    });
    expect(serverProducts).toHaveSize(5);
    expect(component.filteredProducts.map((product) => product.name)).toEqual([
      'Bluetooth Speaker',
    ]);
    expect(productService.getProducts).toHaveBeenCalledTimes(2);
    expect(component.addProductDialog).toBeFalse();
    expect(component.productForm.pristine).toBeTrue();
    expect(messageService.add).toHaveBeenCalledWith(
      jasmine.objectContaining({ summary: 'Product Added', severity: 'success' })
    );
  });

  it('should leave server products unchanged when form validation fails', () => {
    component.productForm.patchValue({
      name: 'Invalid Product',
      sku: 'ELE-001',
      category: 'Electronics',
      purchasePrice: 800,
      sellingPrice: 700,
    });

    component.saveProduct();

    expect(productService.createProduct).not.toHaveBeenCalled();
    expect(productService.updateProduct).not.toHaveBeenCalled();
  });

  it('should update a product through the service and send its regenerated SKU', () => {
    spyOn(messageService, 'add');
    const original = component.products[0];
    component.openEditProductDialog(original);
    component.productForm.patchValue({
      name: 'Updated Mouse',
      category: 'Furniture',
      purchasePrice: 400,
      sellingPrice: 600,
      quantity: 30,
      minimumStock: 8,
      description: 'Updated description',
    });
    component.onCategoryChange('Furniture');
    const regeneratedSku = component.productForm.get('sku')?.value;

    component.saveProduct();

    expect(productService.updateProduct).toHaveBeenCalledWith(original.id, {
      name: 'Updated Mouse',
      sku: regeneratedSku,
      category: 'Furniture',
      purchasePrice: 400,
      sellingPrice: 600,
      quantity: 30,
      minimumStock: 8,
      description: 'Updated description',
    });
    expect(serverProducts).toHaveSize(4);
    expect(component.products[0].name).toBe('Updated Mouse');
    expect(component.products[0].sku).toBe(regeneratedSku);
    expect(productService.getProducts).toHaveBeenCalledTimes(2);
    expect(component.addProductDialog).toBeFalse();
    expect(component.isEditMode).toBeFalse();
    expect(messageService.add).toHaveBeenCalledWith(
      jasmine.objectContaining({ summary: 'Product Updated', severity: 'success' })
    );
  });

  it('should open a fresh add form after closing edit mode', () => {
    component.openEditProductDialog(component.products[0]);
    component.closeAddProductDialog();
    component.openAddProductDialog();

    expect(component.addProductDialog).toBeTrue();
    expect(component.isEditMode).toBeFalse();
    expect(component.editingProductId).toBeNull();
    expect(component.productForm.getRawValue()).toEqual({
      name: '',
      sku: '',
      category: '',
      purchasePrice: null,
      sellingPrice: null,
      quantity: 0,
      minimumStock: 5,
      description: '',
    });
  });

  it('should delete a product through the service after confirmation', () => {
    spyOn(messageService, 'add');
    const product = component.products[0];
    component.searchText = 'mouse';
    component.applyFilters();
    spyOn(confirmationService, 'confirm').and.callFake((confirmation: Confirmation) => {
      confirmation.accept?.();
      return confirmationService;
    });

    component.confirmDeleteProduct(product);

    expect(productService.deleteProduct).toHaveBeenCalledWith(product.id);
    expect(serverProducts).not.toContain(product);
    expect(component.filteredProducts).toEqual([]);
    expect(productService.getProducts).toHaveBeenCalledTimes(2);
    expect(messageService.add).toHaveBeenCalledWith(
      jasmine.objectContaining({ summary: 'Product Deleted', severity: 'success' })
    );
  });

  it('should not delete a product if confirmation is not accepted', () => {
    const product = component.products[0];
    spyOn(confirmationService, 'confirm');

    component.confirmDeleteProduct(product);

    expect(productService.deleteProduct).not.toHaveBeenCalled();
    expect(serverProducts).toContain(product);
  });

  it('should load selected product details through the service', () => {
    const product = component.products[0];

    component.viewProduct(product);

    expect(productService.getProductById).toHaveBeenCalledWith(product.id);
    expect(component.viewProductDialog).toBeTrue();
    expect(component.selectedProduct).toEqual(product);

    component.closeViewProductDialog();
    expect(component.viewProductDialog).toBeFalse();
    expect(component.selectedProduct).toBeNull();
  });
});
