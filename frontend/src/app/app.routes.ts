import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';
import { Products } from './features/products/products';
import { Suppliers } from './features/suppliers/suppliers';
import { Customers } from './features/customers/customers';
import { Purchases } from './features/purchases/purchases';
import { PurchaseOrders } from './features/purchase-orders/purchase-orders';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard')
            .then(m => m.Dashboard)
      },
      {
        path: 'products',
        component: Products,
      },
      {
        path: 'suppliers',
        component: Suppliers,
      },
      {
        path: 'customers',
        component: Customers,
      },
      {
        path: 'purchases',
        loadComponent: () =>
          import('./features/purchases/purchases')
            .then(m => m.Purchases),
      },
      {
        path: 'purchase-orders',
        component: PurchaseOrders,
      },
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];