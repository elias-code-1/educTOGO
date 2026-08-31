import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LayoutDashboard, BookOpen, BarChart3, LogOut, Mail, User } from 'lucide-react';
import { cn } from './lib/utils';

// Pages
import Dashboard from './pages/Dashboard';
import Curriculum from './pages/Curriculum';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Scan from './pages/Scan';
import ScanHistory from './pages/ScanHistory';
import StudyPack from './pages/StudyPack';
import NotFound from './pages/NotFound';
import Onboarding from './pages/Onboarding';
import Signup from './pages/Signup';
import Login from './pages/Login';

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366]"></div>
    </div>;
  }
  
  return user ? <>{children}</> : <Navigate to="/onboarding" />;
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
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
            <Route path="/curriculum" element={<PrivateRoute><Layout><Curriculum /></Layout></PrivateRoute>} />
            <Route path="/analytics" element={<PrivateRoute><Layout><Analytics /></Layout></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Layout><Profile /></Layout></PrivateRoute>} />
            <Route path="/scan" element={<PrivateRoute><Layout><Scan /></Layout></PrivateRoute>} />
            <Route path="/scan-history" element={<PrivateRoute><Layout><ScanHistory /></Layout></PrivateRoute>} />
            <Route path="/study-pack/:id" element={<PrivateRoute><Layout><StudyPack /></Layout></PrivateRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}
