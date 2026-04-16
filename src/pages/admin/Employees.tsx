import { useState, useEffect, FormEvent } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { Plus, Trash2, User, ShieldCheck, ChefHat, UserCircle } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  role: 'admin' | 'waiter' | 'kitchen';
  email: string;
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'waiter' as Employee['role']
  });

  useEffect(() => {
    const q = query(collection(db, 'employees'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee)));
    });
    return unsubscribe;
  }, []);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'employees'), formData);
      setFormData({ name: '', email: '', role: 'waiter' });
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const deleteEmployee = async (id: string) => {
    if (confirm('Remover este funcionário?')) {
      await deleteDoc(doc(db, 'employees', id));
    }
  };

  const roleLabels = {
    admin: { label: 'Administrador', icon: ShieldCheck, color: 'text-purple-600', bg: 'bg-purple-100' },
    waiter: { label: 'Garçom / Atendimento', icon: UserCircle, color: 'text-blue-600', bg: 'bg-blue-100' },
    kitchen: { label: 'Cozinha / Produção', icon: ChefHat, color: 'text-orange-600', bg: 'bg-orange-100' },
  };

  return (
    <div>
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Equipe & Funcionários</h1>
          <p className="text-zinc-500">Cadastre e gerencie as funções da sua equipe.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-orange-700 transition-all"
        >
          <Plus size={18} />
          Cadastrar Funcionário
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map(emp => {
          const role = roleLabels[emp.role];
          return (
            <div key={emp.id} className="bg-white rounded-2xl border border-zinc-200 p-6 flex items-start gap-4 hover:border-zinc-300 transition-colors">
              <div className={`p-3 rounded-xl ${role.bg} ${role.color}`}>
                <role.icon size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-zinc-900">{emp.name}</h3>
                <p className="text-xs text-zinc-500 mb-2">{emp.email}</p>
                <span className={`text-[10px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded ${role.bg} ${role.color}`}>
                  {role.label}
                </span>
              </div>
              <button 
                onClick={() => deleteEmployee(emp.id)}
                className="text-zinc-300 hover:text-red-500 transition-colors"
                title="Remover"
              >
                <Trash2 size={18} />
              </button>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8">
            <h2 className="text-xl font-bold mb-6">Cadastrar Funcionário</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Nome Completo</label>
                <input 
                  type="text" required autoFocus
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">E-mail Corporativo/Acesso</label>
                <input 
                  type="email" required
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Função / Cargo</label>
                <select 
                  required
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                >
                  <option value="waiter">Atendimento / Garçom</option>
                  <option value="kitchen">Cozinha / Produção</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
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
                  Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
