import React, { useState, useEffect, FormEvent } from 'react';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Save, Loader2, Palette, Info, Smartphone, Truck, Image as ImageIcon, CheckCircle2, AlertCircle, Upload } from 'lucide-react';
import { Settings as SettingsType, saveSettings, compressImage } from '../../services/dataService';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [settings, setSettings] = useState<SettingsType>({
    name: 'MenuFlow Master',
    logoUrl: '',
    whatsappNumber: '',
    deliveryActive: false,
    deliveryFee: 10,
    deliveryRadius: 5,
    brandColor: '#10b981'
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await compressImage(file, 200); // Small logo
        setSettings({ ...settings, logoUrl: base64 });
      } catch (error) {
        console.error("Error uploading logo:", error);
      }
    }
  };

  useEffect(() => {
    async function fetchSettings() {
      try {
        const docRef = doc(db, 'settings', 'config');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(prev => ({ ...prev, ...docSnap.data() } as SettingsType));
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveStatus('idle');
    try {
      await saveSettings(settings);
      setSaveStatus('success');
      // Clear success message after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error(error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 h-screen animate-pulse space-y-4">
      <div className="w-12 h-12 bg-white/10 rounded-full" />
      <div className="h-4 w-32 bg-white/10 rounded" />
    </div>
  );

  return (
    <div className="max-w-4xl space-y-10 font-sans pb-20">
      <header>
        <h1 className="text-2xl font-black tracking-tight text-white mb-2">AJUSTES DO SISTEMA</h1>
        <p className="text-brand-dim text-sm italic">Configure a identidade e as regras do seu negócio.</p>
      </header>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* IDENTIDADE */}
        <section className="card-gradient p-8 rounded-[2.5rem] border border-brand-border space-y-6">
          <div className="flex items-center gap-3 text-brand-accent mb-4">
            <Palette size={20} />
            <h2 className="text-xs font-black uppercase tracking-widest text-white">Identidade Visual</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-brand-dim uppercase tracking-wider mb-2 block">Nome do Estabelecimento</label>
              <input
                type="text" required
                className="w-full bg-brand-bg/50 border border-brand-border rounded-2xl px-5 py-4 text-sm focus:border-brand-accent outline-none transition-all font-bold"
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-brand-dim uppercase tracking-wider mb-2 block">Logo do Estabelecimento</label>
              <div className="flex gap-4">
                <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-brand-border rounded-2xl p-6 hover:border-brand-accent cursor-pointer transition-all bg-brand-bg/50">
                  <Upload size={24} className="text-brand-dim mb-2" />
                  <span className="text-[10px] font-bold text-brand-dim uppercase">Escolher Arquivo (PNG/JPG)</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </label>
                <div className="w-24 h-24 bg-brand-bg border border-brand-border rounded-2xl flex items-center justify-center overflow-hidden">
                  {settings.logoUrl ? (
                    <img src={settings.logoUrl} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={32} className="text-brand-dim" />
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-brand-dim uppercase tracking-wider mb-2 block">Cor Principal do Sistema</label>
              <div className="flex items-center gap-4 bg-brand-bg/50 border border-brand-border rounded-2xl p-4">
                <input
                  type="color"
                  className="w-12 h-12 bg-transparent border-0 rounded-lg cursor-pointer"
                  value={settings.brandColor}
                  onChange={(e) => setSettings({ ...settings, brandColor: e.target.value })}
                />
                <div>
                  <p className="text-xs font-bold text-white uppercase">{settings.brandColor}</p>
                  <p className="text-[10px] text-brand-dim">Esta cor será usada em botões e destaques.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CONTATO E DELIVERY */}
        <div className="space-y-8">
           <section className="card-gradient p-8 rounded-[2.5rem] border border-brand-border space-y-6">
            <div className="flex items-center gap-3 text-emerald-500 mb-4">
              <Smartphone size={20} />
              <h2 className="text-xs font-black uppercase tracking-widest text-white">Comunicação</h2>
            </div>
            
            <div>
              <label className="text-[10px] font-black text-brand-dim uppercase tracking-wider mb-2 block">WhatsApp de Notificações</label>
              <input
                type="text" required
                className="w-full bg-brand-bg/50 border border-brand-border rounded-2xl px-5 py-4 text-sm focus:border-emerald-500 outline-none transition-all font-mono"
                value={settings.whatsappNumber}
                onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                placeholder="551199999999"
              />
              <p className="text-[10px] text-brand-dim mt-2 italic">Inclua o código do país (55) e DDD.</p>
            </div>
          </section>

          <section className="card-gradient p-8 rounded-[2.5rem] border border-brand-border space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 text-brand-warning">
                <Truck size={20} />
                <h2 className="text-xs font-black uppercase tracking-widest text-white">Delivery</h2>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.deliveryActive}
                  onChange={(e) => setSettings({ ...settings, deliveryActive: e.target.checked })}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-brand-dim/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-accent"></div>
              </label>
            </div>

            {settings.deliveryActive && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                <div>
                  <label className="text-[10px] font-black text-brand-dim uppercase tracking-wider mb-2 block">Taxa de Entrega</label>
                  <input
                    type="number" step="0.01"
                    className="w-full bg-brand-bg/50 border border-brand-border rounded-2xl px-5 py-4 text-sm focus:border-brand-accent outline-none font-bold"
                    value={settings.deliveryFee}
                    onChange={(e) => setSettings({ ...settings, deliveryFee: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-brand-dim uppercase tracking-wider mb-2 block">Raio Máx. (KM)</label>
                  <input
                    type="number"
                    className="w-full bg-brand-bg/50 border border-brand-border rounded-2xl px-5 py-4 text-sm focus:border-brand-accent outline-none font-bold"
                    value={settings.deliveryRadius}
                    onChange={(e) => setSettings({ ...settings, deliveryRadius: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            )}
          </section>

          <button
            type="submit"
            disabled={saving}
            className={`w-full shadow-lg py-5 rounded-2xl font-black uppercase tracking-[0.2em] hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 ${
              saveStatus === 'success' ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 
              saveStatus === 'error' ? 'bg-red-500 text-white shadow-red-500/20' : 
              'bg-brand-accent text-brand-bg shadow-brand-accent/20'
            }`}
          >
            {saving ? (
              <Loader2 className="animate-spin" size={20} />
            ) : saveStatus === 'success' ? (
              <CheckCircle2 size={20} />
            ) : saveStatus === 'error' ? (
              <AlertCircle size={20} />
            ) : (
              <Save size={20} />
            )}
            {saving ? 'SALVANDO...' : saveStatus === 'success' ? 'SALVO COM SUCESSO!' : saveStatus === 'error' ? 'ERRO AO SALVAR' : 'Aplicar Configurações'}
          </button>
        </div>
      </form>
    </div>
  );
}
