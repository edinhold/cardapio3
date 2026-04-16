import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, LogIn, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate('/admin');
    } catch (err: any) {
      console.error(err);
      setError('Falha na autenticação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0B0A] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#161412] border border-[#2A2826] rounded-3xl p-8 md:p-10 shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <ShieldCheck size={32} className="text-[#0D0B0A]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">MenuFlow Admin</h1>
          <p className="text-emerald-500/60 text-sm font-medium uppercase tracking-[0.2em]">Painel de Gestão</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm"
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </motion.div>
        )}

        <div className="space-y-6">
          <p className="text-[#A19E9B] text-center text-sm leading-relaxed">
            Bem-vindo ao sistema de gestão. <br />
            Para acessar, faça login com sua conta Google.
          </p>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full group relative bg-white hover:bg-emerald-50 text-black h-14 rounded-2xl font-bold flex items-center justify-center gap-4 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={20} className="transition-transform group-hover:translate-x-1" />
                <span>ENTRAR COM GOOGLE</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-10 pt-8 border-t border-[#2A2826] flex justify-center">
          <div className="flex items-center gap-2 text-[10px] text-[#A19E9B] uppercase tracking-widest font-bold">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            SISTEMA SEGURO
          </div>
        </div>
      </motion.div>
    </div>
  );
}
