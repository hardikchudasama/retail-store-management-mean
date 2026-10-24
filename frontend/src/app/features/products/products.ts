import { Component } from '@angular/core';
import { Product } from '../../models';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-products',
  imports: [CommonModule, TableModule, FormsModule, SelectModule],
  templateUrl: './products.html',
  styleUrl: './products.scss',
})
export class Products {
  searchText = '';
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
}
