
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Banknote, Users, Package, ShoppingCart, Contact, BarChart3, Settings, LogOut, X, Landmark } from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/accounts', icon: Landmark, label: 'Accounts' },
  { to: '/partners', icon: Users, label: 'Partners' },
  { to: '/inventory', icon: Package, label: 'Inventory' },
  { to: '/contacts', icon: Contact, label: 'Contacts' },
  { to: '/transactions', icon: ShoppingCart, label: 'Transactions' },
  { to: '/expenses', icon: Banknote, label: 'Expenses' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const Sidebar: React.FC<{ sidebarOpen: boolean; setSidebarOpen: (open: boolean) => void; }> = ({ sidebarOpen, setSidebarOpen }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const NavItem: React.FC<{ to: string, icon: React.ElementType, label: string }> = ({ to, icon: Icon, label }) => (
     <NavLink
      to={to}
      onClick={() => setSidebarOpen(false)}
      className={({ isActive }) =>
        `flex items-center px-4 py-2 mt-5 text-gray-600 dark:text-gray-400 transition-colors duration-200 transform rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 ${
          isActive ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200' : ''
        }`
      }
    >
      <Icon className="w-5 h-5" />
      <span className="mx-4 font-medium">{label}</span>
    </NavLink>
  );

  return (
    <>
      <div className={`fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`} onClick={() => setSidebarOpen(false)}></div>
      <div className={`fixed inset-y-0 left-0 z-30 w-64 px-4 py-5 overflow-y-auto bg-white dark:bg-gray-800 border-r dark:border-gray-700 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-semibold text-gray-800 dark:text-white">IMS</h2>
            <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
                <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            </button>
        </div>
        
        <nav className="mt-10">
            {navItems.map(item => <NavItem key={item.to} {...item} />)}
            <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 mt-5 text-gray-600 dark:text-gray-400 transition-colors duration-200 transform rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200"
            >
                <LogOut className="w-5 h-5" />
                <span className="mx-4 font-medium">Logout</span>
            </button>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
