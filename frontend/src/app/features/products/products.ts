import { Component } from '@angular/core';
import { Product } from '../../models';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';

const sellingPriceValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const purchasePrice = control.get('purchasePrice')?.value;
  const sellingPrice = control.get('sellingPrice')?.value;

  if (
    purchasePrice === null ||
    sellingPrice === null ||
    purchasePrice === '' ||
    sellingPrice === ''
  ) {
    return null;
  }

  return Number(sellingPrice) < Number(purchasePrice)
    ? { sellingPriceBelowPurchase: true }
    : null;
};

@Component({
  selector: 'app-products',
  imports: [
    CommonModule,
    TableModule,
    FormsModule,
    SelectModule,
    TooltipModule,
    DialogModule,
    ButtonModule,
    ReactiveFormsModule,
    ConfirmDialogModule,
    ToastModule,
  ],
  templateUrl: './products.html',
  styleUrl: './products.scss',
  providers: [ConfirmationService, MessageService],
})
export class Products {
  productForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {
    this.productForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(3)]],
        sku: ['', Validators.required],
        category: ['', Validators.required],
        purchasePrice: [null as number | null, [Validators.required, Validators.min(0.01)]],
        sellingPrice: [null as number | null, [Validators.required, Validators.min(0.01)]],
        quantity: [0, [Validators.required, Validators.min(0)]],
        minimumStock: [5, [Validators.required, Validators.min(0)]],
        description: [''],
      },
      {
        validators: sellingPriceValidator,
      }
    );
  }

  searchText = '';
  addProductDialog = false;
  selectedProduct: Product | null = null;
  viewProductDialog = false;
  isEditMode = false;
  editingProductId: string | null = null;
  products: Product[] = [
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

  categories = [
    { label: 'All Categories', value: 'All Categories' },
    { label: 'Electronics', value: 'Electronics' },
    { label: 'Furniture', value: 'Furniture' },
    { label: 'Stationery', value: 'Stationery' },
  ];

  stockStatuses = [
    { label: 'All Stock Status', value: 'All' },
    { label: 'In Stock', value: 'In Stock' },
    { label: 'Low Stock', value: 'Low Stock' },
    { label: 'Out of Stock', value: 'Out of Stock' },
  ];

  selectedCategory = 'All Categories';
  selectedStockStatus = 'All';

  filteredProducts: Product[] = [...this.products];

  getStockStatus(quantity: number, minimumStock: number): string {
    if (quantity === 0) {
      return 'Out of Stock';
    }

    if (quantity <= minimumStock) {
      return 'Low Stock';
    }

    return 'In Stock';
  }

  applyFilters(): void {
    const search = this.searchText.trim().toLowerCase();

    this.filteredProducts = this.products.filter((product) => {
      const searchMatch =
        product.name.toLowerCase().includes(search) ||
        product.sku.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search);

      const categoryMatch =
        this.selectedCategory === 'All Categories' ||
        product.category === this.selectedCategory;

      const stockStatus = this.getStockStatus(
        product.quantity,
        product.minimumStock
      );

      const stockMatch =
        this.selectedStockStatus === 'All' ||
        stockStatus === this.selectedStockStatus;

      return searchMatch && categoryMatch && stockMatch;
    });
  }

  resetFilters(): void {
    this.selectedCategory = 'All Categories';
    this.selectedStockStatus = 'All';
    this.searchText = '';

    this.applyFilters();
  }

  openAddProductDialog(): void {
    this.resetProductForm();
    this.addProductDialog = true;
  }

  closeAddProductDialog(): void {
    this.addProductDialog = false;
    this.resetProductForm();
  }

  resetProductForm(): void {
    this.productForm.reset({
      name: '',
      sku: '',
      category: '',
      purchasePrice: null,
      sellingPrice: null,
      quantity: 0,
      minimumStock: 5,
      description: '',
    });

    this.isEditMode = false;
    this.editingProductId = null;
  }

  openEditProductDialog(product: Product): void {
    this.isEditMode = true;
    this.editingProductId = product.id;

    this.productForm.patchValue({
      name: product.name,
      sku: product.sku,
      category: product.category,
      purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice,
      quantity: product.quantity,
      minimumStock: product.minimumStock,
      description: product.description ?? '',
    });

    this.addProductDialog = true;
  }

  viewProduct(product: Product): void {
    this.selectedProduct = product;
    this.viewProductDialog = true;
  }

  closeViewProductDialog(): void {
    this.viewProductDialog = false;
    this.selectedProduct = null;
  }

  generateSku(category: string): string {
    const prefixMap: Record<string, string> = {
      Electronics: 'ELE',
      Furniture: 'FUR',
      Stationery: 'STA'
    };

    const prefix = prefixMap[category];

    if (!prefix) {
      return '';
    }

    const existingNumbers = this.products
      .filter(product => product.id !== this.editingProductId)
      .filter(product => product.sku.startsWith(`${prefix}-`))
      .map(product => Number(product.sku.split('-')[1]))
      .filter(number => Number.isInteger(number));

    const nextNumber = Math.max(0, ...existingNumbers) + 1;

    return `${prefix}-${String(nextNumber).padStart(3, '0')}`;
  }

  onCategoryChange(category: string): void {
    const sku = this.generateSku(category);

    this.productForm.patchValue({
      sku: sku
    });
  }

  showFieldError(fieldName: string, errorName: string): boolean {
    const field = this.productForm.get(fieldName);

    return !!field?.touched && !!field.hasError(errorName);
  }

  saveProduct(): void {
    this.productForm.markAllAsTouched();

    if (this.productForm.invalid) {
      return;
    }

    const formValue = this.productForm.getRawValue();

    if (this.isEditMode && this.editingProductId) {
      this.products = this.products.map((product) =>
        product.id === this.editingProductId
          ? {
            ...product,
            name: formValue.name.trim(),
            sku: formValue.sku,
            category: formValue.category,
            purchasePrice: Number(formValue.purchasePrice),
            sellingPrice: Number(formValue.sellingPrice),
            quantity: Number(formValue.quantity),
            minimumStock: Number(formValue.minimumStock),
            description: formValue.description ?? '',
          }
          : product
      );

      this.messageService.add({
        severity: 'success',
        summary: 'Product Updated',
        detail: 'Product updated successfully.',
        life: 3000,
      });
    } else {
      const newProduct: Product = {
        id: crypto.randomUUID(),
        name: formValue.name.trim(),
        sku: formValue.sku,
        category: formValue.category,
        purchasePrice: Number(formValue.purchasePrice),
        sellingPrice: Number(formValue.sellingPrice),
        quantity: Number(formValue.quantity),
        minimumStock: Number(formValue.minimumStock),
        description: formValue.description ?? '',
        status: 'Active',
        createdAt: new Date(),
      };

      this.products = [...this.products, newProduct];

      this.messageService.add({
        severity: 'success',
        summary: 'Product Added',
        detail: 'New product added successfully.',
        life: 3000,
      });
    }

    this.applyFilters();
    this.closeAddProductDialog();
  }

  confirmDeleteProduct(product: Product): void {
    this.confirmationService.confirm({
      header: 'Delete Product',
      message: `Are you sure you want to delete "${product.name}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
        this.products = this.products.filter((item) => item.id !== product.id);
        this.applyFilters();

        this.messageService.add({
          severity: 'success',
          summary: 'Product Deleted',
          detail: `${product.name} deleted successfully.`,
          life: 3000,
        });
      },
    });
  }

  isInvalid(fieldName: string): boolean {
    const field = this.productForm.get(fieldName);

    return !!field && field.invalid && (field.dirty || field.touched);
  }
}
