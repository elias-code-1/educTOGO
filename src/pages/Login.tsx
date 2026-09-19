import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Lock, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { CountryCodeSelector } from '../components/CountryCodeSelector';
import { DEFAULT_COUNTRY, Country, buildInternationalPhone } from '../data/countries';

export default function Login() {
  const [selectedCountry, setSelectedCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { signInWithCustomToken } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDigits = phone.replace(/\D/g, '');
    if (!cleanDigits || cleanDigits.length < 8) {
      setError('Veuillez entrer un numéro de téléphone valide.');
      return;
    }
    if (!pin || pin.length < 6) {
      setError('Le code personnel doit contenir 6 chiffres.');
      return;
    }

    const internationalPhone = buildInternationalPhone(selectedCountry.dialCode, cleanDigits);

    setLoading(true);
    setError(null);
    try {
      const { data, error: funcError } = await supabase.functions.invoke('login', {
        body: { phone: internationalPhone, pin },
      });

      if (funcError || !data?.token) {
        throw new Error(data?.message || 'Numéro de téléphone ou code personnel incorrect.');
      }

      await signInWithCustomToken(data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la connexion.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center px-6 py-8 relative">
      <div className="w-full max-w-sm mx-auto">
        <div className="flex items-center justify-center gap-1.5 mb-6">
          <div className="w-6 h-6 rounded-lg bg-brand flex items-center justify-center shadow-sm">
            <span className="text-white text-xs font-bold">e</span>
          </div>
          <span className="font-extrabold text-sm tracking-tight text-gray-900">
            edu<span className="text-brand">FRY</span>
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-3xl shadow-xl border border-brand/5"
        >
          <div className="flex flex-col items-center text-center mb-5">
            <div className="w-14 h-14 rounded-3xl bg-brand-light border border-brand/20 flex items-center justify-center text-brand shadow-sm mb-3">
              <Lock size={24} />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Content de te revoir</h1>
            <p className="text-gray-500 text-[13px] mt-1">Connecte-toi pour retrouver ton avancement.</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Numéro de téléphone</label>
              <div className="relative">
                <CountryCodeSelector
                  selectedCountry={selectedCountry}
                  onSelectCountry={setSelectedCountry}
                  disabled={loading}
                />
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-[108px] pr-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 font-semibold focus:bg-white focus:ring-2 focus:ring-brand/40 focus:border-brand outline-none transition-all tracking-wide"
                  placeholder="00 00 00 00"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Code personnel</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 font-semibold focus:bg-white focus:ring-2 focus:ring-brand/40 focus:border-brand outline-none transition-all tracking-[0.2em]"
                  placeholder="••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || phone.length < 8 || pin.length < 6}
              className="w-full bg-brand text-white py-3.5 rounded-full font-bold hover:bg-brand-dark transition-colors disabled:opacity-50 flex justify-center items-center gap-2 shadow-md mt-6"
            >
              {loading ? <Loader2 className="animate-spin" size={22} /> : "Se connecter"}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-gray-500">
              Nouveau sur l'application ?{' '}
              <button onClick={() => navigate('/signup')} className="text-brand font-bold hover:underline">
                Inscris-toi
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
