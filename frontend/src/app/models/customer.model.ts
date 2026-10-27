export interface Customer {
  id: string;
  customerName: string;
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