export interface Account {
  id: string;
  name: string;
  balance: number;
}

export interface Partner {
  id: string;
  name: string;
  contact: string;
}

export interface Investment {
  id: string;
  partnerId: string;
  accountId: string;
  amount: number;
  date: string;
}

export interface Product {
  id:string;
  name: string;
  size?: string;
  color?: string;
  price: number;
  cost: number;
  stock: number;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  type: 'supplier' | 'customer';
}

export interface Payment {
  accountId: string;
  amount: number;
}

export interface TransactionItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface Purchase {
  id: string;
  supplierId: string;
  items: TransactionItem[];
  date: string;
  payments: Payment[];
  description?: string;
}

export interface Sale {
  id: string;
  customerId: string;
  items: TransactionItem[];
  date: string;
  payments: Payment[];
  description?: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
}

export interface Expense {
  id: string;
  categoryId: string;
  item: string;
  amount: number;
  date: string;
  accountId: string;
}

export interface AccountTransfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  date: string;
  description: string;
}

export interface CashFlow {
  id: string;
  type: 'deposit' | 'withdrawal';
  accountId: string;
  amount: number;
  date: string;
  description: string;
}

export type AnyItem = Account | Partner | Investment | Product | Contact | Purchase | Sale | ExpenseCategory | Expense | AccountTransfer | CashFlow;

export type ItemType = 'account' | 'partner' | 'investment' | 'product' | 'contact' | 'purchase' | 'sale' | 'expenseCategory' | 'expense' | 'accountTransfer' | 'cashFlow';

export type ActionToProtect = {
    type: 'delete' | 'edit';
    itemType: ItemType;
    payload: AnyItem;
} | null;