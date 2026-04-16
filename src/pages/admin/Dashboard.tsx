import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { 
  TrendingUp, 
  ShoppingBag, 
  Clock, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalSales: 0,
    ordersCount: 0,
    pendingOrders: 0,
    avgOrder: 0
  });

  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    // Basic stats from orders
    const unsubscribe = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const allOrders = snapshot.docs.map(doc => doc.data());
      const total = allOrders.reduce((acc, curr: any) => acc + (curr.total || 0), 0);
      const pending = allOrders.filter((o: any) => o.status === 'pending').length;
      
      setStats({
        totalSales: total,
        ordersCount: allOrders.length,
        pendingOrders: pending,
        avgOrder: allOrders.length > 0 ? total / allOrders.length : 0
      });

      // Prepare Chart Data (simplified for the last 7 items)
      const lastItems = snapshot.docs
        .map(doc => ({ total: doc.data().total, date: new Date(doc.data().createdAt).toLocaleDateString([], { weekday: 'short' }) }))
        .slice(-7);
      setChartData(lastItems);
    });

    const qRecent = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5));
    const unsubscribeRecent = onSnapshot(qRecent, (snapshot) => {
      setRecentOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribe();
      unsubscribeRecent();
    };
  }, []);

  const cardStats = [
    { label: 'Vendas Totais', value: `R$ ${stats.totalSales.toFixed(2)}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Pedidos Realizados', value: stats.ordersCount, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Aguardando Cozinha', value: stats.pendingOrders, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100' },
    { label: 'Ticket Médio', value: `R$ ${stats.avgOrder.toFixed(2)}`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-zinc-900">Visão Geral</h1>
        <p className="text-zinc-500">Acompanhe o desempenho do seu estabelecimento.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cardStats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className={`${stat.bg} ${stat.color} p-2 rounded-xl`}>
                <stat.icon size={20} />
              </div>
              <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <ArrowUpRight size={12} className="mr-1" /> 12%
              </span>
            </div>
            <p className="text-sm font-medium text-zinc-500 mb-1">{stat.label}</p>
            <h3 className="text-2xl font-black text-zinc-900">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-zinc-200">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-zinc-900">Desempenho de Vendas</h3>
            <select className="bg-zinc-50 border border-zinc-100 rounded-lg px-3 py-1 text-xs font-bold outline-none">
              <option>Últimos 7 dias</option>
              <option>Últimos 30 dias</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#A1A1AA' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#A1A1AA' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#ea580c' : '#f4f4f5'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200">
          <h3 className="font-bold text-zinc-900 mb-6">Últimos Pedidos</h3>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
                  <ShoppingBag size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-zinc-900 leading-none">{order.customerName}</p>
                  <p className="text-[10px] text-zinc-400 mt-1 uppercase font-mono">{order.type} • #{order.id.slice(-4).toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-zinc-900">R$ {order.total?.toFixed(2)}</p>
                  <span className={`text-[10px] font-bold uppercase ${
                    order.status === 'delivered' ? 'text-green-500' : 'text-orange-500'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2 bg-zinc-50 rounded-xl text-xs font-bold text-zinc-500 hover:bg-zinc-100 transition-colors">
            Ver Todos os Pedidos
          </button>
        </div>
      </div>
    </div>
  );
}
