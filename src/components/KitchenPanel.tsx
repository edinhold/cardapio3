import { Order } from "../services/dataService";
import { Loader2, CheckCircle, Clock, Play, Printer, XCircle } from "lucide-react";
import { motion } from "motion/react";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";

interface KitchenPanelProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: Order['status'], phone?: string) => void;
}

export default function KitchenPanel({ orders, onUpdateStatus }: KitchenPanelProps) {
  const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
  
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xs font-semibold tracking-widest text-brand-dim uppercase">PAINEL DE PRODUÇÃO (COZINHA)</h2>
        <span className="bg-brand-accent text-brand-bg px-2 py-0.5 rounded text-[11px] font-bold">
          {activeOrders.length} ATIVOS
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-brand-border">
        {activeOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-30 italic text-sm">
            Nenhum pedido pendente
          </div>
        ) : (
          activeOrders.map((order) => (
            <OrderCard key={order.id} order={order} onUpdateStatus={onUpdateStatus} />
          ))
        )}
      </div>
    </div>
  );
}

interface OrderCardProps {
  order: Order;
  onUpdateStatus: (orderId: string, status: Order["status"], phone?: string) => void;
  key?: string;
}

function OrderCard({ order, onUpdateStatus }: OrderCardProps) {
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
          <p className="text-[11px] text-brand-dim">
            {new Date(order.createdAt?.toMillis?.() || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
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
