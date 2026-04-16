import { useState, useEffect, FormEvent } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { Plus, Trash2, Smartphone, MoreVertical } from 'lucide-react';

interface Table {
  id: string;
  number: string;
  status: 'free' | 'occupied' | 'reserved';
}

export default function Tables() {
  const [tables, setTables] = useState<Table[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'tables'), orderBy('number'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTables(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Table)));
    });
    return unsubscribe;
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

  return (
    <div>
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Gestão de Mesas</h1>
          <p className="text-zinc-500">Controle o status das mesas do seu salão.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-orange-700 transition-all"
        >
          <Plus size={18} />
          Adicionar Mesa
        </button>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {tables.map(table => (
          <div key={table.id} className="bg-white rounded-2xl border border-zinc-200 p-6 flex flex-col items-center gap-4 relative group">
            <button 
              onClick={() => deleteTable(table.id)}
              className="absolute top-2 right-2 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={16} />
            </button>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              table.status === 'free' ? 'bg-green-100 text-green-600' : 
              table.status === 'occupied' ? 'bg-zinc-900 text-white' : 'bg-orange-100 text-orange-600'
            }`}>
              <Smartphone size={24} />
            </div>
            <div className="text-center">
              <h3 className="font-black text-xl text-zinc-900">Mesa {table.number}</h3>
              <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${
                table.status === 'free' ? 'text-green-500' : 
                table.status === 'occupied' ? 'text-zinc-400' : 'text-orange-500'
              }`}>
                {table.status === 'free' ? 'Livre' : 
                 table.status === 'occupied' ? 'Ocupada' : 'Reservada'}
              </p>
            </div>
            <div className="w-full pt-4 border-t border-zinc-50 grid grid-cols-2 gap-2">
               <button 
                 onClick={() => updateStatus(table.id, 'free')}
                 className="text-[9px] uppercase font-bold text-zinc-400 hover:text-green-500 transition-colors"
               >
                 Livre
               </button>
               <button 
                 onClick={() => updateStatus(table.id, 'occupied')}
                 className="text-[9px] uppercase font-bold text-zinc-400 hover:text-zinc-900 transition-colors"
               >
                 Ocupada
               </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <h2 className="text-xl font-bold mb-6">Nova Mesa</h2>
            <form onSubmit={addTable} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Identificação da Mesa</label>
                <input 
                  type="text" required autoFocus
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  placeholder="Ex: 01, VIP, Pátio 1"
                />
              </div>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-zinc-100 text-zinc-600 py-3 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700"
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
