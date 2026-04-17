import React from 'react';
import KitchenPanel from '../components/KitchenPanel';
import { Order, Settings, updateOrderStatus } from '../services/dataService';
import { ChefHat, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface KitchenOfflineProps {
  orders: Order[];
  settings: Settings;
}

export default function KitchenOffline({ orders, settings }: KitchenOfflineProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col font-sans">
      {/* Header focused for Kitchen Staff */}
      <header className="px-8 py-5 border-b border-brand-border flex justify-between items-center bg-brand-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-accent rounded-2xl flex items-center justify-center text-brand-bg shadow-lg shadow-brand-accent/20">
            <ChefHat size={28} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight uppercase">Painel de Produção</h1>
            <p className="text-[10px] text-brand-accent font-bold uppercase tracking-[0.2em]">{settings.name}</p>
          </div>
        </div>

        <button 
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-brand-dim hover:bg-white/5 hover:text-white transition-all border border-brand-border"
        >
          <ArrowLeft size={16} /> Voltar ao Painel
        </button>
      </header>

      <main className="flex-1 p-8 overflow-hidden h-screen flex flex-col">
        <div className="card-gradient flex-1 rounded-[2.5rem] border border-brand-border p-8 flex flex-col overflow-hidden max-w-6xl mx-auto w-full">
          <KitchenPanel 
            orders={orders} 
            onUpdateStatus={(id, status, phone) => updateOrderStatus(id, status, phone, settings)} 
          />
        </div>
      </main>

      <footer className="px-8 py-4 border-t border-brand-border flex justify-center items-center text-[10px] text-brand-dim font-mono tracking-tighter bg-brand-bg/80 backdrop-blur">
         <span className="flex items-center gap-1.5"><ChefHat size={12} /> ÁREA TÉCNICA • MÓDULO COZINHA</span>
      </footer>

      {/* Dynamic Style Injection */}
      <style>{`
        :root {
          ${settings.brandColor ? `--color-brand-accent: ${settings.brandColor};` : ''}
          ${settings.textColor ? `--color-brand-text: ${settings.textColor};` : ''}
          ${settings.textDimColor ? `--color-brand-dim: ${settings.textDimColor};` : ''}
        }
      `}</style>
    </div>
  );
}
