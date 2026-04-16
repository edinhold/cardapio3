import { Order, Product, Settings, Table } from "../services/dataService";
import { Smartphone, Package, Users, Settings as SettingsIcon, Plus, QrCode } from "lucide-react";

interface AdminDashboardProps {
  settings: Settings;
  products: Product[];
  orders: Order[];
  tables: Table[];
  employees: any[];
}

export default function AdminDashboard({ settings, products, orders, tables, employees }: AdminDashboardProps) {
  return (
    <div className="bento-grid flex-grow p-6">
      {/* DELIVERY CONFIG */}
      <div className="card bg-brand-card border border-brand-border rounded-2xl p-5 flex flex-col">
        <div className="text-[11px] uppercase tracking-wider text-brand-dim mb-3">DELIVERY</div>
        <div className="text-3xl font-bold">{settings.deliveryActive ? 'ABERTO' : 'FECHADO'}</div>
        <p className="text-[11px] text-brand-dim mt-2">
          Raio de {settings.deliveryRadius}km • R$ {settings.deliveryFee.toFixed(2)} taxa
        </p>
      </div>

      {/* WHATSAPP STATUS */}
      <div className="card bg-brand-card border border-brand-border rounded-2xl p-5 flex flex-col">
        <div className="text-[11px] uppercase tracking-wider text-brand-dim mb-3">NOTIFICAÇÕES WHATSAPP</div>
        <div className="text-brand-accent text-xs font-semibold flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-brand-accent shadow-[0_0_8px_var(--color-brand-accent)]" />
          CONECTADO
        </div>
        <p className="text-[10px] text-brand-dim leading-relaxed">
          O sistema enviará mensagens para {settings.whatsappNumber} quando os produtos estiverem prontos.
        </p>
      </div>

      {/* TABLES STATUS */}
      <div className="card bg-brand-card border border-brand-border rounded-2xl p-5 flex flex-col">
        <div className="text-[11px] uppercase tracking-wider text-brand-dim mb-3">MESAS ATIVAS</div>
        <div className="text-3xl font-bold">
          {tables.filter(t => t.status !== 'free').length}/{tables.length}
        </div>
        <div className="mt-3 bg-brand-border h-1 rounded-full overflow-hidden">
          <div 
            className="bg-brand-accent h-full transition-all duration-500" 
            style={{ width: `${(tables.filter(t => t.status !== 'free').length / (tables.length || 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* EMPLOYEES LIST */}
      <div className="card bg-brand-card border border-brand-border rounded-2xl p-5 flex flex-col col-span-1 row-span-2">
        <div className="text-[11px] uppercase tracking-wider text-brand-dim mb-4">FUNCIONÁRIOS</div>
        <div className="space-y-4 overflow-y-auto max-h-[300px] pr-1">
          {employees.map((emp) => (
            <div key={emp.id || emp.name} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-border flex items-center justify-center text-[10px] font-bold">
                {emp?.name?.[0] || '?'}
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium">{emp.name}</p>
                <span className="text-[9px] bg-brand-border px-1.5 py-0.5 rounded text-brand-dim uppercase tracking-tighter">
                  {emp.role}
                </span>
              </div>
            </div>
          ))}
          {employees.length === 0 && (
            <div className="text-xs text-brand-dim italic">Nenhum funcionário...</div>
          )}
        </div>
        <button className="mt-auto bg-brand-border hover:bg-white/10 text-white text-[10px] py-2 rounded-lg font-semibold uppercase tracking-widest transition-colors">
          GERENCIAR TIME
        </button>
      </div>

      {/* SUGGESTION PANEL */}
      <div className="card suggestion-card rounded-2xl p-5 flex flex-col col-span-2 row-span-1">
        <div className="text-[11px] uppercase tracking-wider text-brand-accent mb-3 font-semibold">SUGESTÃO DE MELHORIA: SMART INVENTORY</div>
        <div className="flex gap-4">
          <span className="text-3xl">💡</span>
          <div>
            <p className="text-xs font-bold mb-1">Sincronização Automática de Estoque</p>
            <p className="text-xs text-brand-dim leading-relaxed">
              Implementar um sistema onde o cardápio digital remove automaticamente produtos cujos insumos principais atingiram o nível crítico no estoque, evitando pedidos frustrados de clientes.
            </p>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="card bg-brand-card border border-brand-border rounded-2xl p-5 flex flex-col col-span-1">
        <div className="text-[11px] uppercase tracking-wider text-brand-dim mb-3">AÇÕES RÁPIDAS</div>
        <div className="grid grid-cols-2 gap-2">
          <button className="flex flex-col items-center justify-center bg-brand-border p-2 rounded-xl hover:bg-white/5 transition-theme">
            <Plus size={16} className="mb-1" />
            <span className="text-[8px] uppercase tracking-tighter font-bold">Produto</span>
          </button>
          <button className="flex flex-col items-center justify-center bg-brand-border p-2 rounded-xl hover:bg-white/5 transition-theme">
            <QrCode size={16} className="mb-1" />
            <span className="text-[8px] uppercase tracking-tighter font-bold">QR Mesas</span>
          </button>
        </div>
      </div>
    </div>
  );
}
