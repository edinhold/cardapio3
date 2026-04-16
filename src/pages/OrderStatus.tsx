import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { 
  Clock, 
  ChefHat, 
  CheckCircle2, 
  ShoppingBag, 
  ChevronLeft,
  Smartphone,
  MessageCircle
} from 'lucide-react';
import { motion } from 'motion/react';

interface Order {
  id: string;
  items: any[];
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  total: number;
  customerName: string;
}

const statusConfig = {
  pending: { label: 'Recebido', icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500', step: 1 },
  preparing: { label: 'Na Cozinha', icon: ChefHat, color: 'text-blue-500', bg: 'bg-blue-500', step: 2 },
  ready: { label: 'Pronto para Entrega', icon: ShoppingBag, color: 'text-green-500', bg: 'bg-green-500', step: 3 },
  delivered: { label: 'Entregue', icon: CheckCircle2, color: 'text-zinc-900', bg: 'bg-zinc-900', step: 4 },
  cancelled: { label: 'Cancelado', icon: CheckCircle2, color: 'text-red-500', bg: 'bg-red-500', step: 0 }
};

export default function OrderStatus() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const unsubscribe = onSnapshot(doc(db, 'orders', id), (snap) => {
      if (snap.exists()) {
        setOrder({ id: snap.id, ...snap.data() } as Order);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white p-8 border">
      <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!order) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-white">
      <h1 className="text-2xl font-bold mb-4">Pedido não encontrado</h1>
      <Link to="/" className="text-orange-600 font-bold flex items-center gap-2">
        <ChevronLeft size={20} /> Voltar ao Cardápio
      </Link>
    </div>
  );

  const currentStatus = statusConfig[order.status];

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <header className="bg-white px-8 py-10 rounded-b-[3rem] shadow-sm text-center">
        <Link to="/" className="inline-flex items-center gap-2 text-zinc-400 font-bold text-sm mb-6 hover:text-orange-600 transition-colors">
          <ChevronLeft size={16} /> Voltar ao Cardápio
        </Link>
        <div className="inline-flex p-4 rounded-3xl bg-zinc-50 text-orange-600 mb-4">
          <currentStatus.icon size={48} />
        </div>
        <h1 className="text-3xl font-black text-zinc-900 mb-2">
          {currentStatus.label}
        </h1>
        <p className="text-zinc-400 font-medium">Pedido #{id.slice(-6).toUpperCase()}</p>
      </header>

      <main className="px-8 -mt-8 flex-1">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-zinc-200/50 border border-zinc-100 mb-8">
          <div className="flex justify-between items-center mb-8">
            { [1, 2, 3, 4].map((step) => {
              const isActive = currentStatus.step >= step;
              const isCurrent = currentStatus.step === step;
              return (
                <div key={step} className="flex flex-col items-center gap-2 relative">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                    isActive ? (isCurrent ? 'bg-orange-600 shadow-lg shadow-orange-600/40 text-white' : 'bg-zinc-900 text-white') : 'bg-zinc-100 text-zinc-300'
                  }`}>
                    {step === 1 && <Clock size={18} />}
                    {step === 2 && <ChefHat size={18} />}
                    {step === 3 && <ShoppingBag size={18} />}
                    {step === 4 && <CheckCircle2 size={18} />}
                  </div>
                </div>
              );
            })}
            <div className="absolute top-[4.5rem] left-[15%] right-[15%] h-1.5 bg-zinc-100 -z-10 rounded-full">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(Math.min(currentStatus.step, 4) - 1) * 33}%` }}
                className="h-full bg-orange-600 rounded-full"
              />
            </div>
          </div>

          <div className="space-y-6 pt-4">
            <h3 className="font-bold text-zinc-900 border-b border-zinc-100 pb-3">Resumo do Pedido</h3>
            <div className="space-y-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span className="text-zinc-600">
                    <span className="font-bold text-zinc-900 mr-2">{item.quantity}x</span>
                    {item.name}
                  </span>
                  <span className="font-bold text-zinc-900">R$ {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-zinc-100 mt-6">
              <span className="font-black text-xl text-zinc-900">Total</span>
              <span className="font-black text-xl text-orange-600">R$ {order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-100 p-6 rounded-3xl flex items-center gap-4 mb-12">
          <div className="bg-orange-600 p-3 rounded-2xl text-white">
            <Smartphone size={24} />
          </div>
          <div>
            <h4 className="font-bold text-orange-900">Mantenha esta página aberta</h4>
            <p className="text-xs text-orange-700 mt-0.5">Nós vamos te avisar assim que seu pedido sair da cozinha!</p>
          </div>
        </div>
      </main>

      <footer className="p-8 text-center text-zinc-300 text-xs font-mono uppercase tracking-widest pb-12">
        Produzido com ❤️ por MenuFlow
      </footer>
    </div>
  );
}
