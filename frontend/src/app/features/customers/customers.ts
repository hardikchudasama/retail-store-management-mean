import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';

import { Customer } from '../../models/customer.model';
import { CustomerPayload, CustomerService } from '../../services/customer.service';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    SelectModule,
    TextareaModule,
    TagModule,
    ConfirmDialogModule,
    ToastModule,
    TooltipModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './customers.html',
  styleUrl: './customers.scss',
})
export class Customers implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly customerService = inject(CustomerService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  customers: Customer[] = [];
  loading = false;
  customerDialogVisible = false;
  viewDialogVisible = false;
  isEditMode = false;
  selectedCustomer: Customer | null = null;
  selectedCustomerId: string | null = null;
  selectedStatus = 'All';
  searchText = '';

  get totalCustomers(): number {
    return this.customers.length;
  }

  get activeCustomers(): number {
    return this.customers.filter((customer) => customer.status === 'Active').length;
  }

  get inactiveCustomers(): number {
    return this.customers.filter((customer) => customer.status === 'Inactive').length;
  }

  get newCustomersThisMonth(): number {
    const now = new Date();

    return this.customers.filter((customer) => {
      const createdAt = new Date(customer.createdAt);

      return (
        createdAt.getMonth() === now.getMonth() &&
        createdAt.getFullYear() === now.getFullYear()
      );
    }).length;
  }

  readonly statusOptions = [
    { label: 'All Status', value: 'All' },
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' },
  ];

  readonly customerForm = this.fb.nonNullable.group({
    customerName: ['', [Validators.required, Validators.minLength(3)]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    email: ['', [Validators.email]],
    address: [''],
    city: [''],
    state: [''],
    postalCode: ['', [Validators.pattern(/^$|^[0-9]{6}$/)]],
    notes: [''],
    status: ['Active' as Customer['status'], Validators.required],
  });

  ngOnInit(): void {
    this.loadCustomers();
  }

  get filteredCustomers(): Customer[] {
    const search = this.searchText.trim().toLowerCase();

    return this.customers.filter((customer) => {
      const matchesSearch =
        !search ||
        customer.customerName.toLowerCase().includes(search) ||
        customer.phone.includes(search) ||
        customer.email.toLowerCase().includes(search);
      const matchesStatus = this.selectedStatus === 'All' || customer.status === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }

  loadCustomers(): void {
    this.loading = true;
    this.customerService.getCustomers().subscribe({
      next: (customers) => {
        this.customers = customers;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.showMessage('error', 'Error', error.error?.message || 'Unable to load customers');
      },
    });
  }

  openCreateDialog(): void {
    this.isEditMode = false;
    this.selectedCustomerId = null;
    this.customerForm.reset({
      customerName: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      notes: '',
      status: 'Active',
    });
    this.customerDialogVisible = true;
  }

  openEditDialog(customer: Customer): void {
    this.isEditMode = true;
    this.selectedCustomerId = customer.id;
    this.customerForm.patchValue({
      customerName: customer.customerName,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      postalCode: customer.postalCode,
      notes: customer.notes,
      status: customer.status,
    });
    this.customerDialogVisible = true;
  }

  saveCustomer(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }

    const customerData = this.customerForm.getRawValue() as CustomerPayload;
    const request = this.isEditMode && this.selectedCustomerId
      ? this.customerService.updateCustomer(this.selectedCustomerId, customerData)
      : this.customerService.createCustomer(customerData);

    request.subscribe({
      next: () => {
        this.showMessage(
          'success',
          'Success',
          this.isEditMode ? 'Customer updated successfully' : 'Customer created successfully'
        );
        this.customerDialogVisible = false;
        this.loadCustomers();
      },
      error: (error) => {
        this.showMessage(
          'error',
          'Error',
          error.error?.message ||
            (this.isEditMode ? 'Unable to update customer' : 'Unable to create customer')
        );
      },
    });
  }

  openViewDialog(customer: Customer): void {
    this.customerService.getCustomerById(customer.id).subscribe({
      next: (data) => {
        this.selectedCustomer = data;
        this.viewDialogVisible = true;
      },
      error: (error) => {
        this.showMessage('error', 'Error', error.error?.message || 'Unable to load customer details');
      },
    });
  }

  confirmDelete(customer: Customer): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete ${customer.customerName}?`,
      header: 'Delete Customer',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.deleteCustomer(customer.id),
    });
  }

  deleteCustomer(id: string): void {
    this.customerService.deleteCustomer(id).subscribe({
      next: () => {
        this.showMessage('success', 'Success', 'Customer deleted successfully');
        this.loadCustomers();
      },
      error: (error) => {
        this.showMessage('error', 'Error', error.error?.message || 'Unable to delete customer');
      },
    });
  }

  resetFilters(): void {
    this.searchText = '';
    this.selectedStatus = 'All';
  }

  private showMessage(
    severity: 'success' | 'error' | 'info' | 'warn',
    summary: string,
    detail: string
  ): void {
    this.messageService.add({ severity, summary, detail });
  }
}