export type TransactionType = 'PLANNED' | 'DAILY';

export interface IPlannedTransfer {
  id: number;
  type: TransactionType;
  account: string;
  target: string;
  amount: number;
  info: null | string;
  execute_at: Date;
  created_at: Date;
}
