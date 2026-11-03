export interface PurchaseItem {
  product: string | {
    _id: string;
    name: string;
    sku?: string;
    category?: string;
  };
  quantity: number;
  purchasePrice: number;
  total: number;
}

export type PurchaseStatus = 'Completed' | 'Cancelled';
export type PaymentStatus = 'Paid' | 'Unpaid' | 'Partial';

export interface Purchase {
  _id?: string;
  purchaseId: string;
  supplier: any;
  supplierInvoiceNumber: string;
  purchaseDate: string | Date;
  dueDate?: string | Date | null;
  items: PurchaseItem[];
  subtotal: number;
  discount: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: PaymentStatus;
  status: PurchaseStatus;
  cancelledAt?: string | Date | null;
  cancellationReason?: string;
  notes?: string;
  createdAt?: string | Date;
}

export interface CreatePurchaseItem {
  product: string;
  quantity: number;
  purchasePrice: number;
}

export interface CreatePurchaseRequest {
  supplier: string;
  supplierInvoiceNumber: string;
  purchaseDate: string;
  dueDate?: string | null;
  items: CreatePurchaseItem[];
  discount: number;
  amountPaid: number;
  notes?: string;
}

export interface PurchaseProductOption {
  _id: string;
  name: string;
  sku: string;
  purchasePrice: number;
  quantity: number;
  status: 'Active' | 'Inactive';
}

export interface PurchaseSupplierOption {
  _id: string;
  supplierName: string;
  companyName?: string;
  status: 'Active' | 'Inactive';
}
