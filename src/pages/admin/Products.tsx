import { useState, useEffect, FormEvent } from 'react';
import { db } from '../../firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { Plus, Pencil, Trash2, X, Image as ImageIcon } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  imageUrl: string;
  available: boolean;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form States
  const [newCatName, setNewCatName] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    categoryId: '',
    imageUrl: '',
    available: true
  });

  useEffect(() => {
    const qProducts = query(collection(db, 'products'), orderBy('name'));
    const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });

    const qCats = query(collection(db, 'categories'), orderBy('name'));
    const unsubscribeCats = onSnapshot(qCats, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    });

    return () => {
      unsubscribeProducts();
      unsubscribeCats();
    };
  }, []);

  const handleSaveProduct = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), formData);
      } else {
        await addDoc(collection(db, 'products'), formData);
      }
      closeModal();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar produto.');
    }
  };

  const handleSaveCategory = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'categories'), { name: newCatName });
      setNewCatName('');
      setIsCatModalOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const deleteProduct = async (id: string) => {
    if (confirm('Deseja excluir este produto?')) {
      await deleteDoc(doc(db, 'products', id));
    }
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        categoryId: product.categoryId,
        imageUrl: product.imageUrl,
        available: product.available
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: 0,
        categoryId: categories[0]?.id || '',
        imageUrl: '',
        available: true
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  return (
    <div>
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Produtos & Cardápio</h1>
          <p className="text-zinc-500">Gerencie seus itens e categorias.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsCatModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-zinc-200 rounded-xl font-medium text-zinc-700 hover:bg-zinc-50 transition-all"
          >
            <Plus size={18} />
            Categoria
          </button>
          <button 
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20"
          >
            <Plus size={18} />
            Novo Produto
          </button>
        </div>
      </header>

      {/* Categories Horizontal List */}
      <div className="mb-8 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map(cat => (
          <span key={cat.id} className="px-3 py-1.5 bg-zinc-100 text-zinc-600 rounded-full text-sm font-medium whitespace-nowrap">
            {cat.name}
          </span>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <div key={product.id} className="bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:shadow-md transition-all group">
            <div className="h-40 bg-zinc-100 flex items-center justify-center relative">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="text-zinc-300" size={32} />
              )}
              {!product.available && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-bold text-xs uppercase tracking-widest">Indisponível</span>
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-zinc-900">{product.name}</h3>
                <span className="text-orange-600 font-bold">R$ {product.price.toFixed(2)}</span>
              </div>
              <p className="text-xs text-zinc-500 line-clamp-2 mb-4 h-8">{product.description}</p>
              <div className="flex justify-between items-center text-zinc-400">
                <span className="text-[10px] uppercase font-mono tracking-wider bg-zinc-50 px-2 py-1 rounded border border-zinc-100 italic">
                  {categories.find(c => c.id === product.categoryId)?.name || 'Sem categoria'}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => openModal(product)} className="p-2 hover:bg-zinc-50 hover:text-zinc-900 rounded-lg transition-colors">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => deleteProduct(product.id)} className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
            <button onClick={closeModal} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600">
              <X size={24} />
            </button>
            <h2 className="text-xl font-bold mb-6">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h2>
            
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Nome</label>
                <input 
                  type="text" required
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Descrição</label>
                <textarea 
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Preço</label>
                  <input 
                    type="number" step="0.01" required
                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Categoria</label>
                  <select 
                    required
                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                  >
                    <option value="">Selecione...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">URL da Imagem</label>
                <input 
                  type="url"
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                />
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox"
                  id="available"
                  checked={formData.available}
                  onChange={(e) => setFormData({...formData, available: e.target.checked})}
                />
                <label htmlFor="available" className="text-sm font-medium text-zinc-700">Disponível para venda</label>
              </div>
              <button type="submit" className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition-all">
                Salvar Alterações
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Nova Categoria</h2>
              <button onClick={() => setIsCatModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Nome da Categoria</label>
                <input 
                  type="text" required autoFocus
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                />
              </div>
              <button type="submit" className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition-all">
                Criar Categoria
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
