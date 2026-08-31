import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Phone, Lock, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { signInWithCustomToken } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 8) {
      setError("Veuillez entrer un numéro de téléphone valide.");
      return;
    }
    if (!pin || pin.length < 6) {
      setError("Le code personnel doit contenir 6 chiffres.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: funcError } = await supabase.functions.invoke('login', {
        body: { phone, pin }
      });
      
      // Temporary workaround while edge functions are mock/empty
      if (!data?.token && data?.status === 'ok') {
        throw new Error("L'Edge Function login n'a pas renvoyé de token. Implémentation requise côté serveur.");
      }

      if (funcError || !data?.token) {
        throw new Error(data?.message || "Numéro de téléphone ou code personnel incorrect.");
      }

      await signInWithCustomToken(data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de la connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-6 relative">
      <div className="w-full max-w-sm mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl shadow-xl"
        >
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Te revoilà !</h1>
            <p className="text-gray-500 text-sm">
              Connecte-toi pour retrouver ton avancement.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 ml-1">
                Numéro de téléphone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Phone size={18} />
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="00000000"
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 font-medium focus:bg-white focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none transition-all tracking-wide"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 ml-1">
                Code personnel
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="6 chiffres"
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 font-medium focus:bg-white focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none transition-all tracking-[0.2em]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || phone.length < 8 || pin.length < 6}
              className="w-full bg-[#003366] text-white py-4 rounded-xl font-bold hover:bg-[#002244] transition-colors disabled:opacity-50 flex justify-center items-center gap-2 shadow-md mt-6"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : "Se connecter"}
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Nouveau sur l'application ?{' '}
              <button onClick={() => navigate('/signup')} className="text-[#003366] font-bold hover:underline">
                Inscris-toi
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
