
import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../hooks/useData';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Download, ArrowUpDown, FileText } from 'lucide-react';
import { Sale, Purchase, Expense, Investment, Contact, AccountTransfer } from '../types';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

type ReportType = 'profit_loss' | 'sales' | 'purchases' | 'expenses' | 'partner_ledger' | 'account_ledger' | 'dues_report';

const SortableTH: React.FC<{ 
    name: string; 
    children: React.ReactNode; 
    className?: string;
    sortConfig: { key: string; direction: 'ascending' | 'descending' } | null;
    requestSort: (key: string) => void;
}> = ({ name, children, className, sortConfig, requestSort }) => (
    <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none ${className}`} onClick={() => requestSort(name)}>
        <div className="flex items-center">
            {children}
            {sortConfig?.key === name ? (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼') : <ArrowUpDown size={14} className="ml-2 opacity-30" />}
        </div>
    </th>
);

const ReportTable: React.FC<{
    headers: {key: string, label: string, align?: 'right'}[];
    data: any[];
    onRowClick?: (id: string) => void;
    sortConfig: { key: string; direction: 'ascending' | 'descending' } | null;
    requestSort: (key: string) => void;
}> = ({headers, data, onRowClick, sortConfig, requestSort}) => (
     <div className="overflow-x-auto">
        <table className="min-w-full" id="report-table">
            <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                    {headers.map(h => 
                        <SortableTH 
                            key={h.key} 
                            name={h.key} 
                            className={h.align === 'right' ? 'text-right' : ''}
                            sortConfig={sortConfig}
                            requestSort={requestSort}
                        >
                            {h.label}
                        </SortableTH>
                    )}
                </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {data.map((row, index) => (
                  <tr key={row.id || index} onClick={() => onRowClick && onRowClick(row.id)} className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50' : ''}`}>
                    {headers.map(h => (
                      <td key={h.key} className={`p-4 whitespace-nowrap text-sm ${h.align === 'right' ? 'text-right' : ''}`}>
                        {typeof row[h.key] === 'number' ? `৳${row[h.key].toLocaleString()}` : row[h.key]}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const Reports: React.FC = () => {
    const { state } = useData();
    const [reportType, setReportType] = useState<ReportType>('profit_loss');
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const [dateRange, setDateRange] = useState({ start: thirtyDaysAgo, end: today });
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>({ key: 'date', direction: 'descending' });
    const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
    const [selectedAccountId, setSelectedAccountId] = useState<string>('');
    const [isDuesDetailModalOpen, setIsDuesDetailModalOpen] = useState(false);
    const [selectedContactForDues, setSelectedContactForDues] = useState<Contact | null>(null);

    useEffect(() => {
        if (state.partners.length > 0) {
            setSelectedPartnerId(state.partners[0].id);
        }
        if (state.accounts.length > 0) {
            setSelectedAccountId(state.accounts[0].id);
        }
    }, [state.partners, state.accounts]);
    
    useEffect(() => {
        setSortConfig(reportType === 'dues_report' ? { key: 'due', direction: 'descending' } : { key: 'date', direction: 'descending' });
    }, [reportType]);
    
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDateRange(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    
    const requestSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const filterByDate = <T extends { date: string }>(items: T[]) => {
            const start = new Date(dateRange.start).getTime();
            const end = new Date(dateRange.end).getTime() + (24 * 60 * 60 * 1000 - 1); // include full end day
            return items.filter(item => {
                const itemDate = new Date(item.date).getTime();
                return itemDate >= start && itemDate <= end;
            });
    }

    const filteredData = useMemo(() => {
        return {
            sales: filterByDate<Sale>(state.sales),
            purchases: filterByDate<Purchase>(state.purchases),
            expenses: filterByDate<Expense>(state.expenses),
            investments: filterByDate<Investment>(state.investments),
            accountTransfers: filterByDate<AccountTransfer>(state.accountTransfers),
            cashFlows: filterByDate(state.cashFlows),
        };
    }, [dateRange, state]);
    
    const profitLossData = useMemo(() => {
        const totalRevenue = filteredData.sales.reduce((sum, s) => sum + s.items.reduce((itemSum, i) => itemSum + i.price * i.quantity, 0), 0);
        const costOfGoodsSold = filteredData.sales.reduce((sum, sale) => {
            const saleCost = sale.items.reduce((itemSum, item) => {
                const product = state.products.find(p => p.id === item.productId);
                return itemSum + (product ? product.cost * item.quantity : 0);
            }, 0);
            return sum + saleCost;
        }, 0);
        const grossProfit = totalRevenue - costOfGoodsSold;
        const totalExpenses = filteredData.expenses.reduce((sum, e) => sum + e.amount, 0);
        const netProfit = grossProfit - totalExpenses;
        return { totalRevenue, costOfGoodsSold, grossProfit, totalExpenses, netProfit };
    }, [filteredData, state.products]);

    const duesDetailData = useMemo(() => {
        if (!selectedContactForDues) return [];
        const contactId = selectedContactForDues.id;
        const sales = state.sales.filter(s => s.customerId === contactId).map(s => {
            const total = s.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
            const paid = s.payments.reduce((sum, p) => sum + p.amount, 0);
            return { ...s, total, paid, due: total - paid, type: 'Sale' };
        }).filter(s => s.due > 0.01);

        const purchases = state.purchases.filter(p => p.supplierId === contactId).map(p => {
            const total = p.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
            const paid = p.payments.reduce((sum, p) => sum + p.amount, 0);
            return { ...p, total, paid, due: total - paid, type: 'Purchase' };
        }).filter(p => p.due > 0.01);

        return [...sales, ...purchases].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [selectedContactForDues, state.sales, state.purchases]);

    const handleOpenDuesDetail = (contactId: string) => {
        const contact = state.contacts.find(c => c.id === contactId);
        if (contact) {
            setSelectedContactForDues(contact);
            setIsDuesDetailModalOpen(true);
        }
    };
    
    const reportContent = useMemo(() => {
        const sortData = (data: any[], config: typeof sortConfig) => {
            if (!config) return data;
            return [...data].sort((a, b) => {
                if (a[config.key] < b[config.key]) return config.direction === 'ascending' ? -1 : 1;
                if (a[config.key] > b[config.key]) return config.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        };

        switch (reportType) {
            case 'sales': {
                const data = filteredData.sales.flatMap(s => s.items.map(item => ({ 
                    id: `${s.id}-${item.productId}`,
                    date: s.date, 
                    customerName: state.contacts.find(c => c.id === s.customerId)?.name || 'N/A', 
                    productName: state.products.find(p => p.id === item.productId)?.name || 'N/A',
                    quantity: item.quantity,
                    price: item.price,
                    total: item.quantity * item.price,
                })));
                return sortData(data, sortConfig);
            }
            case 'purchases': {
                const data = filteredData.purchases.flatMap(p => p.items.map(item => ({ 
                    id: `${p.id}-${item.productId}`,
                    date: p.date, 
                    supplierName: state.contacts.find(c => c.id === p.supplierId)?.name || 'N/A', 
                    productName: state.products.find(p => p.id === item.productId)?.name || 'N/A',
                    quantity: item.quantity,
                    price: item.price,
                    total: item.quantity * item.price,
                })));
                return sortData(data, sortConfig);
            }
            case 'expenses': {
                 const data = filteredData.expenses.map(e => ({ ...e, categoryName: state.expenseCategories.find(c => c.id === e.categoryId)?.name || 'N/A' }));
                 return sortData(data, sortConfig);
            }
            case 'partner_ledger': {
                if (!selectedPartnerId) return [];
                const data = filteredData.investments.filter(i => i.partnerId === selectedPartnerId).map(i => ({...i, accountName: state.accounts.find(a => a.id === i.accountId)?.name || 'N/A' }));
                return sortData(data, sortConfig);
            }
            case 'account_ledger': {
                if (!selectedAccountId) return { openingBalance: 0, ledger: [], closingBalance: 0 };
                const account = state.accounts.find(a => a.id === selectedAccountId);
                if (!account) return { openingBalance: 0, ledger: [], closingBalance: 0 };
            
                const allTransactions: any[] = [...state.sales, ...state.purchases, ...state.expenses, ...state.investments, ...state.accountTransfers, ...state.cashFlows];
                const endOfPeriod = new Date(dateRange.end).getTime() + (24 * 60 * 60 * 1000 - 1);
            
                let postPeriodAdjustment = 0;
                allTransactions.forEach(t => {
                    const txDate = new Date(t.date).getTime();
                    if (txDate > endOfPeriod) {
                        if (t.customerId) t.payments.forEach((p: any) => { if (p.accountId === selectedAccountId) postPeriodAdjustment -= p.amount; });
                        else if (t.supplierId) t.payments.forEach((p: any) => { if (p.accountId === selectedAccountId) postPeriodAdjustment += p.amount; });
                        else if (t.item && t.accountId === selectedAccountId) postPeriodAdjustment += t.amount;
                        else if (t.partnerId && t.accountId === selectedAccountId) postPeriodAdjustment -= t.amount;
                        else if (t.fromAccountId) {
                            if (t.fromAccountId === selectedAccountId) postPeriodAdjustment += t.amount;
                            if (t.toAccountId === selectedAccountId) postPeriodAdjustment -= t.amount;
                        } else if (t.type && t.accountId === selectedAccountId) {
                            postPeriodAdjustment += t.type === 'deposit' ? -t.amount : t.amount;
                        }
                    }
                });
            
                const balanceAtEndOfPeriod = account.balance - postPeriodAdjustment;
            
                let periodAdjustment = 0;
                const periodTransactions: any[] = [...filteredData.sales, ...filteredData.purchases, ...filteredData.expenses, ...filteredData.investments, ...filteredData.accountTransfers, ...filteredData.cashFlows];

                periodTransactions.forEach(t => {
                    if (t.customerId) t.payments.forEach((p: any) => { if (p.accountId === selectedAccountId) periodAdjustment += p.amount; });
                    else if (t.supplierId) t.payments.forEach((p: any) => { if (p.accountId === selectedAccountId) periodAdjustment -= p.amount; });
                    else if (t.item && t.accountId === selectedAccountId) periodAdjustment -= t.amount;
                    else if (t.partnerId && t.accountId === selectedAccountId) periodAdjustment += t.amount;
                    else if (t.fromAccountId) {
                        if (t.fromAccountId === selectedAccountId) periodAdjustment -= t.amount;
                        if (t.toAccountId === selectedAccountId) periodAdjustment += t.amount;
                    } else if (t.type && t.accountId === selectedAccountId) {
                        periodAdjustment += t.type === 'deposit' ? t.amount : -t.amount;
                    }
                });
            
                const openingBalance = balanceAtEndOfPeriod - periodAdjustment;
            
                const ledgerData = periodTransactions.flatMap((t: any) => {
                    if (t.customerId) {
                        return t.payments.filter((p: any) => p.accountId === selectedAccountId).map((p: any) => ({
                            id: `${t.id}-${p.accountId}`, date: t.date, description: `Sale to ${state.contacts.find(c => c.id === t.customerId)?.name}`, credit: p.amount, debit: 0
                        }));
                    }
                    if (t.supplierId) {
                        return t.payments.filter((p: any) => p.accountId === selectedAccountId).map((p: any) => ({
                            id: `${t.id}-${p.accountId}`, date: t.date, description: `Purchase from ${state.contacts.find(c => c.id === t.supplierId)?.name}`, debit: p.amount, credit: 0
                        }));
                    }
                    if (t.item && t.accountId === selectedAccountId) return [{ id: t.id, date: t.date, description: `Expense: ${t.item}`, debit: t.amount, credit: 0 }];
                    if (t.partnerId && t.accountId === selectedAccountId) return [{ id: t.id, date: t.date, description: `Investment from ${state.partners.find(p => p.id === t.partnerId)?.name}`, credit: t.amount, debit: 0 }];
                    if (t.type && t.accountId === selectedAccountId) return [{ id: t.id, date: t.date, description: t.description, [t.type === 'deposit' ? 'credit' : 'debit']: t.amount, [t.type === 'deposit' ? 'debit' : 'credit']: 0 }];
                    if (t.fromAccountId) {
                        const fromAcc = state.accounts.find(a => a.id === t.fromAccountId);
                        const toAcc = state.accounts.find(a => a.id === t.toAccountId);
                        if (t.fromAccountId === selectedAccountId) return [{ id: t.id, date: t.date, description: `Transfer to ${toAcc?.name}`, debit: t.amount, credit: 0 }];
                        if (t.toAccountId === selectedAccountId) return [{ id: t.id, date: t.date, description: `Transfer from ${fromAcc?.name}`, credit: t.amount, debit: 0 }];
                    }
                    return [];
                }).sort((a,b) => new Date(a!.date).getTime() - new Date(b!.date).getTime());
                
                let runningBalance = openingBalance;
                const ledger = ledgerData.map(t => {
                    runningBalance = runningBalance + t!.credit - t!.debit;
                    return { ...t, balance: runningBalance };
                });
                
                return { openingBalance, ledger, closingBalance: runningBalance };
            }
            case 'dues_report': {
                const contactDues = new Map<string, number>();

                filteredData.sales.forEach(sale => {
                    const total = sale.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
                    const paid = sale.payments.reduce((sum, p) => sum + p.amount, 0);
                    const due = total - paid;
                    if (due > 0) {
                        contactDues.set(sale.customerId, (contactDues.get(sale.customerId) || 0) + due);
                    }
                });
        
                filteredData.purchases.forEach(purchase => {
                    const total = purchase.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
                    const paid = purchase.payments.reduce((sum, p) => sum + p.amount, 0);
                    const due = total - paid;
                    if (due > 0) {
                        contactDues.set(purchase.supplierId, (contactDues.get(purchase.supplierId) || 0) + due);
                    }
                });

                const data = state.contacts.map(c => ({
                    id: c.id,
                    name: c.name,
                    type: c.type.charAt(0).toUpperCase() + c.type.slice(1),
                    phone: c.phone,
                    due: contactDues.get(c.id) || 0,
                })).filter(c => c.due > 0.01);

                return sortData(data, sortConfig);
            }
            default: return [];
        }
    }, [reportType, filteredData, sortConfig, selectedPartnerId, selectedAccountId, state]);
    
    const downloadCSV = (data: any[], filename: string) => {
        if (data.length === 0) {
            alert("No data to download.");
            return;
        }
        const headers = Object.keys(data[0]);
        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + data.map(e => headers.map(h => `"${String(e[h]).replace(/"/g, '""')}"`).join(",")).join("\n");
        
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `${filename}_${dateRange.start}_to_${dateRange.end}.csv`);
        link.click();
    }

    const downloadPDF = () => {
        const doc = new jsPDF();
        const title = `${reportType.replace(/_/g, ' ').toUpperCase()} REPORT`;
        const dateText = `Date Range: ${new Date(dateRange.start).toLocaleDateString()} to ${new Date(dateRange.end).toLocaleDateString()}`;
        
        doc.setFontSize(16);
        doc.text(title, 14, 20);
        doc.setFontSize(10);
        doc.text(dateText, 14, 26);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 31);
        
        const formatCurrency = (val: any) => typeof val === 'number' ? `BDT ${val.toLocaleString()}` : val;

        let head: string[][] = [];
        let body: any[][] = [];

        if (reportType === 'profit_loss') {
            head = [['Item', 'Amount']];
            body = [
                ['Total Revenue', formatCurrency(profitLossData.totalRevenue)],
                ['COGS', `- ${formatCurrency(profitLossData.costOfGoodsSold)}`],
                ['Gross Profit', formatCurrency(profitLossData.grossProfit)],
                ['Total Expenses', `- ${formatCurrency(profitLossData.totalExpenses)}`],
                ['Net Profit / Loss', formatCurrency(profitLossData.netProfit)]
            ];
        } else if (reportType === 'account_ledger') {
            const { openingBalance, ledger, closingBalance } = reportContent as any;
             head = [['Date', 'Description', 'Debit', 'Credit', 'Balance']];
             body = [
                 ['', 'Opening Balance', '', '', formatCurrency(openingBalance)],
                 ...ledger.map((row: any) => [
                     new Date(row.date).toLocaleDateString(),
                     row.description,
                     row.debit ? row.debit.toLocaleString() : '-',
                     row.credit ? row.credit.toLocaleString() : '-',
                     row.balance.toLocaleString()
                 ]),
                 ['', 'Closing Balance', '', '', formatCurrency(closingBalance)]
             ];
        } else {
             let columns: {key: string, header: string}[] = [];
             
             if(reportType === 'sales') columns = [{key: 'date', header: 'Date'}, {key: 'customerName', header: 'Customer'}, {key: 'productName', header: 'Product'}, {key: 'quantity', header: 'Qty'}, {key: 'price', header: 'Price'}, {key: 'total', header: 'Total'}];
             else if(reportType === 'purchases') columns = [{key: 'date', header: 'Date'}, {key: 'supplierName', header: 'Supplier'}, {key: 'productName', header: 'Product'}, {key: 'quantity', header: 'Qty'}, {key: 'price', header: 'Cost'}, {key: 'total', header: 'Total'}];
             else if(reportType === 'expenses') columns = [{key: 'date', header: 'Date'}, {key: 'categoryName', header: 'Category'}, {key: 'item', header: 'Item'}, {key: 'amount', header: 'Amount'}];
             else if(reportType === 'partner_ledger') columns = [{key: 'date', header: 'Date'}, {key: 'amount', header: 'Amount'}, {key: 'accountName', header: 'Into Account'}];
             else if(reportType === 'dues_report') columns = [{key: 'name', header: 'Name'}, {key: 'type', header: 'Type'}, {key: 'phone', header: 'Phone'}, {key: 'due', header: 'Due Amount'}];

             head = [columns.map(c => c.header)];
             body = (reportContent as any[]).map(row => columns.map(col => {
                 if (col.key === 'date') return new Date(row[col.key]).toLocaleDateString();
                 if (typeof row[col.key] === 'number') return row[col.key].toLocaleString();
                 return row[col.key];
             }));
        }

        autoTable(doc, {
            head: head,
            body: body,
            startY: 35,
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246] },
        });

        doc.save(`${reportType}_report.pdf`);
    };
    
    const handleDownload = () => {
        if (reportContent && !Array.isArray(reportContent) && reportType === 'account_ledger') {
            const { openingBalance, ledger, closingBalance } = reportContent as any;
            const data = [
                {date: '', description: 'Opening Balance', debit: '', credit: '', balance: openingBalance}, 
                ...ledger.map((l: any) => ({...l, id: undefined})),
                {date: '', description: 'Closing Balance', debit: '', credit: '', balance: closingBalance}
            ];
            downloadCSV(data, 'account_ledger_report');
            return;
        }

        const dataToDownload = (reportContent as any[]).map(item => {
            const newItem = {...item};
            delete newItem.id;
            return newItem;
        });

        if (reportType === 'profit_loss') {
            downloadCSV([profitLossData], 'profit_loss_report');
        } else if (dataToDownload.length > 0) {
            downloadCSV(dataToDownload, `${reportType}_report`);
        } else {
            alert("No data to download for the selected report and date range.");
        }
    }
    
    const renderReport = () => {
        switch (reportType) {
            case 'profit_loss': return <div className="space-y-4 max-w-lg mx-auto">
                    <div className="flex justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-md"><span className="font-medium">Total Revenue</span><span>৳{profitLossData.totalRevenue.toLocaleString()}</span></div>
                    <div className="flex justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-md"><span className="font-medium">Cost of Goods Sold (COGS)</span><span>- ৳{profitLossData.costOfGoodsSold.toLocaleString()}</span></div>
                    <div className="flex justify-between p-4 bg-blue-100 dark:bg-blue-900/50 rounded-md font-bold text-blue-800 dark:text-blue-200"><span>Gross Profit</span><span>৳{profitLossData.grossProfit.toLocaleString()}</span></div>
                    <div className="flex justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-md"><span className="font-medium">Total Expenses</span><span>- ৳{profitLossData.totalExpenses.toLocaleString()}</span></div>
                    <div className="flex justify-between p-4 bg-green-100 dark:bg-green-900/50 rounded-md text-xl font-bold text-green-800 dark:text-green-200"><span>Net Profit / Loss</span><span>৳{profitLossData.netProfit.toLocaleString()}</span></div>
                </div>;
            case 'sales': return <ReportTable headers={[{key: 'date', label: 'Date'}, {key: 'customerName', label: 'Customer'}, {key: 'productName', label: 'Product'}, {key: 'quantity', label: 'Qty'}, {key: 'price', label: 'Price'}, {key: 'total', label: 'Total'}]} data={reportContent as any[]} sortConfig={sortConfig} requestSort={requestSort} />;
            case 'purchases': return <ReportTable headers={[{key: 'date', label: 'Date'}, {key: 'supplierName', label: 'Supplier'}, {key: 'productName', label: 'Product'}, {key: 'quantity', label: 'Qty'}, {key: 'price', label: 'Cost'}, {key: 'total', label: 'Total'}]} data={reportContent as any[]} sortConfig={sortConfig} requestSort={requestSort} />;
            case 'expenses': return <ReportTable headers={[{key: 'date', label: 'Date'}, {key: 'categoryName', label: 'Category'}, {key: 'item', label: 'Item/Details'}, {key: 'amount', label: 'Amount'}]} data={reportContent as any[]} sortConfig={sortConfig} requestSort={requestSort} />;
            case 'partner_ledger': 
                if (!selectedPartnerId) return <p className="text-center text-gray-500">Please select a partner to view their ledger.</p>;
                return <ReportTable headers={[{key: 'date', label: 'Date'}, {key: 'amount', label: 'Amount'}, {key: 'accountName', label: 'Into Account'}]} data={reportContent as any[]} sortConfig={sortConfig} requestSort={requestSort} />;
            case 'dues_report': return <ReportTable headers={[{key: 'name', label: 'Name'}, {key: 'type', label: 'Type'}, {key: 'phone', label: 'Phone'}, {key: 'due', label: 'Due Amount', align: 'right'}]} data={reportContent as any[]} onRowClick={handleOpenDuesDetail} sortConfig={sortConfig} requestSort={requestSort} />;
            case 'account_ledger': {
                if (!selectedAccountId) return <p className="text-center text-gray-500">Please select an account to view the ledger.</p>;
                const { openingBalance, ledger, closingBalance } = reportContent as any;
                return (<div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700"><tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase">Date</th><th className="px-4 py-3 text-left text-xs font-medium uppercase">Description</th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase">Debit</th><th className="px-4 py-3 text-right text-xs font-medium uppercase">Credit</th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase">Balance</th>
                        </tr></thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            <tr className="font-semibold bg-gray-50 dark:bg-gray-700"><td className="p-4" colSpan={2}>Opening Balance</td><td className="p-4 text-right" colSpan={3}>৳{openingBalance.toLocaleString()}</td></tr>
                            {ledger.map((row: any) => <tr key={row.id}>
                                <td className="p-4 whitespace-nowrap text-sm">{row.date}</td>
                                <td className="p-4 text-sm">{row.description}</td>
                                <td className="p-4 text-right text-sm text-red-600 dark:text-red-400">{row.debit > 0 ? `৳${row.debit.toLocaleString()}`: '-'}</td>
                                <td className="p-4 text-right text-sm text-green-600 dark:text-green-400">{row.credit > 0 ? `৳${row.credit.toLocaleString()}`: '-'}</td>
                                <td className="p-4 text-right text-sm font-medium">৳{row.balance.toLocaleString()}</td>
                            </tr>)}
                            <tr className="font-semibold bg-gray-50 dark:bg-gray-700"><td colSpan={2} className="p-4">Closing Balance</td><td className="p-4 text-right" colSpan={3}>৳{closingBalance.toLocaleString()}</td></tr>
                        </tbody>
                    </table>
                </div>);
            }
            default: return <p>Select a report type to view.</p>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold mb-4">Report Generator</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium">Report Type</label>
                        <select value={reportType} onChange={e => setReportType(e.target.value as ReportType)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                            <option value="profit_loss">Profit & Loss</option>
                            <option value="sales">Sales Report</option>
                            <option value="purchases">Purchases Report</option>
                            <option value="expenses">Expense Report</option>
                            <option value="dues_report">Dues Report</option>
                            <option value="account_ledger">Account Ledger</option>
                            <option value="partner_ledger">Partner Ledger</option>
                        </select>
                    </div>
                    
                    {reportType === 'partner_ledger' && <div><label className="block text-sm font-medium">Partner</label><select value={selectedPartnerId} onChange={e => setSelectedPartnerId(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"><option value="">Select Partner</option>{state.partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>}
                    {reportType === 'account_ledger' && <div><label className="block text-sm font-medium">Account</label><select value={selectedAccountId} onChange={e => setSelectedAccountId(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"><option value="">Select Account</option>{state.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>}
                    
                    <div className="grid grid-cols-2 gap-4 md:col-span-2 lg:col-span-1">
                        <div>
                            <label className="block text-sm font-medium">Start Date</label>
                            <input type="date" name="start" value={dateRange.start} onChange={handleDateChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium">End Date</label>
                            <input type="date" name="end" value={dateRange.end} onChange={handleDateChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                        </div>
                    </div>
                     <div className="flex gap-2">
                        <Button onClick={handleDownload} className="flex-1 text-sm px-2">
                            <Download className="w-4 h-4 mr-1 inline" /> CSV
                        </Button>
                        <Button onClick={downloadPDF} className="flex-1 text-sm px-2 !bg-red-600 hover:!bg-red-700">
                             <FileText className="w-4 h-4 mr-1 inline" /> PDF
                        </Button>
                     </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold capitalize">{reportType.replace(/_/g, ' ')} Report</h3>
                    <p className="text-sm text-gray-500">
                        {new Date(dateRange.start).toLocaleDateString()} to {new Date(dateRange.end).toLocaleDateString()}
                    </p>
                </div>
                {renderReport()}
            </div>
            
            <Modal isOpen={isDuesDetailModalOpen} onClose={() => setIsDuesDetailModalOpen(false)} title={`Due Details for ${selectedContactForDues?.name}`}>
                <div className="max-h-96 overflow-y-auto">
                    <table className="min-w-full">
                         <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium uppercase">Date</th>
                                <th className="px-4 py-2 text-left text-xs font-medium uppercase">Type</th>
                                <th className="px-4 py-2 text-right text-xs font-medium uppercase">Total</th>
                                <th className="px-4 py-2 text-right text-xs font-medium uppercase">Paid</th>
                                <th className="px-4 py-2 text-right text-xs font-medium uppercase">Due</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {duesDetailData.map(item => (
                                <tr key={item.id}>
                                    <td className="px-4 py-2 text-sm">{new Date(item.date).toLocaleDateString()}</td>
                                    <td className="px-4 py-2 text-sm">{item.type}</td>
                                    <td className="px-4 py-2 text-sm text-right">৳{item.total.toLocaleString()}</td>
                                    <td className="px-4 py-2 text-sm text-right">৳{item.paid.toLocaleString()}</td>
                                    <td className="px-4 py-2 text-sm text-right font-semibold text-red-500">৳{item.due.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Modal>
        </div>
    );
};

export default Reports;
