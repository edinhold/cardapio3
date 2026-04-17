import React, { useState, useMemo, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, where, updateDoc, doc } from 'firebase/firestore';
import { Order } from '../../services/dataService';
import { 
  Users, Search, User, MessageCircle, MoreVertical, 
  History, MapPin, Phone, Lock, Send, ChevronRight, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomersProps {
  orders: Order[];
}

interface Message {
  id?: string;
  sender: 'admin' | 'customer';
  text: string;
  timestamp: any;
  customerId: string;
}

export default function Customers({ orders }: CustomersProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  // Aggregate unique customers from orders
  const customers = useMemo(() => {
    const map = new Map();
    orders.forEach(o => {
      if (!o.customerPhone) return;
      if (!map.has(o.customerPhone)) {
        map.set(o.customerPhone, {
          name: o.customerName,
          phone: o.customerPhone,
          address: o.customerAddress,
          orderCount: 0,
          totalSpent: 0,
          lastOrder: o.createdAt
        });
      }
      const data = map.get(o.customerPhone);
      data.orderCount += 1;
      data.totalSpent += o.total;
      if (o.createdAt > data.lastOrder) data.lastOrder = o.createdAt;
    });
    
    return Array.from(map.values())
      .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm));
  }, [orders, searchTerm]);

  const selectedCustomer = customers.find(c => c.phone === selectedCustomerId);

  // Sync Chat Messages
  useEffect(() => {
    if (!selectedCustomerId) return;

    const q = query(
      collection(db, 'chat_messages'),
      where('customerId', '==', selectedCustomerId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
    });

    return () => unsubscribe();
  }, [selectedCustomerId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedCustomerId) return;

    try {
      await addDoc(collection(db, 'chat_messages'), {
        customerId: selectedCustomerId,
        text: newMessage,
        sender: 'admin',
        timestamp: serverTimestamp()
      });
      setNewMessage("");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] gap-6">
      {/* CUSTOMER LIST */}
      <div className="w-80 flex flex-col gap-4 bg-brand-card border border-brand-border rounded-[2.5rem] p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-brand-accent/20 text-brand-accent rounded-xl">
            <Users size={20} />
          </div>
          <h2 className="text-lg font-black uppercase tracking-tighter">Clientes</h2>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-dim" size={16} />
          <input 
            type="text"
            placeholder="Buscar por nome ou fone..."
            className="w-full bg-brand-bg/50 border border-brand-border rounded-2xl pl-12 pr-4 py-3 text-xs outline-none focus:border-brand-accent transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
          {customers.map((c) => (
            <button
              key={c.phone}
              onClick={() => setSelectedCustomerId(c.phone)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all border ${
                selectedCustomerId === c.phone 
                  ? "bg-brand-accent/10 border-brand-accent text-brand-accent" 
                  : "bg-brand-bg/30 border-transparent hover:bg-white/5"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-brand-bg border border-brand-border flex items-center justify-center font-bold text-[10px]">
                {c.name[0]}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-bold truncate text-white">{c.name}</p>
                <p className="text-[10px] text-brand-dim mt-0.5">{c.phone}</p>
              </div>
              <ChevronRight size={14} className="opacity-30" />
            </button>
          ))}
          {customers.length === 0 && (
            <div className="text-center py-20 text-xs text-brand-dim italic">Nenhum cliente...</div>
          )}
        </div>
      </div>

      {/* CUSTOMER DETAIL / DASHBOARD */}
      <div className="flex-1 flex flex-col gap-6">
        {selectedCustomer ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Card */}
              <div className="lg:col-span-2 bg-brand-card border border-brand-border rounded-[2.5rem] p-8">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex gap-6 items-center">
                    <div className="w-20 h-20 bg-brand-accent rounded-[2rem] flex items-center justify-center text-3xl font-black text-brand-bg shadow-lg shadow-brand-accent/30">
                      {selectedCustomer.name[0]}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black uppercase text-white">{selectedCustomer.name}</h3>
                      <p className="text-sm font-bold text-brand-dim">Cliente desde {new Date(selectedCustomer.lastOrder?.toMillis?.()).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                     <button 
                        onClick={() => setShowChat(true)}
                        className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all"
                      >
                        <MessageCircle size={20} />
                     </button>
                     <button 
                        className="p-4 bg-brand-border text-brand-dim rounded-2xl hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
                        title="Alterar Senha"
                        onClick={() => alert("Funcionalidade em desenvolvimento...")}
                      >
                       <Lock size={18} />
                       <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Senha</span>
                     </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-brand-bg/50 border border-brand-border rounded-2xl">
                    <p className="text-[10px] font-black text-brand-dim uppercase tracking-widest mb-2 flex items-center gap-2">
                       <Phone size={12} /> WhatsApp
                    </p>
                    <p className="text-sm font-bold">{selectedCustomer.phone}</p>
                  </div>
                  <div className="p-4 bg-brand-bg/50 border border-brand-border rounded-2xl">
                    <p className="text-[10px] font-black text-brand-dim uppercase tracking-widest mb-2 flex items-center gap-2">
                       <MapPin size={12} /> Último Endereço
                    </p>
                    <p className="text-sm font-bold truncate" title={selectedCustomer.address}>{selectedCustomer.address || "Não informado"}</p>
                  </div>
                </div>
              </div>

              {/* Stats Card */}
              <div className="bg-brand-card border border-brand-border rounded-[2.5rem] p-8 flex flex-col justify-center">
                <div className="space-y-6">
                   <div>
                     <p className="text-[10px] text-brand-dim font-black uppercase tracking-widest mb-1">Pedidos Realizados</p>
                     <p className="text-3xl font-black text-white">{selectedCustomer.orderCount}</p>
                   </div>
                   <div>
                     <p className="text-[10px] text-brand-dim font-black uppercase tracking-widest mb-1">Total Consumido</p>
                     <p className="text-3xl font-black text-emerald-500">R$ {selectedCustomer.totalSpent.toFixed(2)}</p>
                   </div>
                </div>
              </div>
            </div>

            {/* ORDER HISTORY TABLE */}
            <div className="flex-1 bg-brand-card border border-brand-border rounded-[2.5rem] p-8 flex flex-col overflow-hidden">
               <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white mb-6 flex items-center gap-2">
                 <History size={16} className="text-brand-accent" /> Histórico de Pedidos
               </h3>
               <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
                 {orders.filter(o => o.customerPhone === selectedCustomerId).map(order => (
                   <div key={order.id} className="bg-brand-bg/30 border border-brand-border rounded-2xl p-4 flex justify-between items-center group hover:border-brand-accent/30 transition-all">
                      <div>
                        <p className="text-[10px] font-black text-brand-dim uppercase tracking-widest">
                          #{order.id?.slice(-6)} • {new Date(order.createdAt?.toMillis?.()).toLocaleDateString()}
                        </p>
                        <p className="text-xs font-bold text-white mt-1">
                          {order.items.length} itens • {order.items.map(i => i.name).join(', ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-brand-accent">R$ {order.total.toFixed(2)}</p>
                        <p className="text-[10px] text-brand-dim font-bold uppercase tracking-widest mt-1">{order.status}</p>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-20 italic">
            <User size={80} className="mb-4" />
            <p>Selecione um cliente para ver os detalhes</p>
          </div>
        )}
      </div>

      {/* CHAT OVERLAY */}
      <AnimatePresence>
        {showChat && selectedCustomer && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex justify-end"
          >
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-sm bg-brand-bg h-full shadow-2xl flex flex-col border-l border-brand-border"
            >
              <div className="p-6 border-b border-brand-border flex justify-between items-center bg-brand-card">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-brand-accent rounded-xl flex items-center justify-center font-bold text-brand-bg">
                      {selectedCustomer.name[0]}
                   </div>
                   <div>
                     <p className="text-sm font-bold text-white uppercase">{selectedCustomer.name}</p>
                     <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Online</p>
                   </div>
                 </div>
                 <button onClick={() => setShowChat(false)} className="p-2 hover:bg-white/5 rounded-full">
                    <X size={20} />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
                {messages.map((m, idx) => (
                  <div key={m.id || idx} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl text-xs font-medium shadow-sm ${
                      m.sender === 'admin' 
                        ? "bg-brand-accent text-brand-bg rounded-tr-none" 
                        : "bg-brand-card border border-brand-border text-white rounded-tl-none"
                    }`}>
                      {m.text}
                      <p className={`text-[8px] mt-1 opacity-50 ${m.sender === 'admin' ? 'text-right' : 'text-left'}`}>
                        {new Date(m.timestamp?.toMillis?.()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className="text-center py-20 text-xs text-brand-dim italic opacity-50">Inicie uma conversa com {selectedCustomer.name}</div>
                )}
              </div>

              <form onSubmit={sendMessage} className="p-6 bg-brand-card border-t border-brand-border flex gap-2">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Escreva sua mensagem..."
                  className="flex-1 bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-xs outline-none focus:border-brand-accent transition-all"
                />
                <button 
                  type="submit"
                  className="bg-brand-accent text-brand-bg p-3 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
                >
                  <Send size={18} />
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
