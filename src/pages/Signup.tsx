import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Phone, MessageSquare, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Signup() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { signInWithCustomToken } = useAuth();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 8) {
      setError("Veuillez entrer un numéro de téléphone valide.");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const { data, error: funcError } = await supabase.functions.invoke('send-otp', {
        body: { phone }
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
      setError("Le code doit contenir 6 chiffres.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: funcError } = await supabase.functions.invoke('verify-otp', {
        body: { phone, code: otp }
      });
      
      // Handle the case where verify-otp is just a placeholder for now
      // In a real scenario, this would validate against the edge function
      // and we might get standard errors like 'invalid_code', 'expired', etc.
      if (funcError || !data || (data.status !== 'ok' && !data.message?.includes('ready'))) {
        throw new Error(data?.message || "Code incorrect, expiré ou limite de tentatives atteinte.");
      }
      
      setStep(3);
    } catch (err: any) {
      setError(err.message || "Code incorrect, expiré ou limite atteinte.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 6) {
      setError("Le code personnel doit contenir 6 chiffres.");
      return;
    }
    if (pin !== confirmPin) {
      setError("Les codes ne correspondent pas.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: funcError } = await supabase.functions.invoke('create-account', {
        body: { phone, pin }
      });
      
      // Temporary workaround while edge functions are mock/empty
      if (!data?.token && data?.status === 'ok') {
        throw new Error("L'Edge Function create-account n'a pas renvoyé de token. Implémentation requise côté serveur.");
      }

      if (funcError || !data?.token) {
        throw new Error(data?.message || "Impossible de créer le compte.");
      }

      await signInWithCustomToken(data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de la création du compte.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-6 relative">
      <div className="w-full max-w-sm mx-auto">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white p-8 rounded-3xl shadow-xl"
            >
              <div className="w-16 h-16 bg-blue-100 text-[#003366] rounded-2xl flex items-center justify-center mb-6">
                <Phone size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Quel est ton numéro ?</h2>
              <p className="text-gray-500 mb-6 text-sm">
                Un code de vérification te sera envoyé directement par WhatsApp.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="Numéro de téléphone"
                    className="w-full px-4 py-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-lg font-medium focus:bg-white focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none transition-all tracking-wide"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || phone.length < 8}
                  className="w-full bg-[#003366] text-white py-4 rounded-xl font-bold hover:bg-[#002244] transition-colors disabled:opacity-50 flex justify-center items-center gap-2 shadow-md"
                >
                  {loading ? <Loader2 className="animate-spin" size={24} /> : "Continuer"}
                </button>
              </form>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  Déjà inscrit ?{' '}
                  <button onClick={() => navigate('/login')} className="text-[#003366] font-bold hover:underline">
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
              className="bg-white p-8 rounded-3xl shadow-xl"
            >
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                <MessageSquare size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Vérifie tes messages</h2>
              <p className="text-gray-500 mb-6 text-sm">
                Entre le code à 6 chiffres que nous venons d'envoyer par WhatsApp au <span className="font-bold text-gray-900">{phone}</span>.
              </p>

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
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Code à 6 chiffres"
                    className="w-full px-4 py-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-2xl tracking-[0.5em] text-center font-bold focus:bg-white focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-[#003366] text-white py-4 rounded-xl font-bold hover:bg-[#002244] transition-colors disabled:opacity-50 flex justify-center items-center gap-2 shadow-md"
                >
                  {loading ? <Loader2 className="animate-spin" size={24} /> : "Vérifier le code"}
                </button>
              </form>
              
              <div className="mt-6 text-center">
                <button 
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm text-gray-500 font-medium hover:text-[#003366] transition-colors"
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
              className="bg-white p-8 rounded-3xl shadow-xl"
            >
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
                <Lock size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Sécurise ton compte</h2>
              <p className="text-gray-500 mb-6 text-sm">
                Crée un code personnel à 6 chiffres qui te servira de mot de passe pour te connecter à l'avenir.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Nouveau code (6 chiffres)"
                    className="w-full px-4 py-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xl text-center font-medium focus:bg-white focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none transition-all tracking-widest"
                  />
                </div>
                <div>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Confirmer le code"
                    className="w-full px-4 py-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xl text-center font-medium focus:bg-white focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none transition-all tracking-widest"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || pin.length !== 6 || confirmPin.length !== 6}
                  className="w-full bg-[#003366] text-white py-4 rounded-xl font-bold hover:bg-[#002244] transition-colors disabled:opacity-50 flex justify-center items-center gap-2 shadow-md mt-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={24} /> : "Créer mon compte"}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
