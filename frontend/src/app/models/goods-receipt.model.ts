export interface GoodsReceiptItem {
  product: string | {
    _id: string;
    name: string;
    sku?: string;
    category?: string;
  };
  receivedQuantity: number;
  purchasePrice: number;
  total: number;
}

export interface GoodsReceipt {
  _id?: string;
  goodsReceiptNumber: string;

  purchaseOrder: string | {
    _id: string;
    purchaseOrderNumber: string;
    status: string;
  };

  supplier: string | {
    _id: string;
    supplierName: string;
    companyName?: string;
  };

  receiptDate: string | Date;
  items: GoodsReceiptItem[];
  subtotal: number;
  notes?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CreateGoodsReceiptItem {
  product: string;
  receivedQuantity: number;
  purchasePrice?: number;
}

export interface CreateGoodsReceiptRequest {
  purchaseOrder: string;
  receiptDate: string;
  items: CreateGoodsReceiptItem[];
  notes?: string;
}

export interface GoodsReceiptResponse {
  success: boolean;
  message: string;
  data: GoodsReceipt;
}

export interface GoodsReceiptListResponse {
  success: boolean;
  count: number;
  data: GoodsReceipt[];
}
