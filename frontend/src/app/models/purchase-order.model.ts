export type PurchaseOrderStatus =
  | 'Draft'
  | 'Ordered'
  | 'Partially Received'
  | 'Received'
  | 'Cancelled';

export interface PurchaseOrderItem {
  product:
    | string
    | {
        _id: string;
        name: string;
        sku?: string;
        purchasePrice?: number;
      };

  orderedQuantity: number;
  estimatedPurchasePrice: number;
  total: number;
  receivedQuantity: number;
}

export interface PurchaseOrder {
  _id: string;
  purchaseOrderNumber: string;

  supplier:
    | string
    | {
        _id: string;
        supplierName: string;
        companyName?: string;
        phone?: string;
      };

  orderDate: string | Date;
  expectedDeliveryDate?: string | Date | null;

  items: PurchaseOrderItem[];

  subtotal: number;
  notes?: string;

  status: PurchaseOrderStatus;

  cancelledAt?: string | Date | null;
  cancellationReason?: string;

  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CreatePurchaseOrderItem {
  product: string;
  orderedQuantity: number;
  estimatedPurchasePrice: number;
}

export interface CreatePurchaseOrderRequest {
  supplier: string;
  orderDate?: string;
  expectedDeliveryDate?: string | null;
  items: CreatePurchaseOrderItem[];
  notes?: string;
}

export interface PurchaseOrderResponse {
  success: boolean;
  message: string;
  data: PurchaseOrder;
}

export interface PurchaseOrderListResponse {
  success: boolean;
  count: number;
  data: PurchaseOrder[];
}
