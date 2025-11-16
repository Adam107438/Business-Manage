import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { Account, Partner, Investment, Product, Contact, Purchase, Sale, ExpenseCategory, Expense, AccountTransfer, CashFlow } from '../types';
import { useAuth } from './AuthContext';
import { db } from '../services/firebase';
import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';

interface State {
  accounts: Account[];
  partners: Partner[];
  investments: Investment[];
  products: Product[];
  contacts: Contact[];
  purchases: Purchase[];
  sales: Sale[];
  expenseCategories: ExpenseCategory[];
  expenses: Expense[];
  accountTransfers: AccountTransfer[];
  cashFlows: CashFlow[];
}

const initialState: State = {
  accounts: [{id: 'acc1', name: 'Main Account', balance: 0}],
  partners: [],
  investments: [],
  products: [],
  contacts: [],
  purchases: [],
  sales: [],
  expenseCategories: [{id: 'ec1', name: 'Office Supplies'}, {id: 'ec2', name: 'Utilities'}],
  expenses: [],
  accountTransfers: [],
  cashFlows: [],
};

type ItemTypeSingular = 'account' | 'partner' | 'product' | 'contact' | 'expenseCategory';
type ItemTypePlural = 'accounts' | 'partners' | 'products' | 'contacts' | 'expenseCategories';
const keyMap: Record<ItemTypeSingular, ItemTypePlural> = {
  account: 'accounts', partner: 'partners', product: 'products', contact: 'contacts', expenseCategory: 'expenseCategories'
};


interface DataContextType {
    state: State;
    loading: boolean;
    addItem: (itemType: ItemTypePlural, item: any) => Promise<void>;
    updateItem: (itemType: ItemTypePlural, item: any) => Promise<void>;
    deleteItem: (itemType: ItemTypePlural, id: string) => Promise<void>;
    addSale: (sale: Sale) => Promise<void>;
    updateSale: (oldSale: Sale, newSale: Sale) => Promise<void>;
    deleteSale: (sale: Sale) => Promise<void>;
    addPurchase: (purchase: Purchase) => Promise<void>;
    updatePurchase: (oldPurchase: Purchase, newPurchase: Purchase) => Promise<void>;
    deletePurchase: (purchase: Purchase) => Promise<void>;
    addExpense: (expense: Expense) => Promise<void>;
    updateExpense: (oldExpense: Expense, newExpense: Expense) => Promise<void>;
    deleteExpense: (expense: Expense) => Promise<void>;
    addInvestment: (investment: Investment) => Promise<void>;
    addAccountTransfer: (transfer: AccountTransfer) => Promise<void>;
    updateAccountTransfer: (oldTransfer: AccountTransfer, newTransfer: AccountTransfer) => Promise<void>;
    deleteAccountTransfer: (transfer: AccountTransfer) => Promise<void>;
    addCashFlow: (cashFlow: CashFlow) => Promise<void>;
    updateCashFlow: (oldCashFlow: CashFlow, newCashFlow: CashFlow) => Promise<void>;
    deleteCashFlow: (cashFlow: CashFlow) => Promise<void>;
    clearData: () => Promise<void>;
}


