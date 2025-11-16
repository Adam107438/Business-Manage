import React from 'react';
import { useData } from '../hooks/useData';
import { Banknote, Package, Users, ShoppingCart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const StatCard: React.FC<{ title: string; value: string; icon: React.ElementType; color: string }> = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex items-center">
    <div className={`p-3 rounded-full ${color}`}>
      <Icon className="h-6 w-6 text-white" />
    </div>
    <div className="ml-4">
      <p className="text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-2xl font-semibold text-gray-800 dark:text-gray-200">{value}</p>
    </div>
  </div>
);


const Dashboard: React.FC = () => {
  const { state } = useData();

  const totalBalance = state.accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalProducts = state.products.length;
  const totalPartners = state.partners.length;
  const totalSales = state.sales.length;

  // Prepare data for charts
  const salesByDate = state.sales.reduce((acc, sale) => {
    const date = new Date(sale.date).toLocaleDateString();
    const totalAmount = sale.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    acc[date] = (acc[date] || 0) + totalAmount;
    return acc;
  }, {} as Record<string, number>);

  const salesChartData = Object.keys(salesByDate).map(date => ({
    date,
    amount: salesByDate[date]
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const productStockData = state.products.map(p => ({
    name: p.name,
    stock: p.stock
  }));


  return (
    <div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Balance" value={`৳${totalBalance.toLocaleString()}`} icon={Banknote} color="bg-blue-500" />
        <StatCard title="Total Products" value={String(totalProducts)} icon={Package} color="bg-green-500" />
        <StatCard title="Partners" value={String(totalPartners)} icon={Users} color="bg-yellow-500" />
        <StatCard title="Total Sales" value={String(totalSales)} icon={ShoppingCart} color="bg-purple-500" />
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Sales Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.3)" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }}/>
                    <Legend />
                    <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
            </ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Product Stock Levels</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={productStockData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.3)" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }}/>
                    <Legend />
                    <Bar dataKey="stock" fill="#10b981" />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;