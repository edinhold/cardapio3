import { useState } from "react";
import { Product, Order, Settings } from "../services/dataService";
import { Plus, Minus, ShoppingCart, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CustomerMenuProps {
  settings: Settings;
  products: Product[];
  onCreateOrder: (order: any) => void;
  tableNumber?: string;
}

export default function CustomerMenu({ settings, products, onCreateOrder, tableNumber }: CustomerMenuProps) {
  const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
  const [showCart, setShowCart] = useState(false);

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
    onCreateOrder({
      customerName: "Cliente " + (tableNumber ? `Mesa ${tableNumber}` : "Delivery"),
      type: tableNumber ? 'table' : 'delivery',
      tableId: tableNumber,
      items: cart.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price
      })),
      total: total + (tableNumber ? 0 : settings.deliveryFee),
      status: 'pending'
    });
    setCart([]);
    setShowCart(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-brand-bg text-brand-text">
      {/* Header */}
      <header className="p-6 flex justify-between items-center border-b border-brand-border sticky top-0 bg-brand-bg/80 backdrop-blur-md z-30">
        <div>
          <h1 className="text-xl font-bold">{settings.name}</h1>
          <p className="text-xs text-brand-dim">{tableNumber ? `Mesa ${tableNumber}` : "Delivery Disponível"}</p>
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
                {!tableNumber && (
                   <div className="flex justify-between text-brand-dim text-sm">
                     <span>Taxa de Entrega</span>
                     <span>R$ {settings.deliveryFee.toFixed(2)}</span>
                   </div>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>R$ {(total + (!tableNumber ? settings.deliveryFee : 0)).toFixed(2)}</span>
                </div>
                <button 
                  disabled={cart.length === 0}
                  onClick={handleFinishOrder}
                  className="w-full bg-brand-accent text-brand-bg py-4 rounded-2xl font-bold uppercase tracking-widest disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                >
                  Confirmar Pedido
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
