import { Order } from "../services/dataService";
import { Loader2, CheckCircle, Clock, Play, Printer, XCircle, Bell } from "lucide-react";
import { motion } from "motion/react";
import React, { useRef, useState, useEffect } from "react";
import { useReactToPrint } from "react-to-print";

interface KitchenPanelProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: Order['status'], phone?: string) => void;
}

export default function KitchenPanel({ orders, onUpdateStatus }: KitchenPanelProps) {
  const [view, setView] = useState<'production' | 'history'>('production');
  const [historyFilter, setHistoryFilter] = useState<'today' | 'weekly'>('today');
  const prevOrdersCount = useRef(0);

  const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
  
  // Alert sound logic
  useEffect(() => {
    if (activeOrders.length > prevOrdersCount.current) {
      const audio = new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_062564ae80.mp3?filename=notification-1-817.mp3');
      audio.volume = 1.0;
      audio.play().catch(e => console.log('Interação do usuário necessária para áudio:', e));
    }
    prevOrdersCount.current = activeOrders.length;
  }, [activeOrders.length]);

  const historyOrders = orders.filter(o => {
    if (o.status !== 'delivered' && o.status !== 'cancelled') return false;
    
    const orderDate = new Date(o.createdAt?.toMillis?.() || Date.now());
    const now = new Date();
    
    if (historyFilter === 'today') {
      return orderDate.toDateString() === now.toDateString();
    } else {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return orderDate >= oneWeekAgo;
    }
  });
  
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4">
          <button 
            onClick={() => setView('production')}
            className={`text-xs font-black tracking-[0.2em] uppercase transition-all pb-1 border-b-2 ${view === 'production' ? 'text-brand-accent border-brand-accent' : 'text-brand-dim border-transparent'}`}
          >
            Produção
          </button>
          <button 
            onClick={() => setView('history')}
            className={`text-xs font-black tracking-[0.2em] uppercase transition-all pb-1 border-b-2 ${view === 'history' ? 'text-brand-accent border-brand-accent' : 'text-brand-dim border-transparent'}`}
          >
            Histórico
          </button>
        </div>
        
        {view === 'history' && (
          <div className="flex bg-brand-bg/50 rounded-lg p-1 border border-brand-border">
            <button 
              onClick={() => setHistoryFilter('today')}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${historyFilter === 'today' ? 'bg-brand-accent text-brand-bg' : 'text-brand-dim'}`}
            >
              HOJE
            </button>
            <button 
              onClick={() => setHistoryFilter('weekly')}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${historyFilter === 'weekly' ? 'bg-brand-accent text-brand-bg' : 'text-brand-dim'}`}
            >
              SEMANAL
            </button>
          </div>
        )}

        {view === 'production' && (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[10px] text-brand-dim font-bold animate-pulse">
              <Bell size={10} /> ALERTAS SONOROS ATIVOS
            </span>
            <span className="bg-brand-accent text-brand-bg px-2 py-0.5 rounded text-[11px] font-bold">
              {activeOrders.length} ATIVOS
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
        {view === 'production' ? (
          activeOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-30 italic text-sm">
              <Clock size={40} className="mb-2" />
              Nenhum pedido em preparo
            </div>
          ) : (
            activeOrders.map((order, idx) => (
              <OrderCard key={order.id || idx} order={order} onUpdateStatus={onUpdateStatus} />
            ))
          )
        ) : (
          historyOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-30 italic text-sm">
              Nenhum registro encontrado
            </div>
          ) : (
            historyOrders.map((order, idx) => (
              <OrderCard key={order.id || idx} order={order} onUpdateStatus={onUpdateStatus} isHistory />
            ))
          )
        )}
      </div>
    </div>
  );
}

interface OrderCardProps {
  key?: React.Key;
  order: Order;
  onUpdateStatus: (orderId: string, status: Order["status"], phone?: string) => void;
  isHistory?: boolean;
}

function OrderCard({ order, onUpdateStatus, isHistory }: OrderCardProps) {
  const printRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'text-brand-warning';
      case 'preparing': return 'text-blue-400';
      case 'ready': return 'text-brand-accent';
      default: return 'text-brand-dim';
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b border-white/5 pb-3 group"
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-sm">
            #{order.id?.slice(-4)} - {order.type === 'table' ? `Mesa ${order.tableId}` : 'Delivery'}
          </h3>
          <p className="text-[11px] text-brand-dim flex gap-2">
            <span>{new Date(order.createdAt?.toMillis?.() || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            {order.customerPhone && <span className="text-emerald-500 font-bold">{order.customerPhone}</span>}
          </p>
          {order.customerAddress && <p className="text-[10px] text-brand-dim italic mt-1 truncate max-w-[200px]">End: {order.customerAddress}</p>}
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => handlePrint()}
            className="p-1.5 bg-brand-border rounded hover:bg-white/10 text-white"
            title="Imprimir"
          >
            <Printer size={14} />
          </button>
          {order.status === 'pending' && (
            <button 
              onClick={() => onUpdateStatus(order.id!, 'preparing')}
              className="p-1.5 bg-brand-border rounded hover:bg-brand-accent/20 hover:text-brand-accent text-white"
              title="Iniciar Preparo"
            >
              <Play size={14} />
            </button>
          )}
          {order.status === 'preparing' && (
            <button 
              onClick={() => onUpdateStatus(order.id!, 'ready')}
              className="p-1.5 bg-brand-border rounded hover:bg-brand-accent/20 hover:text-brand-accent text-white"
              title="Pronto"
            >
              <CheckCircle size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-1">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex justify-between text-xs">
            <span className="text-brand-dim italic">{item.quantity}x</span>
            <span className="flex-1 ml-2">{item.name}</span>
          </div>
        ))}
      </div>

      <div className="mt-2 flex justify-between items-center">
        <span className={`text-[10px] font-bold uppercase flex items-center gap-1 ${getStatusColor(order.status)}`}>
           {order.status === 'preparing' && <Loader2 size={10} className="animate-spin" />}
           {order.status === 'pending' ? 'Pendente' : order.status === 'preparing' ? 'Em Preparo' : 'Pronto'}
        </span>
        <span className="text-[10px] text-brand-dim">Total: R$ {order.total.toFixed(2)}</span>
      </div>

      {/* Hidden for print */}
      <div style={{ display: 'none' }}>
        <div ref={printRef} className="p-8 text-black bg-white font-mono w-[300px]">
          <h1 className="text-center font-bold text-xl mb-4 underline">PEDIDO #{order.id?.slice(-4)}</h1>
          <div className="mb-4">
            <p>TIPO: {order.type.toUpperCase()}</p>
            {order.type === 'table' && <p>MESA: {order.tableId}</p>}
            <p>CLIENTE: {order.customerName}</p>
            {order.customerPhone && <p>FONE: {order.customerPhone}</p>}
            {order.customerAddress && <p>ENDEREÇO: {order.customerAddress}</p>}
            <p>HORA: {new Date(order.createdAt?.toMillis?.() || Date.now()).toLocaleTimeString()}</p>
          </div>
          <hr className="border-black mb-4" />
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between mb-1">
              <span>{item.quantity}x {item.name}</span>
            </div>
          ))}
          <hr className="border-black my-4" />
          <p className="text-right font-bold">TOTAL: R$ {order.total.toFixed(2)}</p>
          <p className="text-center mt-8 text-xs">MenuFlow System</p>
        </div>
      </div>
    </motion.div>
  );
}