export const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [state, setState] = useState<State>(initialState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setState(initialState);
      setLoading(false);
      return;
    }

    setLoading(true);
    const docRef = doc(db, 'userData', user.uid);

    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as State;
        // Ensure new state fields exist for users with old data structure
        const completeState = { ...initialState, ...data };
        setState(completeState);
      } else {
        // First time login for this user, create their document with initial data
        await setDoc(docRef, initialState);
        setState(initialState);
      }
      setLoading(false);
    }, (error) => {
        console.error("Error listening to data:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);
  
  const updateFirestore = async (newState: State) => {
    if (!user) return;
    const docRef = doc(db, 'userData', user.uid);
    // Use the functional form of setState to get the most recent state
    setState(currentState => {
      // It's often safer to merge, but here we replace since `newState` is derived from `state`
      const finalState = { ...currentState, ...newState };
      setDoc(docRef, finalState);
      return finalState;
    });
  };

  const getState = (): State => {
      let latestState = state;
      setState(s => {
          latestState = s;
          return s;
      });
      return latestState;
  }

  // --- Generic Item Operations ---
  const addItem = async (itemType: ItemTypePlural, item: any) => {
    const currentState = getState();
    const newState = { ...currentState, [itemType]: [...currentState[itemType], item] };
    await updateFirestore(newState);
  };
  const updateItem = async (itemType: ItemTypePlural, item: any) => {
    const currentState = getState();
    const newState = { ...currentState, [itemType]: currentState[itemType].map((i: any) => i.id === item.id ? item : i) };
    await updateFirestore(newState);
  };
  const deleteItem = async (itemType: ItemTypePlural, id: string) => {
    const currentState = getState();
    const newState = { ...currentState, [itemType]: currentState[itemType].filter((i: any) => i.id !== id) };
    await updateFirestore(newState);
  };

  // --- Reducer Logic as Functions ---
  // This helper function simulates the reducer logic but for the new async structure.
  // It takes the current state and returns a new state after applying a "reducer" action.
  const applyReducerLogic = (currentState: State, action: any): State => {
      // A simplified version of the original reducer, just to reuse logic
      // In a real large-scale app, this might be further broken down.
      switch(action.type){
          case 'ADD_SALE': {
              const sale = action.payload;
              const newProducts = [...currentState.products];
              sale.items.forEach(item => {
                  const productIndex = newProducts.findIndex(p => p.id === item.productId);
                  if(productIndex > -1) newProducts[productIndex] = { ...newProducts[productIndex], stock: newProducts[productIndex].stock - item.quantity };
              });
              const newAccounts = [...currentState.accounts];
              sale.payments.forEach(p => {
                  const accIndex = newAccounts.findIndex(a => a.id === p.accountId);
                  if (accIndex > -1) newAccounts[accIndex] = { ...newAccounts[accIndex], balance: newAccounts[accIndex].balance + p.amount };
              });
              return { ...currentState, sales: [...currentState.sales, sale], products: newProducts, accounts: newAccounts };
          }
          case 'DELETE_SALE': {
              const sale = action.payload;
              const newProducts = [...currentState.products];
              sale.items.forEach(item => {
                  const productIndex = newProducts.findIndex(p => p.id === item.productId);
                  if(productIndex > -1) newProducts[productIndex] = { ...newProducts[productIndex], stock: newProducts[productIndex].stock + item.quantity };
              });
              const newAccounts = [...currentState.accounts];
              sale.payments.forEach(p => {
                  const accIndex = newAccounts.findIndex(a => a.id === p.accountId);
                  if (accIndex > -1) newAccounts[accIndex] = { ...newAccounts[accIndex], balance: newAccounts[accIndex].balance - p.amount };
              });
              return { ...currentState, sales: currentState.sales.filter(s => s.id !== sale.id), products: newProducts, accounts: newAccounts };
          }
          case 'ADD_PURCHASE': {
              const purchase = action.payload;
              const newProducts = [...currentState.products];
              purchase.items.forEach(item => {
                  const productIndex = newProducts.findIndex(p => p.id === item.productId);
                  if(productIndex > -1) newProducts[productIndex] = { ...newProducts[productIndex], stock: newProducts[productIndex].stock + item.quantity };
              });
              const newAccounts = [...currentState.accounts];
              purchase.payments.forEach(p => {
                  const accIndex = newAccounts.findIndex(a => a.id === p.accountId);
                  if (accIndex > -1) newAccounts[accIndex] = { ...newAccounts[accIndex], balance: newAccounts[accIndex].balance - p.amount };
              });
              return { ...currentState, purchases: [...currentState.purchases, purchase], products: newProducts, accounts: newAccounts };
          }
          case 'DELETE_PURCHASE': {
              const purchase = action.payload;
              const newProducts = [...currentState.products];
              purchase.items.forEach(item => {
                  const productIndex = newProducts.findIndex(p => p.id === item.productId);
                  if(productIndex > -1) newProducts[productIndex] = { ...newProducts[productIndex], stock: newProducts[productIndex].stock - item.quantity };
              });
              const newAccounts = [...currentState.accounts];
              purchase.payments.forEach(p => {
                  const accIndex = newAccounts.findIndex(a => a.id === p.accountId);
                  if (accIndex > -1) newAccounts[accIndex] = { ...newAccounts[accIndex], balance: newAccounts[accIndex].balance + p.amount };
              });
              return { ...currentState, purchases: currentState.purchases.filter(p => p.id !== purchase.id), products: newProducts, accounts: newAccounts };
          }
          case 'ADD_EXPENSE': {
            const expense = action.payload;
            const newAccounts = currentState.accounts.map(a => a.id === expense.accountId ? { ...a, balance: a.balance - expense.amount } : a);
            return { ...currentState, expenses: [...currentState.expenses, expense], accounts: newAccounts };
          }
          case 'DELETE_EXPENSE': {
              const expense = action.payload;
              const newAccounts = currentState.accounts.map(a => a.id === expense.accountId ? { ...a, balance: a.balance + expense.amount } : a);
              return { ...currentState, expenses: currentState.expenses.filter(e => e.id !== expense.id), accounts: newAccounts };
          }
          case 'ADD_INVESTMENT': {
            const investment = action.payload;
            const newAccounts = currentState.accounts.map(a => a.id === investment.accountId ? { ...a, balance: a.balance + investment.amount } : a);
            return { ...currentState, investments: [...currentState.investments, investment], accounts: newAccounts };
          }
          case 'ADD_ACCOUNT_TRANSFER': {
            const transfer = action.payload;
            const newAccounts = [...currentState.accounts];
            const fromIndex = newAccounts.findIndex(a => a.id === transfer.fromAccountId);
            const toIndex = newAccounts.findIndex(a => a.id === transfer.toAccountId);
            if (fromIndex === -1 || toIndex === -1) return currentState;
            newAccounts[fromIndex] = { ...newAccounts[fromIndex], balance: newAccounts[fromIndex].balance - transfer.amount };
            newAccounts[toIndex] = { ...newAccounts[toIndex], balance: newAccounts[toIndex].balance + transfer.amount };
            return { ...currentState, accounts: newAccounts, accountTransfers: [...currentState.accountTransfers, transfer] };
          }
          case 'DELETE_ACCOUNT_TRANSFER': {
            const transfer = action.payload;
            const newAccounts = [...currentState.accounts];
            const fromIndex = newAccounts.findIndex(a => a.id === transfer.fromAccountId);
            const toIndex = newAccounts.findIndex(a => a.id === transfer.toAccountId);
            if (fromIndex === -1 || toIndex === -1) return currentState;
            newAccounts[fromIndex] = { ...newAccounts[fromIndex], balance: newAccounts[fromIndex].balance + transfer.amount };
            newAccounts[toIndex] = { ...newAccounts[toIndex], balance: newAccounts[toIndex].balance - transfer.amount };
            return { ...currentState, accounts: newAccounts, accountTransfers: currentState.accountTransfers.filter(t => t.id !== transfer.id) };
          }
          case 'ADD_CASH_FLOW': {
            const cashFlow = action.payload as CashFlow;
            const newAccounts = [...currentState.accounts];
            const accIndex = newAccounts.findIndex(a => a.id === cashFlow.accountId);
            if (accIndex > -1) {
                const amountChange = cashFlow.type === 'deposit' ? cashFlow.amount : -cashFlow.amount;
                newAccounts[accIndex] = { ...newAccounts[accIndex], balance: newAccounts[accIndex].balance + amountChange };
            }
            return { ...currentState, cashFlows: [...currentState.cashFlows, cashFlow], accounts: newAccounts };
          }
          case 'DELETE_CASH_FLOW': {
            const cashFlow = action.payload as CashFlow;
            const newAccounts = [...currentState.accounts];
            const accIndex = newAccounts.findIndex(a => a.id === cashFlow.accountId);
            if (accIndex > -1) {
                const amountChange = cashFlow.type === 'deposit' ? cashFlow.amount : -cashFlow.amount;
                newAccounts[accIndex] = { ...newAccounts[accIndex], balance: newAccounts[accIndex].balance - amountChange };
            }
            return { ...currentState, cashFlows: currentState.cashFlows.filter(cf => cf.id !== cashFlow.id), accounts: newAccounts };
          }
          default: return currentState;
      }
  };
  
  // --- Exposed Functions ---
  const addSale = async (sale: Sale) => await updateFirestore(applyReducerLogic(getState(), {type: 'ADD_SALE', payload: sale}));
  const deleteSale = async (sale: Sale) => await updateFirestore(applyReducerLogic(getState(), {type: 'DELETE_SALE', payload: sale}));
  const updateSale = async (oldSale: Sale, newSale: Sale) => {
      let tempState = applyReducerLogic(getState(), {type: 'DELETE_SALE', payload: oldSale});
      await updateFirestore(applyReducerLogic(tempState, {type: 'ADD_SALE', payload: newSale}));
  }

  const addPurchase = async (purchase: Purchase) => await updateFirestore(applyReducerLogic(getState(), {type: 'ADD_PURCHASE', payload: purchase}));
  const deletePurchase = async (purchase: Purchase) => await updateFirestore(applyReducerLogic(getState(), {type: 'DELETE_PURCHASE', payload: purchase}));
  const updatePurchase = async (oldPurchase: Purchase, newPurchase: Purchase) => {
      let tempState = applyReducerLogic(getState(), {type: 'DELETE_PURCHASE', payload: oldPurchase});
      await updateFirestore(applyReducerLogic(tempState, {type: 'ADD_PURCHASE', payload: newPurchase}));
  }

  const addExpense = async (expense: Expense) => await updateFirestore(applyReducerLogic(getState(), {type: 'ADD_EXPENSE', payload: expense}));
  const deleteExpense = async (expense: Expense) => await updateFirestore(applyReducerLogic(getState(), {type: 'DELETE_EXPENSE', payload: expense}));
  const updateExpense = async (oldExpense: Expense, newExpense: Expense) => {
      let tempState = applyReducerLogic(getState(), {type: 'DELETE_EXPENSE', payload: oldExpense});
      await updateFirestore(applyReducerLogic(tempState, {type: 'ADD_EXPENSE', payload: newExpense}));
  }

  const addInvestment = async (investment: Investment) => await updateFirestore(applyReducerLogic(getState(), {type: 'ADD_INVESTMENT', payload: investment}));
  
  const addAccountTransfer = async (transfer: AccountTransfer) => await updateFirestore(applyReducerLogic(getState(), {type: 'ADD_ACCOUNT_TRANSFER', payload: transfer}));
  const deleteAccountTransfer = async (transfer: AccountTransfer) => await updateFirestore(applyReducerLogic(getState(), {type: 'DELETE_ACCOUNT_TRANSFER', payload: transfer}));
  const updateAccountTransfer = async (oldTransfer: AccountTransfer, newTransfer: AccountTransfer) => {
      let tempState = applyReducerLogic(getState(), {type: 'DELETE_ACCOUNT_TRANSFER', payload: oldTransfer});
      await updateFirestore(applyReducerLogic(tempState, {type: 'ADD_ACCOUNT_TRANSFER', payload: newTransfer}));
  }

  const addCashFlow = async (cashFlow: CashFlow) => await updateFirestore(applyReducerLogic(getState(), {type: 'ADD_CASH_FLOW', payload: cashFlow}));
  const deleteCashFlow = async (cashFlow: CashFlow) => await updateFirestore(applyReducerLogic(getState(), {type: 'DELETE_CASH_FLOW', payload: cashFlow}));
  const updateCashFlow = async (oldCashFlow: CashFlow, newCashFlow: CashFlow) => {
      let tempState = applyReducerLogic(getState(), {type: 'DELETE_CASH_FLOW', payload: oldCashFlow});
      await updateFirestore(applyReducerLogic(tempState, {type: 'ADD_CASH_FLOW', payload: newCashFlow}));
  }

  const clearData = async () => await updateFirestore(initialState);
  
  const value: DataContextType = {
      state,
      loading,
      addItem,
      updateItem,
      deleteItem,
      addSale,
      updateSale,
      deleteSale,
      addPurchase,
      updatePurchase,
      deletePurchase,
      addExpense,
      updateExpense,
      deleteExpense,
      addInvestment,
      addAccountTransfer,
      updateAccountTransfer,
      deleteAccountTransfer,
      addCashFlow,
      updateCashFlow,
      deleteCashFlow,
      clearData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
