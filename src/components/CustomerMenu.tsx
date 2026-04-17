import React, { useState, useEffect, useRef } from "react";
import { Product, Order, Settings, Table } from "../services/dataService";
import { Plus, Minus, ShoppingCart, X, Smartphone, User, Phone, MapPin, Send, CheckCircle2, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useParams, useSearchParams } from "react-router-dom";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot } from "firebase/firestore";

interface CustomerMenuProps {
  settings: Settings;
  products: Product[];
  onCreateOrder: (order: any) => void;
  tableNumber?: string;
  tables?: Table[]; // Optional list to select from in POS mode
}

type MenuStage = 'registration' | 'menu' | 'confirmed';

export default function CustomerMenu({ settings, products, onCreateOrder, tableNumber: propTableNumber, tables }: CustomerMenuProps) {
  const { id: paramTableNumber } = useParams();
  const [searchParams] = useSearchParams();
  const queryTableNumber = searchParams.get('table');
  
  const tableNumber = propTableNumber || paramTableNumber || queryTableNumber || undefined;
  
  const [stage, setStage] = useState<MenuStage>('registration');
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '' });
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string | undefined>(tableNumber);

  // Chat State
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newChatMessage, setNewChatMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Skip registration for Admin POS
  useEffect(() => {
    if (tables && tables.length > 0) {
      setStage('menu');
    }
  }, [tables]);

  // Sync Chat
  useEffect(() => {
    if (!customer.phone || stage === 'registration') return;

    const q = query(
      collection(db, "chat_messages"),
      where("customerId", "==", customer.phone),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setChatMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => unsubscribe();
  }, [customer.phone, stage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatMessage.trim()) return;

    await addDoc(collection(db, "chat_messages"), {
      customerId: customer.phone,
      text: newChatMessage,
      sender: "customer",
      timestamp: serverTimestamp()
    });
    setNewChatMessage("");
  };

  const categories = Array.from(new Set(products.map(p => p.category)));

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const handleFinishOrder = () => {
    const finalTable = selectedTable || tableNumber;
    
    onCreateOrder({
      customerName: customer.name || "Cliente " + (finalTable ? `Mesa ${finalTable}` : "Balcão"),
      customerPhone: customer.phone,
      customerAddress: customer.address,
      type: finalTable ? 'table' : 'delivery',
      tableId: finalTable,
      items: cart.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price
      })),
      total: total + (finalTable ? 0 : settings.deliveryFee),
      status: 'pending'
    });

    setLastOrderId(Math.random().toString(36).substr(2, 6).toUpperCase());
    setStage('confirmed');
    setShowCart(false);
  };

  const handleSendWhatsApp = () => {
    if (!settings.whatsappNumber) return;
    
    const itemsList = cart.map(i => `${i.quantity}x ${i.product.name}`).join('\n');
    const finalTable = selectedTable || tableNumber;
    const text = `*NOVO PEDIDO: ${settings.name}*\n\n` +
      `*Cliente:* ${customer.name}\n` +
      `*Fone:* ${customer.phone}\n` +
      (finalTable ? `*Mesa:* ${finalTable}\n` : `*Endereço:* ${customer.address}\n`) +
      `\n*Itens:*\n${itemsList}\n\n` +
      `*Total: R$ ${(total + (!finalTable ? settings.deliveryFee : 0)).toFixed(2)}*`;

    const url = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  if (stage === 'registration' && !tables) {
    return (
      <div className="min-h-screen bg-brand-bg text-brand-text flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm card-gradient p-8 rounded-[2.5rem] border border-brand-border space-y-8 shadow-2xl"
        >
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-brand-accent/10 text-brand-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <User size={32} />
            </div>
            <h2 className="text-xl font-black uppercase tracking-widest">Identifique-se</h2>
            <p className="text-[10px] text-brand-dim font-bold uppercase tracking-widest">Para uma melhor experiência no {settings.name}</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); setStage('menu'); }} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-brand-dim uppercase tracking-wider ml-2">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-dim" size={16} />
                <input 
                  type="text" required
                  className="w-full bg-brand-bg/50 border border-brand-border rounded-2xl pl-12 pr-4 py-4 text-sm outline-none focus:border-brand-accent transition-all font-bold"
                  value={customer.name}
                  onChange={e => setCustomer({...customer, name: e.target.value})}
                  placeholder="Seu nome"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-brand-dim uppercase tracking-wider ml-2">WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-dim" size={16} />
                <input 
                  type="tel" required
                  className="w-full bg-brand-bg/50 border border-brand-border rounded-2xl pl-12 pr-4 py-4 text-sm outline-none focus:border-brand-accent transition-all font-bold"
                  value={customer.phone}
                  onChange={e => setCustomer({...customer, phone: e.target.value})}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            {!tableNumber && (
              <div className="space-y-2 text-brand-text">
                <label className="text-[10px] font-black text-brand-dim uppercase tracking-wider ml-2">Endereço de Entrega</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-dim" size={16} />
                  <input 
                    type="text" required
                    className="w-full bg-brand-bg/50 border border-brand-border rounded-2xl pl-12 pr-4 py-4 text-sm outline-none focus:border-brand-accent transition-all font-bold"
                    value={customer.address}
                    onChange={e => setCustomer({...customer, address: e.target.value})}
                    placeholder="Rua, Número, Bairro"
                  />
                </div>
              </div>
            )}

            <button 
              type="submit"
              disabled={!customer.name || !customer.phone || (!tableNumber && !customer.address)}
              className="w-full bg-brand-accent text-brand-bg py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-brand-accent/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 mt-4"
            >
              Acessar Cardápio
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (stage === 'confirmed') {
    return (
      <div className="min-h-screen bg-brand-bg text-brand-text flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm text-center space-y-8"
        >
          <div className="w-24 h-24 bg-brand-accent/20 text-brand-accent rounded-full flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 size={48} />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tighter uppercase">Pedido Enviado!</h2>
            <p className="text-brand-dim text-sm font-medium">Sua solicitação já está na nossa cozinha.</p>
          </div>

          <div className="card-gradient rounded-3xl p-6 border border-brand-border space-y-4">
             <div className="flex justify-between items-center text-xs text-brand-dim uppercase tracking-widest font-black">
                <span>Status</span>
                <span className="text-brand-accent">Produção</span>
             </div>
             <div className="h-2 bg-brand-bg rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "30%" }}
                  className="h-full bg-brand-accent shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                />
             </div>
             <p className="text-[10px] text-brand-dim italic">Estimativa: 20-30 min</p>
          </div>

          <div className="space-y-4">
            {settings.whatsappNumber && (
              <button 
                onClick={handleSendWhatsApp}
                className="w-full bg-emerald-500 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-all"
              >
                <Send size={20} />
                Enviar pelo WhatsApp
              </button>
            )}
            <button 
              onClick={() => {
                setStage('menu');
                setCart([]);
              }}
              className="w-full bg-brand-border text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all font-bold"
            >
              Novo Pedido / Voltar
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-brand-bg text-brand-text">
      {/* Header */}
      <header className="p-6 flex justify-between items-center border-b border-brand-border sticky top-0 bg-brand-bg/80 backdrop-blur-md z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-accent rounded-xl flex items-center justify-center font-bold text-brand-bg shadow-lg overflow-hidden shrink-0">
             {settings.logoUrl ? (
               <img src={settings.logoUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
             ) : (
               settings?.name?.[0] || 'M'
             )}
          </div>
          <div>
            <h1 className="text-xl font-bold">{settings.name}</h1>
            <div className="flex items-center gap-2">
              {tables && tables.length > 0 ? (
                <div className="flex items-center gap-2">
                  <Smartphone size={12} className="text-brand-accent" />
                  <select 
                    value={selectedTable || ""}
                    onChange={(e) => setSelectedTable(e.target.value || undefined)}
                    className="bg-transparent text-xs text-brand-dim outline-none border-none font-bold"
                  >
                    <option value="" className="bg-brand-card">Balcão / Delivery</option>
                    {tables.map(t => (
                      <option key={t.id} value={t.number} className="bg-brand-card text-brand-text">Mesa {t.number}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-xs text-brand-dim">{tableNumber ? `Mesa ${tableNumber}` : "Delivery Disponível"}</p>
              )}
            </div>
          </div>
        </div>
        <button 
          onClick={() => setShowCart(true)}
          className="relative p-3 bg-brand-card rounded-2xl border border-brand-border transition-transform active:scale-90"
        >
          <ShoppingCart size={20} />
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-brand-accent text-brand-bg text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </button>
      </header>

      {/* Menu */}
      <div className="p-6 space-y-8 pb-32">
        {categories.map(cat => (
          <div key={cat} className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-brand-dim pl-2 border-l-2 border-brand-accent">{cat}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.filter(p => p.category === cat).map(product => (
                <div key={product.id} className="bg-brand-card border border-brand-border rounded-2xl p-4 flex gap-4">
                    <div className="w-20 h-20 rounded-xl bg-brand-border flex-shrink-0 overflow-hidden">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-brand-dim text-2xl font-bold">
                          {product?.name?.[0] || 'P'}
                        </div>
                      )}
                    </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-sm">{product.name}</h3>
                      <p className="text-[10px] text-brand-dim line-clamp-2">{product.description}</p>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-brand-accent font-bold text-sm">R$ {product.price.toFixed(2)}</span>
                        <button 
                          onClick={() => addToCart(product)}
                          className="bg-brand-accent text-brand-bg p-2 rounded-xl transition-transform active:scale-90"
                        >
                          <Plus size={16} />
                        </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Cart Modal */}
      <AnimatePresence>
        {showCart && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end"
          >
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-brand-bg h-full shadow-2xl flex flex-col border-l border-brand-border"
            >
              <div className="p-6 flex justify-between items-center border-b border-brand-border">
                <h2 className="text-lg font-bold">Seu Pedido</h2>
                <button onClick={() => setShowCart(false)} className="p-2 hover:bg-brand-card rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center text-brand-dim py-10 italic">Carrinho vazio...</div>
                ) : (
                  cart.map(item => (
                    <div key={item.product.id} className="flex justify-between items-center bg-brand-card p-4 rounded-2xl border border-brand-border">
                      <div className="flex-1">
                        <h4 className="font-bold text-sm">{item.product.name}</h4>
                        <p className="text-xs text-brand-accent font-semibold">R$ {(item.product.price * item.quantity).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => updateQuantity(item.product.id!, -1)} className="p-1.5 bg-brand-border rounded-lg"><Minus size={14} /></button>
                        <span className="text-sm font-bold min-w-[20px] text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id!, 1)} className="p-1.5 bg-brand-border rounded-lg"><Plus size={14} /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-6 bg-brand-card border-t border-brand-border space-y-4">
                <div className="flex justify-between text-brand-dim text-sm">
                  <span>Subtotal</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
                {!(selectedTable || tableNumber) && (
                   <div className="flex justify-between text-brand-dim text-sm">
                     <span>Taxa de Entrega</span>
                     <span>R$ {settings.deliveryFee.toFixed(2)}</span>
                   </div>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>R$ {(total + (!(selectedTable || tableNumber) ? settings.deliveryFee : 0)).toFixed(2)}</span>
                </div>
                <button 
                  disabled={cart.length === 0}
                  onClick={handleFinishOrder}
                  className="w-full bg-brand-accent text-brand-bg py-4 rounded-2xl font-black uppercase tracking-widest disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                >
                  Confirmar Pedido
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Floating Chat Button */}
      {stage !== 'registration' && (
        <button 
          onClick={() => setShowChat(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-brand-accent text-brand-bg rounded-full flex items-center justify-center shadow-2xl z-40 hover:scale-110 active:scale-90 transition-all"
        >
          <MessageCircle size={24} />
          {chatMessages.length > 0 && chatMessages[chatMessages.length-1]?.sender === 'admin' && (
             <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-brand-accent animate-pulse" />
          )}
        </button>
      )}

      {/* Chat Modal */}
      <AnimatePresence>
        {showChat && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-24 right-6 w-80 h-[450px] bg-brand-bg border border-brand-border rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            <div className="p-4 bg-brand-card border-b border-brand-border flex justify-between items-center">
               <div className="flex items-center gap-2">
                 <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center font-bold text-brand-bg text-xs">A</div>
                 <p className="text-xs font-bold uppercase tracking-widest">Suporte Online</p>
               </div>
               <button onClick={() => setShowChat(false)} className="p-1.5 hover:bg-white/5 rounded-full">
                 <X size={16} />
               </button>
            </div>
            
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.sender === 'customer' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-[11px] font-medium ${
                    m.sender === 'customer' 
                      ? 'bg-brand-accent text-brand-bg rounded-tr-none' 
                      : 'bg-brand-card border border-brand-border text-white rounded-tl-none'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {chatMessages.length === 0 && (
                 <div className="text-center py-20 text-[10px] text-brand-dim italic">Diga olá para o suporte!</div>
              )}
            </div>

            <form onSubmit={sendChatMessage} className="p-4 bg-brand-card border-t border-brand-border flex gap-2">
              <input 
                type="text" 
                value={newChatMessage}
                onChange={e => setNewChatMessage(e.target.value)}
                placeholder="Fale conosco..."
                className="flex-1 bg-brand-bg border border-brand-border rounded-xl px-3 py-2 text-[11px] outline-none focus:border-brand-accent transition-all"
              />
              <button 
                type="submit"
                className="bg-brand-accent text-brand-bg p-2 rounded-xl"
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
