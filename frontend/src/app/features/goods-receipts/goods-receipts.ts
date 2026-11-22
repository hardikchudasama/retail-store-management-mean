import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

import { GoodsReceiptService } from '../../services/goods-receipt.service';
import {
  GoodsReceipt,
  CreateGoodsReceiptItem
} from '../../models/goods-receipt.model';
import { PurchaseOrder } from '../../models/purchase-order.model';

@Component({
  selector: 'app-goods-receipts',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    DatePickerModule,
    TextareaModule,
    SelectModule,
    ToastModule,
    TooltipModule
  ],
  providers: [MessageService],
  templateUrl: './goods-receipts.html',
  styleUrl: './goods-receipts.scss'
})
export class GoodsReceipts implements OnInit {

  goodsReceipts: GoodsReceipt[] = [];
  purchaseOrders: PurchaseOrder[] = [];

  selectedReceipt: GoodsReceipt | null = null;

  loading = false;
  submitting = false;

  createDialogVisible = false;
  viewDialogVisible = false;

  searchValue = '';

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private goodsReceiptService: GoodsReceiptService,
    private messageService: MessageService
  ) {
    this.form = this.fb.group({
      purchaseOrder: ['', Validators.required],
      receiptDate: [new Date(), Validators.required],
      notes: [''],
      items: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadGoodsReceipts();
    this.loadPurchaseOrders();
  }

  // FormArray getter
  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  // Load all Goods Receipts
  loadGoodsReceipts(): void {
    this.loading = true;

    this.goodsReceiptService.getGoodsReceipts().subscribe({
      next: (response) => {
        this.goodsReceipts = response;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'Unable to load Goods Receipts.'
        });
      }
    });
  }

  // Load eligible Purchase Orders
  loadPurchaseOrders(): void {
    this.goodsReceiptService.getPurchaseOrders().subscribe({
      next: (response) => {
        this.purchaseOrders = response.filter((order: PurchaseOrder) =>
          ['Ordered', 'Partially Received'].includes(order.status)
        );
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Unable to load Purchase Orders.'
        });
      }
    });
  }

  // Open Create Goods Receipt dialog
  openCreateDialog(): void {
    this.form.reset({
      purchaseOrder: '',
      receiptDate: new Date(),
      notes: ''
    });

    this.items.clear();
    this.createDialogVisible = true;
  }

  // Handle Purchase Order selection
  onPurchaseOrderChange(purchaseOrderId: string): void {
    this.items.clear();

    const selectedOrder = this.purchaseOrders.find(
      order => order._id === purchaseOrderId
    );

    if (!selectedOrder) {
      return;
    }

    selectedOrder.items.forEach((item) => {
      const receivedQuantity = item.receivedQuantity || 0;
      const pendingQuantity = item.orderedQuantity - receivedQuantity;

      if (pendingQuantity <= 0) {
        return;
      }

      const product = item.product;

      const productId =
        typeof product === 'string' ? product : product._id;

      const productName =
        typeof product === 'string' ? 'Product' : product.name;

      const productSku =
        typeof product === 'string' ? '' : product.sku || '';

      this.items.push(
        this.fb.group({
          product: [productId],
          productName: [productName],
          productSku: [productSku],
          orderedQuantity: [item.orderedQuantity],
          receivedQuantity: [receivedQuantity],
          pendingQuantity: [pendingQuantity],
          receivingNow: [
            null,
            [
              Validators.min(1),
              Validators.max(pendingQuantity)
            ]
          ],
          purchasePrice: [
            item.estimatedPurchasePrice,
            [Validators.min(0.01)]
          ]
        })
      );
    });
  }

  // Create Goods Receipt
  submitGoodsReceipt(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();

    const receiptItems: CreateGoodsReceiptItem[] =
      formValue.items
        .filter((item: any) =>
          Number(item.receivingNow) > 0
        )
        .map((item: any) => {
          const receiptItem: CreateGoodsReceiptItem = {
            product: item.product,
            receivedQuantity: Number(item.receivingNow)
          };

          if (
            item.purchasePrice !== null &&
            item.purchasePrice !== undefined &&
            item.purchasePrice !== ''
          ) {
            receiptItem.purchasePrice = Number(item.purchasePrice);
          }

          return receiptItem;
        });

    if (receiptItems.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please enter a quantity for at least one product.'
      });
      return;
    }

    const receiptDate = new Date(formValue.receiptDate)
      .toISOString()
      .split('T')[0];

    const payload = {
      purchaseOrder: formValue.purchaseOrder,
      receiptDate,
      items: receiptItems,
      notes: formValue.notes || ''
    };

    this.submitting = true;

    this.goodsReceiptService.createGoodsReceipt(payload).subscribe({
      next: (response) => {
        this.submitting = false;
        this.createDialogVisible = false;

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `${response.goodsReceiptNumber} created successfully.`
        });

        this.loadGoodsReceipts();
        this.loadPurchaseOrders();

        this.form.reset();
        this.items.clear();
      },
      error: (error) => {
        this.submitting = false;

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'Unable to create Goods Receipt.'
        });
      }
    });
  }

  // View Goods Receipt details
  viewGoodsReceipt(receipt: GoodsReceipt): void {
    if (!receipt._id) {
      return;
    }

    this.goodsReceiptService.getGoodsReceiptById(receipt._id)
      .subscribe({
        next: (response) => {
          this.selectedReceipt = response;
          this.viewDialogVisible = true;
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Unable to load Goods Receipt details.'
          });
        }
      });
  }

  // Close dialogs
  closeCreateDialog(): void {
    this.createDialogVisible = false;
    this.form.reset();
    this.items.clear();
  }

  closeViewDialog(): void {
    this.viewDialogVisible = false;
    this.selectedReceipt = null;
  }

  // Get supplier name
  getSupplierName(receipt: GoodsReceipt): string {
    if (typeof receipt.supplier === 'string') {
      return receipt.supplier;
    }

    return receipt.supplier?.supplierName || '';
  }

  // Get Purchase Order number
  getPurchaseOrderNumber(receipt: GoodsReceipt): string {
    if (typeof receipt.purchaseOrder === 'string') {
      return receipt.purchaseOrder;
    }

    return receipt.purchaseOrder?.purchaseOrderNumber || '';
  }

  // Get product name
  getProductName(item: any): string {
    if (typeof item.product === 'string') {
      return item.product;
    }

    return item.product?.name || '';
  }

  // Currency formatting
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(value || 0);
  }

  // Date formatting
  formatDate(value: string | Date | null | undefined): string {
    if (!value) {
      return '-';
    }

    return new Date(value).toLocaleDateString('en-IN');
  }
}
