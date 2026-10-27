import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';
import { Products } from './features/products/products';
import { Suppliers } from './features/suppliers/suppliers';
import { Customers } from './features/customers/customers';

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
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];