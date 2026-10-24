export interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  availableStock: number;
  minimumStock: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  minimumStock: number;
  description?: string;
  status: 'Active' | 'Inactive';
  createdAt: Date;
}