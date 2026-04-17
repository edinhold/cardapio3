import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useParams, Navigate, Link, useLocation } from "react-router-dom";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "./firebase";
import { 
  syncSettings, syncProducts, syncOrders, syncTables, syncEmployees, syncCategories,
  Settings, Product, Order, Table, Employee, 
  updateOrderStatus, createOrder 
} from "./services/dataService";
import KitchenPanel from "./components/KitchenPanel";
import AdminDashboard from "./components/AdminDashboard";
import CustomerMenu from "./components/CustomerMenu";
import LoginPage from "./pages/LoginPage";
import ProductsPage from "./pages/admin/Products";
import TablesPage from "./pages/admin/Tables";
import EmployeesPage from "./pages/admin/Employees";
import SettingsPage from "./pages/admin/Settings";
import ReportsPage from "./pages/admin/Reports";
import CustomersPage from "./pages/admin/Customers";
import { 
  ShieldCheck, UtensilsCrossed, ChefHat, Bell, LogOut, 
  LayoutDashboard, Package, Smartphone, Users, Settings as SettingsIcon,
  Store, TrendingUp, MessageSquare
} from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Settings>({
    name: "MenuFlow Master",
    whatsappNumber: "551199999999",
    deliveryActive: true,
    deliveryFee: 10.0,
    deliveryRadius: 5
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    const unsubSettings = syncSettings(setSettings);
    const unsubProducts = syncProducts(setProducts);
    const unsubCategories = syncCategories(setCategories);
    const unsubOrders = syncOrders(setOrders);
    const unsubTables = syncTables(setTables);
    const unsubEmployees = syncEmployees(setEmployees);

    return () => {
      unsubAuth();
      unsubSettings();
      unsubProducts();
      unsubCategories();
      unsubOrders();
      unsubTables();
      unsubEmployees();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0B0A] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Admin Routes */}
        <Route path="/admin" element={user ? <AdminLayout user={user} settings={settings} /> : <Navigate to="/login" replace />}>
          <Route index element={<AdminDashboard settings={settings} products={products} orders={orders} tables={tables} employees={employees} />} />
          <Route path="produtos" element={<ProductsPage />} />
          <Route path="mesas" element={<TablesPage />} />
          <Route path="clientes" element={
            <div className="h-full overflow-hidden flex flex-col">
              <CustomersPage orders={orders} />
            </div>
          } />
          <Route path="relatorios" element={<ReportsPage orders={orders} />} />
          <Route path="equipe" element={<EmployeesPage />} />
          <Route path="config" element={<SettingsPage />} />
          <Route path="cozinha" element={
            <div className="card-gradient h-full rounded-2xl border border-brand-border p-5 flex flex-col overflow-hidden">
              <KitchenPanel 
                orders={orders} 
                onUpdateStatus={(id, status, phone) => updateOrderStatus(id, status, phone, settings)} 
              />
            </div>
          } />
          <Route path="balcao" element={
            <div className="h-full overflow-hidden flex flex-col">
              <CustomerMenu settings={settings} products={products} onCreateOrder={createOrder} tables={tables} />
            </div>
          } />
        </Route>
        
        <Route path="/login" element={<LoginPage />} />
        
        {/* Customer View */}
        <Route path="/" element={<CustomerMenu settings={settings} products={products} onCreateOrder={createOrder} />} />
        <Route path="/mesa/:id" element={<TableEntry settings={settings} products={products} onCreateOrder={createOrder} />} />
      </Routes>
    </BrowserRouter>
  );
}

function TableEntry({ settings, products, onCreateOrder }: any) {
  const { id } = useParams();
  return <CustomerMenu settings={settings} products={products} onCreateOrder={onCreateOrder} tableNumber={id} />;
}

import { Outlet } from "react-router-dom";

function AdminLayout({ settings, user }: any) {
  const navigate = useNavigate();
  const location = useLocation();
  const handleLogout = () => signOut(auth);

  const menuItems = [
    { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { name: "Venda Balcão", path: "/admin/balcao", icon: Store },
    { name: "Cozinha", path: "/admin/cozinha", icon: ChefHat },
    { name: "Relatórios", path: "/admin/relatorios", icon: TrendingUp },
    { name: "Clientes", path: "/admin/clientes", icon: MessageSquare },
    { name: "Produtos", path: "/admin/produtos", icon: Package },
    { name: "Mesas", path: "/admin/mesas", icon: Smartphone },
    { name: "Equipe", path: "/admin/equipe", icon: Users },
    { name: "Ajustes", path: "/admin/config", icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex overflow-hidden h-screen font-sans">
      {/* Dynamic Style Injection */}
      <style>{`
        :root {
          ${settings.brandColor ? `--color-brand-accent: ${settings.brandColor};` : ''}
        }
      `}</style>
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-brand-card border-r border-brand-border flex flex-col shrink-0">
        <div className="p-6 border-b border-brand-border flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-accent rounded-xl flex items-center justify-center font-bold text-brand-bg shadow-[0_0_15px_rgba(16,185,129,0.3)] overflow-hidden">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} className="w-full h-full object-cover" />
            ) : (
              settings?.name?.[0] || 'M'
            )}
          </div>
          <span className="font-bold tracking-tight truncate">{settings?.name}</span>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                location.pathname === item.path
                  ? "bg-brand-accent text-brand-bg shadow-lg shadow-emerald-500/10"
                  : "text-brand-dim hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon size={18} />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-brand-border space-y-4">
          <div className="px-4 py-3 bg-brand-bg/50 rounded-xl border border-brand-border">
            <p className="text-[10px] text-brand-dim uppercase tracking-widest font-bold">Logado em:</p>
            <p className="text-xs font-medium truncate mt-0.5">{user.email}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={18} /> SAIR
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8 relative">
          <Outlet />
        </div>
        
        <footer className="px-8 py-3 border-t border-brand-border flex justify-between items-center text-[10px] text-brand-dim font-mono tracking-tighter shrink-0 bg-brand-bg/80 backdrop-blur">
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5"><UtensilsCrossed size={12} /> MenuFlow v1.5.0</span>
            <span className="flex items-center gap-1.5 text-brand-accent"><Bell size={12} className="animate-pulse" /> WebSocket On-line</span>
          </div>
          <span>&copy; 2026 Admin Pro • Sistema de Gestão</span>
        </footer>
      </main>
    </div>
  );
}
