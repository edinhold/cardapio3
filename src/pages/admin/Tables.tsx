import { useState, useEffect, FormEvent } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { Plus, Trash2, Smartphone, Receipt, CheckCircle2, User, X, Store } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Order } from '../../services/dataService';
import { motion } from 'motion/react';

interface Table {
  id: string;
  number: string;
  status: 'free' | 'occupied' | 'reserved';
}

export default function Tables() {
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'tables'), orderBy('number'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTables(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Table)));
    });

    const qOrders = query(collection(db, 'orders'), where('status', '!=', 'cancelled'));
    const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    });

    return () => {
      unsubscribe();
      unsubscribeOrders();
    };
  }, []);

  const addTable = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'tables'), { 
        number: newTableNumber, 
        status: 'free' 
      });
      setNewTableNumber('');
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const deleteTable = async (id: string) => {
    if (confirm('Excluir esta mesa?')) {
      await deleteDoc(doc(db, 'tables', id));
    }
  };

  const updateStatus = async (id: string, status: Table['status']) => {
    await updateDoc(doc(db, 'tables', id), { status });
  };

  const handleCloseBill = async (table: Table) => {
    if (!confirm(`Deseja fechar a conta da Mesa ${table.number}?`)) return;
    
    const tableOrders = orders.filter(o => o.tableId === table.number && o.status !== 'delivered');
    
    // Mark all table orders as delivered (account closed)
    for (const order of tableOrders) {
      if (order.id) {
        await updateDoc(doc(db, 'orders', order.id), { status: 'delivered' });
      }
    }

    await updateStatus(table.id, 'free');
    setIsDetailOpen(false);
  };

  const getTableOrders = (tableNumber: string) => {
    return orders.filter(o => o.tableId === tableNumber && o.status !== 'delivered');
  };

  const getTableTotal = (tableNumber: string) => {
    return getTableOrders(tableNumber).reduce((sum, o) => sum + o.total, 0);
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Salão & Mesas</h1>
          <p className="text-zinc-500">Gestão de consumo e ocupação.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-emerald-700 transition-all"
        >
          <Plus size={18} />
          Adicionar Mesa
        </button>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {tables.map(table => {
          const tableOrders = getTableOrders(table.number);
          const total = getTableTotal(table.number);

          return (
            <div 
              key={table.id} 
              onClick={() => {
                setSelectedTable(table);
                setIsDetailOpen(true);
              }}
              className="bg-white rounded-2xl border border-zinc-200 p-6 flex flex-col items-center gap-4 relative group cursor-pointer hover:border-emerald-500 transition-all hover:shadow-xl hover:shadow-emerald-500/5 active:scale-95"
            >
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  deleteTable(table.id);
                }}
                className="absolute top-2 right-2 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"
              >
                <Trash2 size={16} />
              </button>
              
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                table.status === 'free' ? 'bg-zinc-50 text-zinc-400' : 
                table.status === 'occupied' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-orange-100 text-orange-600'
              }`}>
                <Smartphone size={24} />
              </div>

              <div className="text-center">
                <h3 className="font-bold text-lg text-zinc-900">Mesa {table.number}</h3>
                <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${
                  table.status === 'free' ? 'text-zinc-400' : 
                  table.status === 'occupied' ? 'text-emerald-500' : 'text-orange-500'
                }`}>
                  {table.status === 'free' ? 'Livre' : 
                   table.status === 'occupied' ? 'Em Uso' : 'Reservada'}
                </p>
              </div>

              {table.status === 'occupied' && (
                <div className="mt-2 bg-emerald-50 px-3 py-1 rounded-full">
                  <span className="text-emerald-700 text-[10px] font-black">R$ {total.toFixed(2)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Table Detail / Checkout Modal */}
      {isDetailOpen && selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
          >
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedTable.status === 'occupied' ? 'bg-emerald-600 text-white' : 'bg-zinc-200 text-zinc-500'}`}>
                  <Smartphone size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">Mesa {selectedTable.number}</h2>
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">
                    {selectedTable.status === 'free' ? 'Status: Disponível' : 'Status: Em atendimento'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsDetailOpen(false)}
                className="p-2 hover:bg-zinc-200 rounded-full transition-colors text-zinc-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {selectedTable.status === 'free' ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={32} />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900 italic">Mesa pronta para novos clientes!</p>
                    <p className="text-sm text-zinc-400 max-w-xs mx-auto">Você pode abrir o cardápio no balcão para lançar pedidos manualmente para esta mesa.</p>
                  </div>
                  <button 
                    onClick={() => updateStatus(selectedTable.id, 'occupied')}
                    className="bg-zinc-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-zinc-800 transition-all text-sm"
                  >
                    OCUPAR MESA AGORA
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                       <Receipt size={14} /> Consumo da Mesa
                    </h3>
                    <div className="space-y-3">
                      {getTableOrders(selectedTable.number).map(order => (
                        <div key={order.id} className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-bold text-emerald-600 uppercase">#{order.id?.slice(-4)}</span>
                            <span className="text-[10px] text-zinc-400">{new Date(order.createdAt?.toMillis?.() || Date.now()).toLocaleTimeString()}</span>
                          </div>
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs my-1">
                              <span className="text-zinc-600">{item.quantity}x {item.name}</span>
                              <span className="font-medium">R$ {(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                      {getTableOrders(selectedTable.number).length === 0 && (
                        <div className="p-8 text-center border-2 border-dashed border-zinc-100 rounded-2xl text-zinc-300 italic text-sm">
                          Nenhum pedido lançado ainda...
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-emerald-900 text-white p-6 rounded-3xl space-y-4 shadow-xl shadow-emerald-900/10">
                    <div className="flex justify-between items-center">
                      <span className="text-emerald-300 text-sm font-medium">Subtotal</span>
                      <span className="text-xl font-bold">R$ {getTableTotal(selectedTable.number).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-white/10 pt-4">
                      <span className="font-black text-lg uppercase tracking-tighter">Total da Conta</span>
                      <span className="text-3xl font-black">R$ {getTableTotal(selectedTable.number).toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-6 bg-zinc-50/50 border-t border-zinc-100 flex gap-4">
               {selectedTable.status === 'occupied' && (
                 <>
                  <Link 
                    to={`/admin/balcao?table=${selectedTable.number}`}
                    className="flex-1 bg-zinc-900 text-white py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={18} /> LANÇAR PEDIDO
                  </Link>
                  <button 
                    onClick={() => handleCloseBill(selectedTable)}
                    className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    FECHAR CONTA
                  </button>
                 </>
               )}
            </div>
          </motion.div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8">
            <h2 className="text-xl font-bold mb-6 text-zinc-900">Nova Mesa</h2>
            <form onSubmit={addTable} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Identificação da Mesa</label>
                <input 
                  type="text" required autoFocus
                  className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold text-lg"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  placeholder="Ex: 01, VIP-1"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-zinc-100 text-zinc-600 py-4 rounded-2xl font-bold hover:bg-zinc-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
