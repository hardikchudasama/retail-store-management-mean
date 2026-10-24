export interface Sale {
  invoice: string;
  customer: string;
  date: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Failed';
}