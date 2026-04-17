import { Order, Product, Settings, Table } from "../services/dataService";
import { Smartphone, Package, Users, Settings as SettingsIcon, Plus, QrCode, TrendingUp, Clock, AlertCircle, Store, ChefHat } from "lucide-react";
import { Link } from "react-router-dom";

interface AdminDashboardProps {
  settings: Settings;
  products: Product[];
  orders: Order[];
  tables: Table[];
  employees: any[];
}

export default function AdminDashboard({ settings, products, orders, tables, employees }: AdminDashboardProps) {
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const revenueToday = orders.filter(o => {
    const today = new Date().toDateString();
    const orderDate = new Date(o.createdAt?.toMillis?.() || Date.now()).toDateString();
    return today === orderDate && o.status !== 'cancelled';
  }).reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* REVENUE STATUS */}
        <div className="bg-brand-card border border-brand-border rounded-3xl p-6 flex flex-col relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 text-emerald-500/10 group-hover:scale-110 transition-transform duration-500">
            <TrendingUp size={120} />
          </div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-dim mb-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Vendas Hoje
          </div>
          <div className="text-4xl font-black tracking-tighter">R$ {revenueToday.toFixed(2)}</div>
          <p className="text-[10px] text-brand-dim mt-2 flex items-center gap-1 font-medium">
             Consumo em tempo real
          </p>
        </div>

        {/* PENDING ORDERS */}
        <Link to="/admin/cozinha" className="bg-brand-card border border-brand-border rounded-3xl p-6 flex flex-col relative overflow-hidden group hover:border-orange-500 transition-all">
          <div className="absolute -right-4 -top-4 text-orange-500/10 group-hover:scale-110 transition-transform duration-500">
            <AlertCircle size={120} />
          </div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-dim mb-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" /> Pendentes
          </div>
          <div className="text-4xl font-black tracking-tighter">{pendingOrders.length}</div>
          <p className="text-[10px] text-brand-dim mt-2 font-medium">Aguardando produção</p>
        </Link>

        {/* TABLES STATUS */}
        <Link to="/admin/mesas" className="bg-brand-card border border-brand-border rounded-3xl p-6 flex flex-col relative overflow-hidden group hover:border-emerald-500 transition-all">
          <div className="absolute -right-4 -top-4 text-emerald-500/10 group-hover:scale-110 transition-transform duration-500">
            <Smartphone size={120} />
          </div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-dim mb-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Mesas Ativas
          </div>
          <div className="text-4xl font-black tracking-tighter">
            {tables.filter(t => t.status !== 'free').length}/{tables.length}
          </div>
          <div className="mt-4 bg-brand-border h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-brand-accent h-full transition-all duration-1000" 
              style={{ width: `${(tables.filter(t => t.status !== 'free').length / (tables.length || 1)) * 100}%` }}
            />
          </div>
        </Link>

        {/* DELIVERY STATUS */}
        <div className="bg-brand-card border border-brand-border rounded-3xl p-6 flex flex-col relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 text-emerald-500/10 group-hover:scale-110 transition-transform duration-500">
            <Package size={120} />
          </div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-dim mb-4 flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${settings.deliveryActive ? 'bg-emerald-500' : 'bg-red-500'}`} /> Delivery
          </div>
          <div className="text-4xl font-black tracking-tighter">{settings.deliveryActive ? 'ATIVO' : 'OFF'}</div>
          <p className="text-[10px] text-brand-dim mt-2 font-medium">Taxa fixa: R$ {settings.deliveryFee.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* QUICK ACTIONS */}
        <div className="bg-brand-card border border-brand-border rounded-3xl p-6 flex flex-col lg:col-span-2">
          <div className="text-[11px] uppercase tracking-[0.2em] font-black text-brand-dim mb-6">Ações Rápidas</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link 
              to="/admin/produtos" 
              className="flex flex-col items-center justify-center bg-brand-bg border border-brand-border p-6 rounded-2xl hover:bg-brand-accent hover:text-brand-bg hover:border-brand-accent transition-all group"
            >
              <Plus size={24} className="mb-3 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] uppercase tracking-widest font-black">Novo Produto</span>
            </Link>
            <Link 
              to="/admin/balcao" 
              className="flex flex-col items-center justify-center bg-brand-bg border border-brand-border p-6 rounded-2xl hover:bg-brand-accent hover:text-brand-bg hover:border-brand-accent transition-all group"
            >
              <Store size={24} className="mb-3 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] uppercase tracking-widest font-black text-center leading-tight">Venda Balcão / POS</span>
            </Link>
            <Link 
              to="/admin/mesas" 
              className="flex flex-col items-center justify-center bg-brand-bg border border-brand-border p-6 rounded-2xl hover:bg-brand-accent hover:text-brand-bg hover:border-brand-accent transition-all group"
            >
              <QrCode size={24} className="mb-3 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] uppercase tracking-widest font-black text-center leading-tight">QR Codes Mesas</span>
            </Link>
            <Link 
              to="/admin/equipe" 
              className="flex flex-col items-center justify-center bg-brand-bg border border-brand-border p-6 rounded-2xl hover:bg-brand-accent hover:text-brand-bg hover:border-brand-accent transition-all group"
            >
              <Users size={24} className="mb-3 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] uppercase tracking-widest font-black">Equipe</span>
            </Link>
            <Link 
              to="/cozinha" 
              className="flex flex-col items-center justify-center bg-brand-bg border border-brand-border p-6 rounded-2xl hover:bg-brand-accent hover:text-brand-bg hover:border-brand-accent transition-all group"
            >
              <ChefHat size={24} className="mb-3 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] uppercase tracking-widest font-black text-center leading-tight">Painel Cozinha Ext.</span>
            </Link>
          </div>
        </div>

        {/* STAFF PREVIEW */}
        <div className="bg-brand-card border border-brand-border rounded-3xl p-6 flex flex-col">
          <div className="text-[11px] uppercase tracking-[0.2em] font-black text-brand-dim mb-6 flex justify-between items-center">
            <span>Time Ativo</span>
            <span className="text-emerald-500">{employees.length}</span>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[200px] pr-2 scrollbar-thin">
            {employees.map((emp) => (
              <div key={emp.id || emp.name} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-border flex items-center justify-center text-xs font-black text-brand-accent">
                  {emp?.name?.[0] || '?'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold truncate">{emp.name}</p>
                  <p className="text-[10px] text-brand-dim uppercase tracking-widest font-medium">@{emp.role}</p>
                </div>
              </div>
            ))}
            {employees.length === 0 && (
              <div className="h-24 flex items-center justify-center text-xs text-brand-dim italic border-2 border-dashed border-brand-border rounded-2xl">
                Nenhum funcionário cadastrado
              </div>
            )}
          </div>
          <Link 
            to="/admin/equipe" 
            className="mt-6 w-full text-center bg-brand-border hover:bg-white/10 text-white text-[10px] py-4 rounded-xl font-bold uppercase tracking-[0.2em] transition-all"
          >
            MODIFICAR EQUIPE
          </Link>
        </div>
      </div>
    </div>
  );
}
