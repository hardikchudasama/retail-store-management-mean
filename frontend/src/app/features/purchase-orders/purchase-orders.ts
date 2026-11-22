import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { FormsModule } from '@angular/forms';

import { MessageService, ConfirmationService } from 'primeng/api';
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
import { TooltipModule } from 'primeng/tooltip';
import { TextareaModule } from 'primeng/textarea';

import {
  CreatePurchaseOrderRequest,
  PurchaseOrder,
  PurchaseOrderItem,
} from '../../models/purchase-order.model';

import {
  PurchaseProductOption,
  PurchaseSupplierOption,
} from '../../models/purchase.model';

import { PurchaseOrderService } from '../../services/purchase-order.service';

@Component({
  selector: 'app-purchase-orders',
  standalone: true,
  imports: [
    CommonModule,
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
    TextareaModule,
    FormsModule,
  ],
  templateUrl: './purchase-orders.html',
  styleUrl: './purchase-orders.scss',
  providers: [MessageService, ConfirmationService],
})
export class PurchaseOrders implements OnInit {
  readonly Math = Math;

  private readonly fb = inject(FormBuilder);
  private readonly purchaseOrderService = inject(PurchaseOrderService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  purchaseOrders: PurchaseOrder[] = [];
  suppliers: PurchaseSupplierOption[] = [];
  products: PurchaseProductOption[] = [];

  loading = false;
  saving = false;

  purchaseOrderDialogVisible = false;
  detailsDialogVisible = false;
  isEditMode = false;

  selectedPurchaseOrder: PurchaseOrder | null = null;

  searchText = '';

  purchaseOrderForm = this.fb.group({
    supplier: ['', Validators.required],
    orderDate: [new Date(), Validators.required],
    expectedDeliveryDate: [null as Date | null],
    items: this.fb.array([]),
    notes: [''],
  });

  ngOnInit(): void {
    this.loadInitialData();
  }

  // --------------------------------------------------
  // INITIAL DATA
  // --------------------------------------------------

  loadInitialData(): void {
    this.loading = true;

    this.loadSuppliers();
    this.loadProducts();
    this.loadPurchaseOrders();
  }

  loadSuppliers(): void {
    this.purchaseOrderService.getActiveSuppliers().subscribe({
      next: suppliers => {
        this.suppliers = suppliers;
      },
      error: error => {
        console.error('Error loading suppliers:', error);
        this.showError('Unable to load suppliers.');
      },
    });
  }

  loadProducts(): void {
    this.purchaseOrderService.getActiveProducts().subscribe({
      next: products => {
        this.products = products;
      },
      error: error => {
        console.error('Error loading products:', error);
        this.showError('Unable to load products.');
      },
    });
  }

  loadPurchaseOrders(): void {
    this.loading = true;

    this.purchaseOrderService.getPurchaseOrders().subscribe({
      next: purchaseOrders => {
        this.purchaseOrders = purchaseOrders;
        this.loading = false;
      },
      error: error => {
        console.error('Error loading purchase orders:', error);
        this.loading = false;
        this.showError('Unable to load purchase orders.');
      },
    });
  }

  // --------------------------------------------------
  // FORM ARRAY
  // --------------------------------------------------

  get items(): FormArray {
    return this.purchaseOrderForm.get('items') as FormArray;
  }

  createItemFormGroup(item?: PurchaseOrderItem): FormGroup {
    const productId =
      typeof item?.product === 'string'
        ? item.product
        : item?.product?._id ?? '';

    return this.fb.group({
      product: [productId, Validators.required],
      orderedQuantity: [
        item?.orderedQuantity ?? 1,
        [Validators.required, Validators.min(1)],
      ],
      estimatedPurchasePrice: [
        item?.estimatedPurchasePrice ?? 0,
        [Validators.required, Validators.min(0.01)],
      ],
    });
  }

  addItem(): void {
    this.items.push(this.createItemFormGroup());
  }

  removeItem(index: number): void {
    if (this.items.length === 1) {
      this.showError('At least one product is required.');
      return;
    }

    this.items.removeAt(index);
  }

  onProductChange(index: number): void {
    const itemForm = this.items.at(index);

    const productId = itemForm.get('product')?.value;

    const selectedProduct = this.products.find(
      product => product._id === productId
    );

    if (selectedProduct) {
      itemForm.patchValue({
        estimatedPurchasePrice: selectedProduct.purchasePrice,
      });
    }
  }

  // --------------------------------------------------
  // CALCULATIONS
  // --------------------------------------------------

  get subtotal(): number {
    return this.items.controls.reduce((total, control) => {
      const quantity = Number(control.get('orderedQuantity')?.value) || 0;
      const price =
        Number(control.get('estimatedPurchasePrice')?.value) || 0;

      return total + quantity * price;
    }, 0);
  }

  getTotalForItem(index: number): number {
    const item = this.items.at(index);

    const quantity = Number(item.get('orderedQuantity')?.value) || 0;
    const price =
      Number(item.get('estimatedPurchasePrice')?.value) || 0;

    return quantity * price;
  }

  get totalProducts(): number {
    return this.items.length;
  }

  // --------------------------------------------------
  // CREATE PURCHASE ORDER
  // --------------------------------------------------

  openCreateDialog(): void {
    this.isEditMode = false;
    this.selectedPurchaseOrder = null;

    this.purchaseOrderForm.reset({
      supplier: '',
      orderDate: new Date(),
      expectedDeliveryDate: null,
      notes: '',
    });

    this.items.clear();
    this.addItem();

    this.purchaseOrderDialogVisible = true;
  }

  saveAsDraft(): void {
    this.savePurchaseOrder('Draft');
  }

  placePurchaseOrder(): void {
    if (this.isEditMode && this.selectedPurchaseOrder) {
      this.confirmPlacePurchaseOrder(this.selectedPurchaseOrder);
      return;
    }

    this.confirmationService.confirm({
      header: 'Place Purchase Order',
      message:
        'Are you sure you want to place this purchase order? Once placed, its products and quantities cannot be edited.',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Place Order',
      rejectLabel: 'Go Back',
      accept: () => {
        this.savePurchaseOrder('Ordered');
      },
    });
  }

  private savePurchaseOrder(targetStatus: 'Draft' | 'Ordered'): void {
    if (this.purchaseOrderForm.invalid) {
      this.purchaseOrderForm.markAllAsTouched();
      this.showError('Please complete all required fields.');
      return;
    }

    if (this.items.length === 0) {
      this.showError('Please add at least one product.');
      return;
    }

    const payload = this.buildPayload();

    this.saving = true;

    if (this.isEditMode && this.selectedPurchaseOrder) {
      this.updateDraft(payload);
      return;
    }

    this.purchaseOrderService.createPurchaseOrder(payload).subscribe({
      next: response => {
        const createdOrder = response.data;

        if (targetStatus === 'Draft') {
          this.saving = false;
          this.purchaseOrderDialogVisible = false;

          this.showSuccess('Purchase Order saved as Draft.');
          this.loadPurchaseOrders();
          return;
        }

        this.purchaseOrderService
          .placePurchaseOrder(createdOrder._id)
          .subscribe({
            next: () => {
              this.saving = false;
              this.purchaseOrderDialogVisible = false;

              this.showSuccess('Purchase Order placed successfully.');
              this.loadPurchaseOrders();
            },
            error: error => {
              console.error('Error placing purchase order:', error);

              this.saving = false;
              this.purchaseOrderDialogVisible = false;

              this.showError(
                'Purchase Order was saved as Draft, but could not be placed. You can place it from the list.'
              );

              this.loadPurchaseOrders();
            },
          });
      },
      error: error => {
        console.error('Error creating purchase order:', error);
        this.saving = false;
        this.showError(
          error.error?.message || 'Unable to create Purchase Order.'
        );
      },
    });
  }

  private buildPayload(): CreatePurchaseOrderRequest {
    const formValue = this.purchaseOrderForm.getRawValue();
    const formItems = formValue.items as Array<{
      product: string;
      orderedQuantity: number;
      estimatedPurchasePrice: number;
    }>

    return {
      supplier: formValue.supplier!,
      orderDate: this.formatDate(formValue.orderDate ?? new Date()),
      expectedDeliveryDate: formValue.expectedDeliveryDate
        ? this.formatDate(formValue.expectedDeliveryDate)
        : null,
      items: formItems.map(item => ({
        product: item.product,
        orderedQuantity: Number(item.orderedQuantity),
        estimatedPurchasePrice: Number(item.estimatedPurchasePrice),
      })),
      notes: formValue.notes || '',
    };
  }

  private updateDraft(payload: CreatePurchaseOrderRequest): void {
    const orderId = this.selectedPurchaseOrder?._id;

    if (!orderId) {
      this.saving = false;
      return;
    }

    this.purchaseOrderService
      .updateDraftPurchaseOrder(orderId, payload)
      .subscribe({
        next: () => {
          this.saving = false;
          this.purchaseOrderDialogVisible = false;

          this.showSuccess('Draft Purchase Order updated successfully.');
          this.loadPurchaseOrders();
        },
        error: error => {
          console.error('Error updating purchase order:', error);
          this.saving = false;
          this.showError(
            error.error?.message || 'Unable to update Purchase Order.'
          );
        },
      });
  }

  // --------------------------------------------------
  // EDIT DRAFT
  // --------------------------------------------------

  editPurchaseOrder(order: PurchaseOrder): void {
    if (order.status !== 'Draft') {
      this.showError('Only Draft Purchase Orders can be edited.');
      return;
    }

    this.isEditMode = true;
    this.selectedPurchaseOrder = order;

    const supplierId =
      typeof order.supplier === 'string'
        ? order.supplier
        : order.supplier._id;

    this.purchaseOrderForm.patchValue({
      supplier: supplierId,
      orderDate: new Date(order.orderDate),
      expectedDeliveryDate: order.expectedDeliveryDate
        ? new Date(order.expectedDeliveryDate)
        : null,
      notes: order.notes || '',
    });

    this.items.clear();

    order.items.forEach(item => {
      this.items.push(this.createItemFormGroup(item));
    });

    this.purchaseOrderDialogVisible = true;
  }

  // --------------------------------------------------
  // PLACE PURCHASE ORDER
  // --------------------------------------------------

  confirmPlacePurchaseOrder(order: PurchaseOrder): void {
    if (order.status !== 'Draft') {
      this.showError('Only Draft Purchase Orders can be placed.');
      return;
    }

    this.confirmationService.confirm({
      header: 'Place Purchase Order',
      message: `Are you sure you want to place ${order.purchaseOrderNumber}? You cannot edit it after placing.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Place Order',
      rejectLabel: 'Cancel',
      accept: () => {
        this.purchaseOrderService
          .placePurchaseOrder(order._id)
          .subscribe({
            next: () => {
              this.showSuccess('Purchase Order placed successfully.');
              this.loadPurchaseOrders();
            },
            error: error => {
              console.error('Error placing purchase order:', error);
              this.showError(
                error.error?.message || 'Unable to place Purchase Order.'
              );
            },
          });
      },
    });
  }

  // --------------------------------------------------
  // VIEW PURCHASE ORDER
  // --------------------------------------------------

  viewPurchaseOrder(order: PurchaseOrder): void {
    this.selectedPurchaseOrder = order;
    this.detailsDialogVisible = true;
  }

  getSupplierName(order: PurchaseOrder): string {
    if (typeof order.supplier === 'string') {
      const supplier = this.suppliers.find(
        item => item._id === order.supplier
      );

      return supplier?.supplierName || 'Unknown Supplier';
    }

    return order.supplier?.supplierName || 'Unknown Supplier';
  }

  getProductName(item: PurchaseOrderItem): string {
    if (typeof item.product === 'string') {
      const product = this.products.find(
        product => product._id === item.product
      );

      return product?.name || 'Unknown Product';
    }

    return item.product?.name || 'Unknown Product';
  }

  getTotalOrderedQuantity(order: PurchaseOrder): number {
    return order.items.reduce(
      (total, item) => total + (Number(item.orderedQuantity) || 0),
      0
    );
  }

  getTotalReceivedQuantity(order: PurchaseOrder): number {
    return order.items.reduce(
      (total, item) => total + (Number(item.receivedQuantity) || 0),
      0
    );
  }

  getTotalPendingQuantity(order: PurchaseOrder): number {
    return order.items.reduce((total, item) => {
      const ordered = Number(item.orderedQuantity) || 0;
      const received = Number(item.receivedQuantity) || 0;

      return total + Math.max(ordered - received, 0);
    }, 0);
  }

  // --------------------------------------------------
  // CANCEL PURCHASE ORDER
  // --------------------------------------------------

  cancelPurchaseOrder(order: PurchaseOrder): void {
    if (!['Draft', 'Ordered'].includes(order.status)) {
      this.showError('This Purchase Order cannot be cancelled.');
      return;
    }

    this.confirmationService.confirm({
      header: 'Cancel Purchase Order',
      message: `Are you sure you want to cancel ${order.purchaseOrderNumber}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes, Cancel',
      rejectLabel: 'No',
      accept: () => {
        this.purchaseOrderService
          .cancelPurchaseOrder(order._id, 'Cancelled by user')
          .subscribe({
            next: () => {
              this.showSuccess('Purchase Order cancelled successfully.');
              this.loadPurchaseOrders();
            },
            error: error => {
              console.error('Error cancelling purchase order:', error);
              this.showError(
                error.error?.message || 'Unable to cancel Purchase Order.'
              );
            },
          });
      },
    });
  }

  // --------------------------------------------------
  // STATUS / SEARCH / FORMATTING
  // --------------------------------------------------

  get filteredPurchaseOrders(): PurchaseOrder[] {
    const search = this.searchText.trim().toLowerCase();

    if (!search) {
      return this.purchaseOrders;
    }

    return this.purchaseOrders.filter(order => {
      const orderNumber =
        order.purchaseOrderNumber?.toLowerCase() || '';

      const supplierName = this.getSupplierName(order).toLowerCase();

      return (
        orderNumber.includes(search) ||
        supplierName.includes(search) ||
        order.status.toLowerCase().includes(search)
      );
    });
  }

  get draftOrdersCount(): number {
    return this.purchaseOrders.filter(order => order.status === 'Draft').length;
  }

  get pendingOrdersCount(): number {
    return this.purchaseOrders.filter(order =>
      order.status === 'Ordered' || order.status === 'Partially Received'
    ).length;
  }

  get receivedOrdersCount(): number {
    return this.purchaseOrders.filter(order => order.status === 'Received').length;
  }

  getStatusSeverity(
    status: string
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 'Received':
        return 'success';

      case 'Partially Received':
        return 'warn';

      case 'Ordered':
        return 'info';

      case 'Draft':
        return 'secondary';

      case 'Cancelled':
        return 'danger';

      default:
        return 'secondary';
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(value || 0);
  }

  private formatDate(value: string | Date): string {
    const date = new Date(value);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private showSuccess(message: string): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: message,
    });
  }

  private showError(message: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
    });
  }
}
