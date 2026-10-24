export interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  availableStock: number;
  minimumStock: number;
}