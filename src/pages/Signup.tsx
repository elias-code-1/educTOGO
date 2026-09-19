import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { MessageCircle, Lock, ArrowRight, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CountryCodeSelector } from '../components/CountryCodeSelector';
import { DEFAULT_COUNTRY, Country, buildInternationalPhone } from '../data/countries';

export default function Signup() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCountry, setSelectedCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [phone, setPhone] = useState('');
  const [fullPhone, setFullPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { signInWithCustomToken } = useAuth();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDigits = phone.replace(/\D/g, '');
    if (!cleanDigits || cleanDigits.length < 8) {
      setError('Veuillez entrer un numéro de téléphone valide.');
      return;
    }

    const internationalPhone = buildInternationalPhone(selectedCountry.dialCode, cleanDigits);
    setFullPhone(internationalPhone);

    setLoading(true);
    setError(null);
    try {
      const { data, error: funcError } = await supabase.functions.invoke('send-otp', {
        body: { phone: internationalPhone },
      });

      if (funcError || !data || data.status !== 'ok') {
        throw new Error(data?.message || "Impossible d'envoyer le code.");
      }

      setStep(2);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de l'envoi du code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setError('Le code doit contenir 6 chiffres.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const targetPhone = fullPhone || buildInternationalPhone(selectedCountry.dialCode, phone);
      const { data, error: funcError } = await supabase.functions.invoke('verify-otp', {
        body: { phone: targetPhone, code: otp },
      });

      if (funcError || !data || (data.status !== 'ok' && !data.message?.includes('ready'))) {
        throw new Error(data?.message || 'Code incorrect, expiré ou limite de tentatives atteinte.');
      }

      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Code incorrect, expiré ou limite atteinte.');
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 6) {
      setError('Le code personnel doit contenir 6 chiffres.');
      return;
    }
    if (pin !== confirmPin) {
      setError('Les codes ne correspondent pas.');
      setPin('');
      setConfirmPin('');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const targetPhone = fullPhone || buildInternationalPhone(selectedCountry.dialCode, phone);
      const { data, error: funcError } = await supabase.functions.invoke('create-account', {
        body: { phone: targetPhone, pin },
      });

      if (funcError || !data?.token) {
        throw new Error(data?.message || 'Impossible de créer le compte.');
      }

      await signInWithCustomToken(data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la création du compte.');
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

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white p-6 rounded-3xl shadow-xl border border-brand/5"
            >
              <div className="flex flex-col items-center text-center mb-5">
                <div className="w-14 h-14 rounded-3xl bg-brand-light border border-brand/20 flex items-center justify-center text-brand shadow-sm mb-3">
                  <MessageCircle size={26} />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Rejoins eduFRY</h1>
                <p className="text-gray-500 text-[13px] mt-1 max-w-[260px]">
                  Saisis ton numéro pour commencer à apprendre et recevoir tes synthèses.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                    Numéro de téléphone
                  </label>
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

                <div className="w-full bg-brand-light border border-brand/15 rounded-2xl p-3 flex items-start gap-3">
                  <ShieldCheck size={18} className="text-brand shrink-0 mt-0.5" />
                  <p className="text-[11px] text-brand-dark leading-relaxed">
                    Un code de confirmation à 6 chiffres te sera envoyé par WhatsApp pour sécuriser ton accès.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || phone.length < 8}
                  className="w-full bg-brand text-white py-3.5 rounded-full font-bold hover:bg-brand-dark transition-colors disabled:opacity-50 flex justify-center items-center gap-2 shadow-md mt-4"
                >
                  {loading ? <Loader2 className="animate-spin" size={22} /> : <>Recevoir mon code <ArrowRight size={18} /></>}
                </button>
              </form>

              <div className="mt-5 text-center">
                <p className="text-sm text-gray-500">
                  Déjà inscrit ?{' '}
                  <button onClick={() => navigate('/login')} className="text-brand font-bold hover:underline">
                    Connecte-toi
                  </button>
                </p>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white p-6 rounded-3xl shadow-xl border border-brand/5"
            >
              <div className="flex flex-col items-center text-center mb-5">
                <div className="w-14 h-14 rounded-3xl bg-brand-light border border-brand/20 flex items-center justify-center text-brand shadow-sm mb-3">
                  <MessageCircle size={26} />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Vérifie tes messages</h1>
                <p className="text-gray-500 text-[13px] mt-1 max-w-[280px]">
                  Entre le code à 6 chiffres envoyé par WhatsApp au <span className="font-bold text-gray-900">{fullPhone || buildInternationalPhone(selectedCountry.dialCode, phone)}</span>.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-4 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 text-2xl tracking-[0.5em] text-center font-bold focus:bg-white focus:ring-2 focus:ring-brand/40 focus:border-brand outline-none transition-all"
                    placeholder="••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-brand text-white py-3.5 rounded-full font-bold hover:bg-brand-dark transition-colors disabled:opacity-50 flex justify-center items-center gap-2 shadow-md mt-4"
                >
                  {loading ? <Loader2 className="animate-spin" size={22} /> : "Vérifier le code"}
                </button>
              </form>

              <div className="mt-5 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtp('');
                    setError(null);
                  }}
                  className="text-sm text-gray-500 font-medium hover:text-brand transition-colors"
                >
                  Modifier le numéro
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white p-6 rounded-3xl shadow-xl border border-brand/5"
            >
              <div className="flex flex-col items-center text-center mb-5">
                <div className="w-14 h-14 rounded-3xl bg-brand-light border border-brand/20 flex items-center justify-center text-brand shadow-sm mb-3">
                  <Lock size={24} />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Crée ton code secret</h1>
                <p className="text-gray-500 text-[13px] mt-1 max-w-[260px]">
                  Ce code à 6 chiffres te permettra de te reconnecter rapidement.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                    Nouveau code (6 chiffres)
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={pin}
                    onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 text-xl text-center font-medium focus:bg-white focus:ring-2 focus:ring-brand/40 focus:border-brand outline-none transition-all tracking-widest"
                    placeholder="••••••"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                    Confirmer le code
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={confirmPin}
                    onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 text-xl text-center font-medium focus:bg-white focus:ring-2 focus:ring-brand/40 focus:border-brand outline-none transition-all tracking-widest"
                    placeholder="••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || pin.length !== 6 || confirmPin.length !== 6}
                  className="w-full bg-brand text-white py-3.5 rounded-full font-bold hover:bg-brand-dark transition-colors disabled:opacity-50 flex justify-center items-center gap-2 shadow-md mt-6"
                >
                  {loading ? <Loader2 className="animate-spin" size={22} /> : "Créer mon compte"}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
