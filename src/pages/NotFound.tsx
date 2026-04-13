import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col items-center justify-center p-4 text-center">
      <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
        <AlertCircle size={48} />
      </div>
      <h1 className="text-4xl font-bold text-[#003366] mb-2">404</h1>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Page introuvable</h2>
      <p className="text-gray-500 mb-8 max-w-md">
        Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
      </p>
      <Link 
        to="/" 
        className="flex items-center gap-2 px-6 py-3 bg-[#003366] text-white rounded-xl font-bold hover:bg-[#002244] transition-colors"
      >
        <Home size={20} />
        Retour à l'accueil
      </Link>
    </div>
  );
}
