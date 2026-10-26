import { Component, OnInit } from '@angular/core';
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
import { ProductService } from '../../services/product.service';
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
export class Products implements OnInit {
  productForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private productService: ProductService
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
  products: Product[] = [];

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

  filteredProducts: Product[] = [];
  isLoading = false;

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading = true;

    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load products:', error);

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'Failed to load products.',
        });

        this.isLoading = false;
      },
    });
  }

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
    this.productService.getProductById(product.id).subscribe({
      next: (selectedProduct) => {
        this.selectedProduct = selectedProduct;
        this.viewProductDialog = true;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'Failed to load product details.',
        });
      },
    });
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
    const productData = {
      name: formValue.name.trim(),
      sku: formValue.sku,
      category: formValue.category,
      purchasePrice: Number(formValue.purchasePrice),
      sellingPrice: Number(formValue.sellingPrice),
      quantity: Number(formValue.quantity),
      minimumStock: Number(formValue.minimumStock),
      description: formValue.description ?? '',
    };

    if (this.isEditMode && this.editingProductId) {
      this.productService
        .updateProduct(this.editingProductId, productData)
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Product Updated',
              detail: 'Product updated successfully.',
            });

            this.loadProducts();
            this.closeAddProductDialog();
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Update Failed',
              detail: error.error?.message || 'Failed to update product.',
            });
          },
        });
    } else {
      this.productService.createProduct(productData).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Product Added',
            detail: 'New product added successfully.',
          });

          this.loadProducts();
          this.closeAddProductDialog();
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Add Failed',
            detail: error.error?.message || 'Failed to add product.',
          });
        },
      });
    }
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
        this.productService.deleteProduct(product.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Product Deleted',
              detail: `${product.name} deleted successfully.`,
            });

            this.loadProducts();
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Delete Failed',
              detail: error.error?.message || 'Failed to delete product.',
            });
          },
        });
      },
    });
  }

  isInvalid(fieldName: string): boolean {
    const field = this.productForm.get(fieldName);

    return !!field && field.invalid && (field.dirty || field.touched);
  }
}
