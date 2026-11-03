import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';

import { PurchaseService } from '../../services/purchase.service';
import {
  Purchase,
  PurchaseProductOption,
  PurchaseSupplierOption,
} from '../../models/purchase.model';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-purchases',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './purchases.html',
  styleUrl: './purchases.scss',
})
export class Purchases implements OnInit {
  private fb = inject(FormBuilder);
  private purchaseService = inject(PurchaseService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  purchases: Purchase[] = [];
  suppliers: PurchaseSupplierOption[] = [];
  products: PurchaseProductOption[] = [];

  loading = false;
  saving = false;

  purchaseDialogVisible = false;
  detailsDialogVisible = false;
  cancelDialogVisible = false;

  selectedPurchase: Purchase | null = null;

  searchText = '';
  statusFilter: string | null = null;
  cancellationReason = '';

  purchaseForm = this.fb.group({
    supplier: ['', Validators.required],
    supplierInvoiceNumber: ['', Validators.required],
    purchaseDate: [new Date(), Validators.required],
    dueDate: [null as Date | null],
    items: this.fb.array([this.createItemForm()]),
    discount: [0, [Validators.required, Validators.min(0)]],
    amountPaid: [0, [Validators.required, Validators.min(0)]],
    notes: [''],
  });

  ngOnInit(): void {
    this.loadPurchases();
    this.loadSuppliers();
    this.loadProducts();
  }

  get items(): FormArray {
    return this.purchaseForm.get('items') as FormArray;
  }

  createItemForm(): FormGroup {
    return this.fb.group({
      product: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      purchasePrice: [0, [Validators.required, Validators.min(0)]],
    });
  }

  addItem(): void {
    this.items.push(this.createItemForm());
  }

  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    }
  }

  loadPurchases(): void {
    this.loading = true;

    this.purchaseService.getPurchases().subscribe({
      next: (data) => {
        this.purchases = data;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.showError(error.error?.message || 'Unable to load purchases.');
      },
    });
  }

  loadSuppliers(): void {
    this.purchaseService.getActiveSuppliers().subscribe({
      next: (data) => (this.suppliers = data),
      error: () => this.showError('Unable to load suppliers.'),
    });
  }

  loadProducts(): void {
    this.purchaseService.getActiveProducts().subscribe({
      next: (data) => (this.products = data),
      error: () => this.showError('Unable to load products.'),
    });
  }

  getItemTotal(index: number): number {
    const item = this.items.at(index).value;
    return Number(item.quantity || 0) * Number(item.purchasePrice || 0);
  }

  get subtotal(): number {
    return this.items.controls.reduce(
      (total, item) =>
        total +
        Number(item.get('quantity')?.value || 0) *
          Number(item.get('purchasePrice')?.value || 0),
      0
    );
  }

  get discount(): number {
    return Number(this.purchaseForm.get('discount')?.value || 0);
  }

  get grandTotal(): number {
    return Math.max(0, this.subtotal - this.discount);
  }

  get amountPaid(): number {
    return Number(this.purchaseForm.get('amountPaid')?.value || 0);
  }

  get balanceDue(): number {
    return Math.max(0, this.grandTotal - this.amountPaid);
  }

  get filteredPurchases(): Purchase[] {
    const search = this.searchText.trim().toLowerCase();

    return this.purchases.filter((purchase) => {
      const matchesSearch =
        !search ||
        purchase.purchaseId?.toLowerCase().includes(search) ||
        purchase.supplierInvoiceNumber?.toLowerCase().includes(search) ||
        purchase.supplier?.supplierName?.toLowerCase().includes(search);

      const matchesStatus = !this.statusFilter || purchase.status === this.statusFilter;
      return matchesSearch && matchesStatus;
    });
  }

  get completedCount(): number {
    return this.purchases.filter((purchase) => purchase.status === 'Completed').length;
  }

  get cancelledCount(): number {
    return this.purchases.filter((purchase) => purchase.status === 'Cancelled').length;
  }

  get totalPurchaseValue(): number {
    return this.purchases
      .filter((purchase) => purchase.status === 'Completed')
      .reduce((sum, purchase) => sum + Number(purchase.grandTotal || 0), 0);
  }

  openCreateDialog(): void {
    this.purchaseForm.reset({
      supplier: '',
      supplierInvoiceNumber: '',
      purchaseDate: new Date(),
      dueDate: null,
      discount: 0,
      amountPaid: 0,
      notes: '',
    });

    this.items.clear();
    this.items.push(this.createItemForm());
    this.purchaseDialogVisible = true;
  }

  onProductChange(index: number): void {
    const productId = this.items.at(index).get('product')?.value;
    const product = this.products.find((option) => option._id === productId);

    if (product) {
      this.items.at(index).patchValue({ purchasePrice: product.purchasePrice });
    }
  }

  submitPurchase(): void {
    if (this.purchaseForm.invalid) {
      this.purchaseForm.markAllAsTouched();
      return;
    }

    if (this.discount > this.subtotal) {
      this.showError('Discount cannot exceed subtotal.');
      return;
    }

    if (this.amountPaid > this.grandTotal) {
      this.showError('Amount paid cannot exceed grand total.');
      return;
    }

    const selectedProductIds = this.items.controls.map(
      (item) => item.get('product')?.value
    );

    if (new Set(selectedProductIds).size !== selectedProductIds.length) {
      this.showError('A product can only be added once per purchase.');
      return;
    }

    this.saving = true;
    const formValue = this.purchaseForm.getRawValue();

    const payload = {
      supplier: formValue.supplier!,
      supplierInvoiceNumber: formValue.supplierInvoiceNumber!,
      purchaseDate: this.toDateString(formValue.purchaseDate!),
      dueDate: formValue.dueDate ? this.toDateString(formValue.dueDate) : null,
      items: formValue.items.map((item) => ({
        product: item['product']!,
        quantity: Number(item['quantity']),
        purchasePrice: Number(item['purchasePrice']),
      })),
      discount: Number(formValue.discount || 0),
      amountPaid: Number(formValue.amountPaid || 0),
      notes: formValue.notes || '',
    };

    this.purchaseService.createPurchase(payload).subscribe({
      next: (response) => {
        this.saving = false;
        this.purchaseDialogVisible = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: response.message || 'Purchase created successfully.',
        });
        this.loadPurchases();
        this.loadProducts();
      },
      error: (error) => {
        this.saving = false;
        this.showError(error.error?.message || 'Unable to create purchase.');
      },
    });
  }

  viewPurchase(purchase: Purchase): void {
    this.selectedPurchase = purchase;
    this.detailsDialogVisible = true;
  }

  openCancelDialog(purchase: Purchase): void {
    this.selectedPurchase = purchase;
    this.cancellationReason = '';
    this.cancelDialogVisible = true;
  }

  cancelPurchase(): void {
    if (!this.selectedPurchase?._id || !this.cancellationReason.trim()) {
      this.showError('Please enter a cancellation reason.');
      return;
    }

    this.saving = true;

    this.purchaseService.cancelPurchase(
      this.selectedPurchase._id,
      this.cancellationReason.trim()
    ).subscribe({
      next: (response) => {
        this.saving = false;
        this.cancelDialogVisible = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Purchase Cancelled',
          detail: response.message || 'Purchase cancelled successfully.',
        });
        this.loadPurchases();
        this.loadProducts();
      },
      error: (error) => {
        this.saving = false;
        this.showError(error.error?.message || 'Unable to cancel purchase.');
      },
    });
  }

  getPaymentStatus(purchase: Purchase): string {
    return purchase.paymentStatus || 'Unpaid';
  }

  getStatusSeverity(status: string): 'success' | 'danger' | 'warn' | 'info' {
    if (status === 'Completed' || status === 'Paid') return 'success';
    if (status === 'Cancelled') return 'danger';
    if (status === 'Partial') return 'warn';
    return 'info';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(value || 0);
  }

  private toDateString(date: Date | string): string {
    const value = new Date(date);
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private showError(detail: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail,
    });
  }

  getProductName(product: string | { name: string }): string {
    return typeof product === 'string' ? product : product.name;
  }
}
