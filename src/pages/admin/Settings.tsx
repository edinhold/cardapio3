import { useState, useEffect, FormEvent } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Save, Loader2 } from 'lucide-react';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    name: '',
    logoUrl: '',
    whatsapp: '',
    deliveryEnabled: false,
    deliveryFee: 0,
  });

  useEffect(() => {
    async function fetchSettings() {
      const docRef = doc(db, 'settings', 'main');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSettings(docSnap.data() as any);
      }
      setLoading(false);
    }
    fetchSettings();
  }, []);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'main'), settings);
      alert('Configurações salvas!');
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="animate-pulse">Carregando...</div>;

  return (
    <div className="max-w-2xl">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Configurações Gerais</h1>
        <p className="text-zinc-500">Ajuste as informações básicas do seu estabelecimento.</p>
      </header>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white p-6 rounded-xl border border-zinc-200 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Nome do Estabelecimento
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              placeholder="Ex: Pizzaria Fornalha"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              URL da Logo
            </label>
            <input
              type="url"
              className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              value={settings.logoUrl}
              onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
              placeholder="https://sua-logo.com/imagem.png"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              WhatsApp (com DDD)
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              value={settings.whatsapp}
              onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
              placeholder="Ex: 11999999999"
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-zinc-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-zinc-900">Sistemas de Delivery</h3>
              <p className="text-xs text-zinc-500">Ativar ou desativar pedidos para entrega.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.deliveryEnabled}
                onChange={(e) => setSettings({ ...settings, deliveryEnabled: e.target.checked })}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
            </label>
          </div>

          {settings.deliveryEnabled && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Taxa de Entrega (R$)
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                value={settings.deliveryFee}
                onChange={(e) => setSettings({ ...settings, deliveryFee: parseFloat(e.target.value) })}
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-orange-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-orange-700 transition-all active:scale-95 disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          Salvar Configurações
        </button>
      </form>
    </div>
  );
}
