import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Confirmation, ConfirmationService, MessageService } from 'primeng/api';

import { Products } from './products';

describe('Products', () => {
  let component: Products;
  let fixture: ComponentFixture<Products>;
  let confirmationService: ConfirmationService;
  let messageService: MessageService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Products]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Products);
    component = fixture.componentInstance;
    confirmationService = fixture.debugElement.injector.get(ConfirmationService);
    messageService = fixture.debugElement.injector.get(MessageService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
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
    component.productForm.patchValue({
      purchasePrice: 500,
      sellingPrice: 400,
    });

    expect(component.productForm.hasError('sellingPriceBelowPurchase')).toBeTrue();
  });

  it('should allow a selling price equal to purchase price', () => {
    component.productForm.patchValue({ purchasePrice: 500, sellingPrice: 500 });

    expect(component.productForm.hasError('sellingPriceBelowPurchase')).toBeFalse();
  });

  it('should allow a selling price above purchase price', () => {
    component.productForm.patchValue({ purchasePrice: 500, sellingPrice: 600 });

    expect(component.productForm.hasError('sellingPriceBelowPurchase')).toBeFalse();
  });

  it('should let the minimum validator reject a zero purchase price', () => {
    component.productForm.patchValue({ purchasePrice: 0, sellingPrice: 600 });

    expect(component.productForm.get('purchasePrice')?.hasError('min')).toBeTrue();
    expect(component.productForm.hasError('sellingPriceBelowPurchase')).toBeFalse();
  });

  it('should add a valid product, apply current filters, and close and reset the dialog', () => {
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
    component.applyFilters();

    component.saveProduct();

    expect(component.products.length).toBe(5);
    expect(component.products[4]).toEqual(
      jasmine.objectContaining({
        name: 'Bluetooth Speaker',
        sku: 'ELE-001',
        category: 'Electronics',
        purchasePrice: 800,
        sellingPrice: 1200,
        quantity: 15,
        minimumStock: 5,
        description: 'Portable Bluetooth speaker',
        status: 'Active',
      })
    );
    expect(component.products[4].id).toBeTruthy();
    expect(component.filteredProducts).toContain(component.products[4]);
    expect(component.addProductDialog).toBeFalse();
    expect(component.productForm.pristine).toBeTrue();
    expect(messageService.add).toHaveBeenCalledWith({
      severity: 'success',
      summary: 'Product Added',
      detail: 'New product added successfully.',
      life: 3000,
    });
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

  it('should keep a saved product out of results when it does not match active filters', () => {
    component.productForm.patchValue({
      name: 'Bluetooth Speaker',
      category: 'Electronics',
      purchasePrice: 800,
      sellingPrice: 1200,
    });
    component.onCategoryChange('Electronics');
    component.searchText = 'mouse';
    component.applyFilters();

    component.saveProduct();

    expect(component.products.length).toBe(5);
    expect(component.filteredProducts.map((product) => product.name)).toEqual([
      'Wireless Mouse',
    ]);
  });

  it('should update an existing product and persist the regenerated SKU without adding a row', () => {
    spyOn(messageService, 'add');
    const originalProduct = component.products[0];
    const originalCreatedAt = originalProduct.createdAt;

    component.openEditProductDialog(originalProduct);

    expect(component.addProductDialog).toBeTrue();
    expect(component.isEditMode).toBeTrue();
    expect(component.productForm.getRawValue()).toEqual({
      name: originalProduct.name,
      sku: originalProduct.sku,
      category: originalProduct.category,
      purchasePrice: originalProduct.purchasePrice,
      sellingPrice: originalProduct.sellingPrice,
      quantity: originalProduct.quantity,
      minimumStock: originalProduct.minimumStock,
      description: originalProduct.description,
    });

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

    expect(component.products.length).toBe(4);
    expect(component.products[0]).toEqual({
      ...originalProduct,
      name: 'Updated Mouse',
      sku: regeneratedSku,
      category: 'Furniture',
      purchasePrice: 400,
      sellingPrice: 600,
      quantity: 30,
      minimumStock: 8,
      description: 'Updated description',
    });
    expect(regeneratedSku).toBe('FUR-001');
    expect(component.products[0].sku).toBe(regeneratedSku);
    expect(component.products[0].createdAt).toBe(originalCreatedAt);
    expect(component.filteredProducts).toContain(component.products[0]);
    expect(component.addProductDialog).toBeFalse();
    expect(component.isEditMode).toBeFalse();
    expect(component.editingProductId).toBeNull();
    expect(component.productForm.pristine).toBeTrue();
    expect(messageService.add).toHaveBeenCalledWith({
      severity: 'success',
      summary: 'Product Updated',
      detail: 'Product updated successfully.',
      life: 3000,
    });
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

  it('should delete a product only after confirmation and refresh filtered results', () => {
    spyOn(messageService, 'add');
    const productToDelete = component.products[0];
    component.searchText = 'mouse';
    component.applyFilters();
    spyOn(confirmationService, 'confirm').and.callFake((confirmation: Confirmation) => {
      confirmation.accept?.();
      return confirmationService;
    });

    component.confirmDeleteProduct(productToDelete);

    expect(confirmationService.confirm).toHaveBeenCalledWith(
      jasmine.objectContaining({
        header: 'Delete Product',
        message: 'Are you sure you want to delete "Wireless Mouse"?',
        acceptLabel: 'Delete',
        rejectLabel: 'Cancel',
      })
    );
    expect(component.products).not.toContain(productToDelete);
    expect(component.filteredProducts).toEqual([]);
    expect(messageService.add).toHaveBeenCalledWith({
      severity: 'success',
      summary: 'Product Deleted',
      detail: 'Wireless Mouse deleted successfully.',
      life: 3000,
    });
  });

  it('should keep the product when deletion is not accepted', () => {
    const productToKeep = component.products[0];
    spyOn(confirmationService, 'confirm');

    component.confirmDeleteProduct(productToKeep);

    expect(component.products).toContain(productToKeep);
    expect(component.filteredProducts).toContain(productToKeep);
  });

  it('should display and clear the selected product in the view dialog', () => {
    const product = component.products[0];
    const originalProducts = [...component.products];

    component.viewProduct(product);

    expect(component.viewProductDialog).toBeTrue();
    expect(component.selectedProduct).toBe(product);
    expect(component.products).toEqual(originalProducts);
    expect(component.isEditMode).toBeFalse();

    component.closeViewProductDialog();

    expect(component.viewProductDialog).toBeFalse();
    expect(component.selectedProduct).toBeNull();
  });
});
