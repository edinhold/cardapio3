import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useParams, Navigate } from "react-router-dom";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "./firebase";
import { 
  syncSettings, syncProducts, syncOrders, syncTables, syncEmployees, 
  Settings, Product, Order, Table, Employee, 
  updateOrderStatus, createOrder 
} from "./services/dataService";
import KitchenPanel from "./components/KitchenPanel";
import AdminDashboard from "./components/AdminDashboard";
import CustomerMenu from "./components/CustomerMenu";
import LoginPage from "./pages/LoginPage";
import { ShieldCheck, UtensilsCrossed, ChefHat, Bell, LogOut } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Settings>({
    name: "MenuFlow Master",
    whatsappNumber: "551199999999",
    deliveryActive: true,
    deliveryFee: 8.0,
    deliveryRadius: 5
  });
  const [products, setProducts] = useState<Product[]>([]);
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
    const unsubOrders = syncOrders(setOrders);
    const unsubTables = syncTables(setTables);
    const unsubEmployees = syncEmployees(setEmployees);

    return () => {
      unsubAuth();
      unsubSettings();
      unsubProducts();
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
        {/* Admin/Dashboard Main Entry */}
        <Route path="/admin" element={
          user ? (
            <AdminLayout 
              settings={settings} 
              products={products} 
              orders={orders} 
              tables={tables} 
              employees={employees} 
              user={user}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        } />
        
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

function AdminLayout({ settings, products, orders, tables, employees, user }: any) {
  const handleLogout = () => signOut(auth);

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col p-6 max-w-[1400px] mx-auto overflow-hidden h-screen">
      {/* HEADER */}
      <header className="flex justify-between items-center pb-4 border-b border-brand-border mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-accent rounded-xl flex items-center justify-center font-bold text-brand-bg text-lg shadow-[0_0_15px_rgba(16,185,129,0.4)]">
            {settings?.name?.[0] || 'M'}
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">{settings.name} Dashboard</h1>
            <p className="text-[11px] text-brand-dim uppercase tracking-tighter">Logado como: {user.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
            <button 
              onClick={handleLogout}
              className="bg-brand-card border border-brand-border px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-white/5 transition-all flex items-center gap-2 group"
            >
              <LogOut size={14} className="group-hover:text-red-400 transition-colors" /> SAIR
            </button>
            <button className="bg-brand-accent text-brand-bg px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all flex items-center gap-2">
              <ShieldCheck size={14} /> NOVO PRODUTO
            </button>
        </div>
      </header>

      {/* BENTO GRID AREA */}
      <div className="flex-1 bento-grid overflow-hidden">
        {/* KITCHEN (2x2) */}
        <div className="card-gradient col-span-2 row-span-2 rounded-2xl border border-brand-border p-5 flex flex-col overflow-hidden">
          <KitchenPanel 
            orders={orders} 
            onUpdateStatus={(id, status, phone) => updateOrderStatus(id, status, phone, settings)} 
          />
        </div>

        {/* REST OF DASHBOARD COMPONENTS */}
        <div className="contents">
          <AdminDashboard 
            settings={settings} 
            products={products} 
            orders={orders} 
            tables={tables} 
            employees={employees} 
          />
        </div>
      </div>

      {/* FOOTER BAR */}
      <footer className="mt-6 pt-4 border-t border-brand-border flex justify-between items-center opacity-60">
        <div className="flex gap-6 text-[10px] items-center uppercase tracking-widest font-medium">
          <span className="flex items-center gap-1.5"><UtensilsCrossed size={12} /> {products.length} Itens no Cardápio</span>
          <span className="flex items-center gap-1.5"><ChefHat size={12} /> {employees.length} Staff On-line</span>
          <span className="flex items-center gap-1.5 text-brand-accent"><Bell size={12} className="animate-bounce" /> WhatsApp Gateway: Ativo</span>
        </div>
        <div className="text-[10px] text-brand-dim">v1.2.0 • MenuFlow Open Beta</div>
      </footer>
    </div>
  );
}
