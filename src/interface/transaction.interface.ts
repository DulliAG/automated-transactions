export interface Transaction {
  id: number;
  bkr_execution: TransactionExecution;
  sender: string;
  receiver: string;
  balance: number;
  note: string;
}
export type TransactionExecutionType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'PLANNED';

export interface TransactionExecution {
  id: number;
  type: TransactionExecutionType;
  start_date: string;
  end_date: string;
}

export interface TransactionDetails {
  target: string;
  amount: number;
  info: string;
}
