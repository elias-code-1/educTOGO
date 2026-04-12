import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LayoutDashboard, BookOpen, BarChart3, LogOut, Github, Facebook, Mail, Apple, User, Phone } from 'lucide-react';
import { cn } from './lib/utils';
import { ConfirmationResult } from 'firebase/auth';

// Pages
import Dashboard from './pages/Dashboard';
import Curriculum from './pages/Curriculum';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Scan from './pages/Scan';
import StudyPack from './pages/StudyPack';

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function Login() {
  const { user, signInWithGoogle, signInWithGithub, signInWithFacebook, signInWithApple, signInWithEmail, signUpWithEmail, setupRecaptcha, signInWithPhone } = useAuth();
  const [authMode, setAuthMode] = useState<'email' | 'phone'>('email');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  if (user) {
    return <Navigate to="/" />;
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Une erreur est survenue lors de l'authentification.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = setupRecaptcha('recaptcha-container');
      }
      const confirmation = await signInWithPhone(phoneNumber, window.recaptchaVerifier);
      setConfirmationResult(confirmation);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur lors de l'envoi du code SMS. Vérifiez le format (+228...).");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    setError('');
    setLoading(true);
    try {
      await confirmationResult.confirm(verificationCode);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Code de vérification invalide.");
    } finally {
      setLoading(false);
    }
  };

  const handleProviderAuth = async (providerFn: () => Promise<void>) => {
    setError('');
    try {
      await providerFn();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "La connexion avec ce fournisseur a échoué.");
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">CPLA 1er D</h1>
          <p className="text-gray-500">Suivi des révisions</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
            {error}
          </div>
        )}

        <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
          <button
            onClick={() => setAuthMode('email')}
            className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-colors", authMode === 'email' ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700")}
          >
            Email
          </button>
          <button
            onClick={() => setAuthMode('phone')}
            className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-colors", authMode === 'phone' ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700")}
          >
            Téléphone
          </button>
        </div>

        {authMode === 'email' ? (
          <>
            <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                  placeholder="eleve@exemple.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Chargement...' : (isSignUp ? "Créer un compte" : "Se connecter")}
              </button>
            </form>

            <div className="text-center mb-6">
              <button 
                type="button" 
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-blue-600 font-medium hover:underline"
              >
                {isSignUp ? "Déjà un compte ? Se connecter" : "Pas de compte ? S'inscrire"}
              </button>
            </div>
          </>
        ) : (
          <>
            {!confirmationResult ? (
              <form onSubmit={handleSendCode} className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de téléphone</label>
                  <input 
                    type="tel" 
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                    placeholder="+228 90 00 00 00"
                  />
                  <p className="text-xs text-gray-500 mt-1">N'oubliez pas l'indicatif du pays (ex: +228)</p>
                </div>
                <div id="recaptcha-container"></div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Phone size={18} />
                  {loading ? 'Envoi...' : "Recevoir le code SMS"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code de vérification</label>
                  <input 
                    type="text" 
                    required
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-center tracking-widest text-lg"
                    placeholder="123456"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Vérification...' : "Valider le code"}
                </button>
                <button 
                  type="button" 
                  onClick={() => setConfirmationResult(null)}
                  className="w-full text-sm text-gray-500 hover:text-gray-700"
                >
                  Changer de numéro
                </button>
              </form>
            )}
          </>
        )}

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">Ou continuer avec</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleProviderAuth(signInWithGoogle)}
            className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            Google
          </button>
          <button
            onClick={() => handleProviderAuth(signInWithApple)}
            className="flex items-center justify-center gap-2 bg-black text-white py-2.5 rounded-xl font-medium hover:bg-gray-900 transition-colors"
          >
            <Apple className="w-5 h-5" fill="currentColor" />
            Apple
          </button>
          <button
            onClick={() => handleProviderAuth(signInWithGithub)}
            className="flex items-center justify-center gap-2 bg-[#24292F] text-white py-2.5 rounded-xl font-medium hover:bg-[#24292F]/90 transition-colors"
          >
            <Github className="w-5 h-5" fill="currentColor" />
            GitHub
          </button>
          <button
            onClick={() => handleProviderAuth(signInWithFacebook)}
            className="flex items-center justify-center gap-2 bg-[#1877F2] text-white py-2.5 rounded-xl font-medium hover:bg-[#1877F2]/90 transition-colors"
          >
            <Facebook className="w-5 h-5" fill="currentColor" />
            Facebook
          </button>
        </div>
      </div>
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { logOut } = useAuth();
  
  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Accueil' },
    { path: '/curriculum', icon: BookOpen, label: 'Programme' },
    { path: '/analytics', icon: BarChart3, label: 'Analytiques' },
    { path: '/profile', icon: User, label: 'Profil' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      {/* Sidebar (Desktop) */}
      <nav className="hidden md:flex md:w-64 md:h-screen bg-[#003366] text-white flex-col z-10">
        <div className="flex items-center gap-3 p-6 border-b border-white/10">
          <div className="w-10 h-10 bg-[#FFCC00] text-[#003366] rounded-xl flex items-center justify-center">
            <BookOpen size={20} />
          </div>
          <div>
            <h1 className="font-bold text-white">CPLA 1er D</h1>
            <p className="text-xs text-white/70">Suivi des révisions</p>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col p-4 gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl transition-colors",
                  isActive 
                    ? "bg-white/20 text-white font-bold" 
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
              >
                <Icon size={20} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </div>
        
        <div className="p-4 border-t border-white/10">
          <button
            onClick={logOut}
            className="flex items-center gap-3 p-3 w-full text-red-400 hover:bg-white/10 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Déconnexion</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 pb-24 md:pb-0 overflow-y-auto bg-[#F4F6F8]">
        <div className="max-w-md mx-auto md:max-w-5xl md:p-8 min-h-screen relative">
          {children}
        </div>
      </main>

      {/* Bottom Nav (Mobile) - Yas Style */}
      <nav className="md:hidden fixed bottom-0 w-full bg-[#003366] text-white z-50 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        <div className="flex justify-around items-center h-20 px-2 relative">
          {/* Left Items */}
          <div className="flex w-2/5 justify-around">
            <Link to="/" className={cn("flex flex-col items-center gap-1 p-2", location.pathname === '/' ? "text-[#FFCC00]" : "text-white/70")}>
              <LayoutDashboard size={24} />
              <span className="text-[10px] font-medium">Accueil</span>
            </Link>
            <Link to="/curriculum" className={cn("flex flex-col items-center gap-1 p-2", location.pathname === '/curriculum' ? "text-[#FFCC00]" : "text-white/70")}>
              <BookOpen size={24} />
              <span className="text-[10px] font-medium">Programme</span>
            </Link>
          </div>

          {/* Central Floating Button (Scan) */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-6">
            <Link to="/scan" className="flex flex-col items-center">
              <div className="w-16 h-16 bg-[#FFCC00] rounded-2xl rotate-45 flex items-center justify-center shadow-lg border-4 border-[#F4F6F8]">
                <div className="-rotate-45 text-[#003366]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>
                </div>
              </div>
            </Link>
          </div>

          {/* Right Items */}
          <div className="flex w-2/5 justify-around">
            <Link to="/analytics" className={cn("flex flex-col items-center gap-1 p-2", location.pathname === '/analytics' ? "text-[#FFCC00]" : "text-white/70")}>
              <BarChart3 size={24} />
              <span className="text-[10px] font-medium">Analytiques</span>
            </Link>
            <Link to="/profile" className={cn("flex flex-col items-center gap-1 p-2", location.pathname === '/profile' ? "text-[#FFCC00]" : "text-white/70")}>
              <User size={24} />
              <span className="text-[10px] font-medium">Profil</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
            <Route path="/curriculum" element={<PrivateRoute><Layout><Curriculum /></Layout></PrivateRoute>} />
            <Route path="/analytics" element={<PrivateRoute><Layout><Analytics /></Layout></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Layout><Profile /></Layout></PrivateRoute>} />
            <Route path="/scan" element={<PrivateRoute><Layout><Scan /></Layout></PrivateRoute>} />
            <Route path="/study-pack/:id" element={<PrivateRoute><Layout><StudyPack /></Layout></PrivateRoute>} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}
