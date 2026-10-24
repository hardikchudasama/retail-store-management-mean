
import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { TableModule } from 'primeng/table';
import { Sale, LowStockProduct } from '../../models';
import { CommonModule } from '@angular/common';
import 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  imports: [NgClass, BaseChartDirective, TableModule, CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  summaryCards = [
    {
      title: 'Total Sales',
      value: '₹1,25,000',
      icon: 'pi pi-wallet',
      color: 'blue',
      change: '+12.5%',
      description: 'Compared to last month',
    },
    {
      title: 'Total Orders',
      value: '1,250',
      icon: 'pi pi-shopping-cart',
      color: 'green',
      change: '+8.2%',
      description: 'Compared to last month',
    },
    {
      title: 'Total Products',
      value: '850',
      icon: 'pi pi-box',
      color: 'purple',
      change: '+5.4%',
      description: 'Compared to last month',
    },
    {
      title: 'Low Stock Items',
      value: '18',
      icon: 'pi pi-exclamation-triangle',
      color: 'orange',
      change: 'Needs attention',
      description: 'Products below minimum stock',
    },
  ];

  lowStockProducts: LowStockProduct[] = [
  {
    id: '1',
    name: 'Wireless Mouse',
    sku: 'WM-001',
    category: 'Electronics',
    availableStock: 5,
    minimumStock: 10,
  },
  {
    id: '2',
    name: 'Office Chair',
    sku: 'OC-002',
    category: 'Furniture',
    availableStock: 2,
    minimumStock: 5,
  },
  {
    id: '3',
    name: 'USB Keyboard',
    sku: 'UK-003',
    category: 'Electronics',
    availableStock: 8,
    minimumStock: 15,
  },
  {
    id: '4',
    name: 'Notebook',
    sku: 'NB-004',
    category: 'Stationery',
    availableStock: 3,
    minimumStock: 10,
  },
  {
    id: '5',
    name: 'Water Bottle',
    sku: 'WB-005',
    category: 'Accessories',
    availableStock: 4,
    minimumStock: 8,
  },
];

  salesChartData: ChartConfiguration<'line'>['data'] = {
    labels: [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ],
    datasets: [
      {
        label: 'Sales',
        data: [
          25000, 32000, 28000, 45000, 40000, 55000,
          48000, 65000, 60000, 75000, 70000, 85000
        ],
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.10)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#2563eb',
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  salesChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) =>
            `Sales: ₹${Number(context.parsed.y).toLocaleString('en-IN')}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `₹${Number(value) / 1000}k`
        },
        grid: {
          color: '#f1f5f9'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  recentSales: Sale[] = [
    {
      invoice: 'INV-1001',
      customer: 'Rahul Sharma',
      date: '2026-10-20',
      amount: 4500,
      status: 'Paid'
    },
    {
      invoice: 'INV-1002',
      customer: 'Priya Patel',
      date: '2026-10-20',
      amount: 2800,
      status: 'Pending'
    },
    {
      invoice: 'INV-1003',
      customer: 'Amit Shah',
      date: '2026-10-19',
      amount: 6500,
      status: 'Paid'
    },
    {
      invoice: 'INV-1004',
      customer: 'Neha Mehta',
      date: '2026-10-19',
      amount: 1200,
      status: 'Failed'
    },
    {
      invoice: 'INV-1005',
      customer: 'Karan Desai',
      date: '2026-10-18',
      amount: 3200,
      status: 'Paid'
    }
  ];
}
