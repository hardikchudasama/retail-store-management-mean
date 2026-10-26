import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';

import { Supplier } from '../../models';
import { SupplierPayload, SupplierService } from '../../services/supplier.service';

@Component({
  selector: 'app-suppliers',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    SelectModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    TooltipModule,
    ConfirmDialogModule,
    ToastModule,
  ],
  templateUrl: './suppliers.html',
  styleUrl: './suppliers.scss',
  providers: [ConfirmationService, MessageService],
})
export class Suppliers implements OnInit {
  supplierForm!: FormGroup;

  readonly statusOptions = [
    { label: 'All Statuses', value: 'All' },
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' },
  ];

  suppliers: Supplier[] = [];
  filteredSuppliers: Supplier[] = [];
  searchText = '';
  selectedStatus = 'All';
  isLoading = false;
  supplierDialogVisible = false;
  viewDialogVisible = false;
  isEditMode = false;
  selectedSupplierId: string | null = null;
  selectedSupplier: Supplier | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly supplierService: SupplierService,
    private readonly messageService: MessageService,
    private readonly confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.initializeSupplierForm();
    this.loadSuppliers();
  }

  initializeSupplierForm(): void {
    this.supplierForm = this.fb.group({
      supplierName: ['', [Validators.required, Validators.minLength(3)]],
      companyName: [''],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: ['', [Validators.email]],
      address: [''],
      city: [''],
      state: [''],
      postalCode: ['', Validators.pattern(/^[0-9]{6}$/)],
      notes: [''],
      status: ['Active', Validators.required],
    });
  }

  loadSuppliers(): void {
    this.isLoading = true;
    this.supplierService.getSuppliers().subscribe({
      next: (suppliers) => {
        this.suppliers = suppliers;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load suppliers:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'Failed to load suppliers.',
        });
        this.isLoading = false;
      },
    });
  }

  applyFilters(): void {
    const search = this.searchText.trim().toLowerCase();
    this.filteredSuppliers = this.suppliers.filter((supplier) => {
      const matchesSearch = [
        supplier.supplierName,
        supplier.companyName,
        supplier.phone,
        supplier.email,
        supplier.city,
      ].some((value) => value.toLowerCase().includes(search));
      const matchesStatus = this.selectedStatus === 'All' || supplier.status === this.selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }

  resetFilters(): void {
    this.searchText = '';
    this.selectedStatus = 'All';
    this.applyFilters();
  }

  openAddDialog(): void {
    this.openCreateDialog();
  }

  openCreateDialog(): void {
    this.isEditMode = false;
    this.selectedSupplierId = null;
    this.supplierForm.reset({
      supplierName: '',
      companyName: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      notes: '',
      status: 'Active',
    });
    this.supplierDialogVisible = true;
  }

  openEditDialog(supplier: Supplier): void {
    this.isEditMode = true;
    this.selectedSupplierId = supplier.id;
    this.supplierForm.patchValue({
      supplierName: supplier.supplierName,
      companyName: supplier.companyName,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      city: supplier.city,
      state: supplier.state,
      postalCode: supplier.postalCode,
      notes: supplier.notes,
      status: supplier.status,
    });
    this.supplierDialogVisible = true;
  }

  closeSupplierDialog(): void {
    this.supplierDialogVisible = false;
    this.isEditMode = false;
    this.selectedSupplierId = null;
  }

  viewSupplier(supplier: Supplier): void {
    this.supplierService.getSupplierById(supplier.id).subscribe({
      next: (result) => {
        this.selectedSupplier = result;
        this.viewDialogVisible = true;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'Failed to load supplier details.',
        });
      },
    });
  }

  closeViewDialog(): void {
    this.viewDialogVisible = false;
    this.selectedSupplier = null;
  }

  saveSupplier(): void {
    if (this.supplierForm.invalid) {
      this.supplierForm.markAllAsTouched();
      return;
    }

    const supplierData = this.supplierForm.getRawValue();

    if (this.isEditMode && this.selectedSupplierId) {
      this.supplierService.updateSupplier(this.selectedSupplierId, supplierData).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Supplier updated successfully',
          });
          this.supplierDialogVisible = false;
          this.loadSuppliers();
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Unable to update supplier',
          });
        },
      });
    } else {
      this.supplierService.createSupplier(supplierData).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Supplier created successfully',
          });
          this.supplierDialogVisible = false;
          this.loadSuppliers();
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Unable to create supplier',
          });
        },
      });
    }
  }

  confirmDeleteSupplier(supplier: Supplier): void {
    this.confirmationService.confirm({
      header: 'Delete Supplier',
      message: `Are you sure you want to delete "${supplier.supplierName}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
        this.supplierService.deleteSupplier(supplier.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Supplier Deleted',
              detail: `${supplier.supplierName} deleted successfully.`,
            });
            this.loadSuppliers();
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Delete Failed',
              detail: error.error?.message || 'Failed to delete supplier.',
            });
          },
        });
      },
    });
  }

  isInvalid(fieldName: string): boolean {
    const field = this.supplierForm.get(fieldName);
    return !!field && field.invalid && (field.dirty || field.touched);
  }
}
