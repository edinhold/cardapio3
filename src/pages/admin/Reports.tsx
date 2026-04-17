import React, { useState, useMemo } from 'react';
import { Order } from '../../services/dataService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { 
  TrendingUp, ShoppingBag, DollarSign, Calendar, 
  Filter, ChevronDown, Download, PieChart as PieIcon 
} from 'lucide-react';
import { motion } from 'motion/react';

interface ReportsProps {
  orders: Order[];
}

export default function Reports({ orders }: ReportsProps) {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
  
  // Basic Stats
  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const successful = orders.filter(o => o.status !== 'cancelled').length;
    const avgTicket = totalRevenue / (successful || 1);
    
    return {
      totalRevenue,
      orderCount: orders.length,
      avgTicket,
      cancelledCount: orders.filter(o => o.status === 'cancelled').length
    };
  }, [orders]);

  // Chart Data Processing
  const chartData = useMemo(() => {
    const groups: { [key: string]: number } = {};
    
    orders.forEach(o => {
      const date = new Date(o.createdAt?.toMillis?.() || Date.now());
      let key = "";
      
      if (period === 'day') {
        key = date.toLocaleTimeString([], { hour: '2-digit' }) + "h";
      } else if (period === 'week') {
        key = date.toLocaleDateString([], { weekday: 'short' });
      } else {
        key = date.toLocaleDateString([], { day: '2-digit', month: 'short' });
      }
      
      groups[key] = (groups[key] || 0) + o.total;
    });

    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [orders, period]);

  const topProducts = useMemo(() => {
    const counts: { [key: string]: { name: string, qty: number, total: number } } = {};
    orders.forEach(o => {
      o.items.forEach(item => {
        if (!counts[item.productId]) {
          counts[item.productId] = { name: item.name, qty: 0, total: 0 };
        }
        counts[item.productId].qty += item.quantity;
        counts[item.productId].total += (item.quantity * item.price);
      });
    });

    return Object.values(counts)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [orders]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-1">RELATÓRIOS</h1>
          <p className="text-brand-dim text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <TrendingUp size={14} className="text-emerald-500" /> Analise seu desempenho em tempo real
          </p>
        </div>
        
        <div className="flex bg-brand-card border border-brand-border p-1.5 rounded-2xl">
          {(['day', 'week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                period === p 
                  ? "bg-brand-accent text-brand-bg shadow-lg shadow-emerald-500/20" 
                  : "text-brand-dim hover:text-white"
              }`}
            >
              {p === 'day' ? 'Hoje' : p === 'week' ? 'Semana' : 'Mês'}
            </button>
          ))}
        </div>
      </header>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Faturamento Total" 
          value={`R$ ${stats.totalRevenue.toFixed(2)}`} 
          icon={<DollarSign className="text-emerald-500" />}
          trend="+12%"
        />
        <StatCard 
          label="Total de Pedidos" 
          value={stats.orderCount.toString()} 
          icon={<ShoppingBag className="text-blue-500" />}
          trend="+5%"
        />
        <StatCard 
          label="Ticket Médio" 
          value={`R$ ${stats.avgTicket.toFixed(2)}`} 
          icon={< TrendingUp className="text-orange-500" />}
        />
        <StatCard 
          label="Cancelamentos" 
          value={stats.cancelledCount.toString()} 
          icon={<Calendar className="text-red-500" />}
          trend="-2%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* REVENUE CHART */}
        <div className="lg:col-span-2 bg-brand-card border border-brand-border rounded-[2.5rem] p-8 flex flex-col h-[450px]">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Fluxo de Faturamento</h3>
            <button className="text-xs text-brand-dim flex items-center gap-2 hover:text-white transition-colors">
              <Download size={14} /> Exportar CSV
            </button>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#666" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#666" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `R$${val}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1817', border: '1px solid #2B2826', borderRadius: '12px' }}
                  itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10b981" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* MOST SOLD PRODUCTS */}
        <div className="bg-brand-card border border-brand-border rounded-[2.5rem] p-8">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white mb-8">Top 5 Produtos</h3>
          <div className="space-y-6">
            {topProducts.map((p, idx) => (
              <div key={idx} className="flex items-center gap-4 group">
                <div className="w-10 h-10 bg-brand-bg border border-brand-border rounded-xl flex items-center justify-center text-xs font-black text-brand-accent group-hover:scale-110 transition-transform">
                  0{idx + 1}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-white uppercase">{p.name}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[10px] text-brand-dim font-bold">{p.qty} vendas</span>
                    <span className="text-[10px] text-emerald-500 font-black">R$ {p.total.toFixed(2)}</span>
                  </div>
                  <div className="w-full h-1 bg-brand-bg rounded-full mt-2 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(p.total / topProducts[0].total) * 100}%` }}
                      className="h-full bg-brand-accent"
                    />
                  </div>
                </div>
              </div>
            ))}
            {topProducts.length === 0 && (
              <div className="py-20 text-center text-xs text-brand-dim italic">Aguardando vendas...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, trend }: { label: string, value: string, icon: React.ReactNode, trend?: string }) {
  return (
    <div className="bg-brand-card border border-brand-border rounded-3xl p-6 relative overflow-hidden group hover:border-brand-accent/50 transition-all">
      <div className="absolute -right-2 -top-2 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-700">
        {icon}
      </div>
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-dim mb-4 flex justify-between items-center">
        {label}
        {trend && (
          <span className={`px-2 py-0.5 rounded text-[8px] ${trend.startsWith('+') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
            {trend}
          </span>
        )}
      </div>
      <div className="text-3xl font-black text-white tracking-tighter">{value}</div>
    </div>
  );
}
