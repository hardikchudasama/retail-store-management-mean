import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { Supplier } from '../../models';
import { SupplierService } from '../../services/supplier.service';
import { Suppliers } from './suppliers';

describe('Suppliers', () => {
  let component: Suppliers;
  let fixture: ComponentFixture<Suppliers>;
  let supplierService: jasmine.SpyObj<SupplierService>;

  const suppliers: Supplier[] = [
    {
      id: '1',
      supplierName: 'ABC Electronics',
      companyName: 'ABC Electronics Pvt. Ltd.',
      phone: '9876543210',
      email: 'abc@gmail.com',
      address: 'CG Road',
      city: 'Ahmedabad',
      state: 'Gujarat',
      postalCode: '380009',
      notes: 'Electronics supplier',
      status: 'Active',
      createdAt: new Date('2026-10-26'),
    },
    {
      id: '2',
      supplierName: 'Office Supplies',
      companyName: '',
      phone: '9876543211',
      email: '',
      address: '',
      city: 'Surat',
      state: 'Gujarat',
      postalCode: '',
      notes: '',
      status: 'Inactive',
      createdAt: new Date('2026-10-25'),
    },
  ];

  beforeEach(async () => {
    supplierService = jasmine.createSpyObj<SupplierService>('SupplierService', [
      'getSuppliers',
      'getSupplierById',
      'createSupplier',
      'updateSupplier',
      'deleteSupplier',
    ]);
    supplierService.getSuppliers.and.returnValue(of(suppliers));
    supplierService.getSupplierById.and.callFake((id) =>
      of(suppliers.find((supplier) => supplier.id === id)!)
    );
    supplierService.createSupplier.and.returnValue(of(suppliers[0]));
    supplierService.updateSupplier.and.returnValue(of(suppliers[0]));
    supplierService.deleteSupplier.and.returnValue(of(undefined));

    await TestBed.configureTestingModule({
      imports: [Suppliers],
      providers: [{ provide: SupplierService, useValue: supplierService }],
    }).compileComponents();

    fixture = TestBed.createComponent(Suppliers);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load suppliers when initialized', () => {
    expect(component.suppliers).toEqual(suppliers);
    expect(component.filteredSuppliers).toEqual(suppliers);
    expect(component.isLoading).toBeFalse();
    expect(supplierService.getSuppliers).toHaveBeenCalled();
  });

  it('should filter by text and status and reset filters', () => {
    component.searchText = 'Ahmedabad';
    component.applyFilters();
    expect(component.filteredSuppliers).toEqual([suppliers[0]]);

    component.searchText = '';
    component.selectedStatus = 'Inactive';
    component.applyFilters();
    expect(component.filteredSuppliers).toEqual([suppliers[1]]);

    component.resetFilters();
    expect(component.filteredSuppliers).toEqual(suppliers);
  });

  it('should create a supplier from valid form data', () => {
    component.openAddDialog();
    component.supplierForm.patchValue({
      supplierName: 'New Supplier',
      phone: '1234567890',
      email: '',
    });

    component.saveSupplier();

    expect(supplierService.createSupplier).toHaveBeenCalledWith(
      jasmine.objectContaining({
        supplierName: 'New Supplier',
        phone: '1234567890',
        status: 'Active',
      })
    );
    expect(component.supplierDialogVisible).toBeFalse();
  });

  it('should not submit an invalid supplier form', () => {
    component.openAddDialog();
    component.saveSupplier();

    expect(supplierService.createSupplier).not.toHaveBeenCalled();
  });
});
