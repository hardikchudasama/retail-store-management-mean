export interface Supplier {
  id: string;
  supplierName: string;
  companyName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  notes: string;
  status: 'Active' | 'Inactive';
  createdAt: Date;
}
