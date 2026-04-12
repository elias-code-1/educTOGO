import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, getDocs, onSnapshot } from 'firebase/firestore';
import { differenceInDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Play, Trophy, Clock, BookOpen, Calculator, Atom, Leaf, Languages, Globe, Scale, Eye, EyeOff, Map, PenTool, HelpCircle, MessageSquare, Camera } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGrade, setShowGrade] = useState(true);

  const examDate = new Date('2026-05-18');
  const daysRemaining = differenceInDays(examDate, new Date());

  useEffect(() => {
    if (!user) return;

    const unsubscribeSubjects = onSnapshot(collection(db, 'users', user.uid, 'subjects'), (snapshot) => {
      const subs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubjects(subs);
      setLoading(false);
    });

    const unsubscribeSessions = onSnapshot(collection(db, 'users', user.uid, 'sessions'), (snapshot) => {
      const sess = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSessions(sess);
    });

    return () => {
      unsubscribeSubjects();
      unsubscribeSessions();
    };
  }, [user]);

  if (loading) {
    return <div className="animate-pulse flex flex-col gap-6 p-4">
      <div className="h-32 bg-gray-200 rounded-2xl"></div>
      <div className="grid grid-cols-4 gap-4">
        <div className="h-20 bg-gray-200 rounded-2xl"></div>
        <div className="h-20 bg-gray-200 rounded-2xl"></div>
        <div className="h-20 bg-gray-200 rounded-2xl"></div>
        <div className="h-20 bg-gray-200 rounded-2xl"></div>
      </div>
    </div>;
  }

  // Calculate stats
  const totalChapters = subjects.reduce((acc, sub) => acc + sub.totalChapters, 0);
  const completedChapters = subjects.reduce((acc, sub) => acc + sub.completedChapters, 0);
  const progress = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
  
  let totalWeightedGrades = 0;
  let totalCoefs = 0;
  
  subjects.forEach(sub => {
    const coef = sub.coefficient || 3;
    const subjectGrade = sub.totalChapters > 0 ? (sub.completedChapters / sub.totalChapters) * 20 : 0;
    totalWeightedGrades += subjectGrade * coef;
    totalCoefs += coef;
  });
  
  const estimatedGPA = totalCoefs > 0 ? (totalWeightedGrades / totalCoefs).toFixed(2) : "0.00";

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Calculator': return <Calculator size={24} />;
      case 'Atom': return <Atom size={24} />;
      case 'Leaf': return <Leaf size={24} />;
      case 'Languages': return <Languages size={24} />;
      case 'Globe': return <Globe size={24} />;
      case 'BookOpen': return <BookOpen size={24} />;
      case 'Scale': return <Scale size={24} />;
      default: return <Play size={24} />;
    }
  };

  return (
    <div className="pb-8">
      {/* Header Section - Yas Style */}
      <div className="bg-gradient-to-br from-[#E6F0FA] to-white px-4 pt-6 pb-8 rounded-b-[40px] shadow-sm relative overflow-hidden">
        {/* Decorative background circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-50/50 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>

        <div className="relative z-10 flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-sm font-bold text-[#003366] uppercase tracking-wider">{user?.displayName?.split(' ')[0] || 'Élève'}</h1>
              <p className="text-sm text-[#003366]/80">Bon retour !</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-center mt-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-6 h-6 bg-[#FFCC00] rounded flex items-center justify-center text-[#003366] font-bold text-xs">
              C
            </div>
            <span className="text-[#003366] font-medium text-lg">Moyenne Estimée</span>
          </div>
          
          <div className="flex items-center justify-center gap-3">
            <h2 className="text-4xl font-bold text-[#003366] tracking-tight">
              {showGrade ? estimatedGPA : '******'}
            </h2>
            <span className="text-xl font-bold text-[#003366]">/20</span>
            <button 
              onClick={() => setShowGrade(!showGrade)}
              className="text-[#003366]/60 hover:text-[#003366] transition-colors ml-2"
            >
              {showGrade ? <EyeOff size={24} /> : <Eye size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions - Yas Style */}
      <div className="px-4 -mt-4 relative z-20">
        <div className="bg-white rounded-3xl shadow-md p-4 flex justify-between items-start">
          <Link to="/analytics" className="flex flex-col items-center gap-2 w-1/4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Map size={24} strokeWidth={1.5} />
            </div>
            <span className="text-[11px] font-medium text-[#003366] text-center leading-tight">Roadmap</span>
          </Link>
          
          <Link to="/curriculum" className="flex flex-col items-center gap-2 w-1/4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <PenTool size={24} strokeWidth={1.5} />
            </div>
            <span className="text-[11px] font-medium text-[#003366] text-center leading-tight">Exercices</span>
          </Link>
          
          <Link to="/curriculum" className="flex flex-col items-center gap-2 w-1/4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <HelpCircle size={24} strokeWidth={1.5} />
            </div>
            <span className="text-[11px] font-medium text-[#003366] text-center leading-tight">Quiz</span>
          </Link>
          
          <Link to="/scan" className="flex flex-col items-center gap-2 w-1/4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <MessageSquare size={24} strokeWidth={1.5} />
            </div>
            <span className="text-[11px] font-medium text-[#003366] text-center leading-tight">Support IA</span>
          </Link>
        </div>
      </div>

      {/* Promo Banner - Yas Style */}
      <div className="px-4 mt-6">
        <div className="bg-[#003366] rounded-2xl p-5 relative overflow-hidden flex items-center">
          <div className="relative z-10 w-2/3">
            <h3 className="text-[#FFCC00] font-black text-xl leading-tight mb-2 italic">
              Profitez non-stop<br/>de l'IA !
            </h3>
            <p className="text-white/90 text-xs mb-3 leading-snug">
              Scannez vos cours pour générer des résumés et des exercices sur mesure.
            </p>
            <Link to="/scan" className="inline-block bg-[#FFCC00] text-[#003366] text-xs font-bold px-3 py-1.5 rounded-lg">
              Scanner un cours
            </Link>
          </div>
          <div className="absolute right-[-20px] bottom-[-20px] opacity-30">
            <Camera size={140} color="#FFCC00" />
          </div>
        </div>
        {/* Banner Pagination Dots */}
        <div className="flex justify-center gap-1.5 mt-3">
          <div className="w-6 h-1.5 bg-[#FFCC00] rounded-full"></div>
          <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
          <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
        </div>
      </div>

      {/* Personalized for you - Yas Style */}
      <div className="px-4 mt-6">
        <h3 className="text-lg font-bold text-[#003366] mb-4">Personnalisé pour vous</h3>
        
        <div className="flex overflow-x-auto pb-4 gap-4 hide-scrollbar">
          {subjects.map(subject => (
            <Link 
              to="/curriculum" 
              key={subject.id}
              className="flex flex-col items-center gap-2 min-w-[72px]"
            >
              <div className={`w-16 h-16 rounded-full ${subject.color} text-white flex items-center justify-center shadow-md`}>
                {getIcon(subject.icon)}
              </div>
              <span className="text-xs font-medium text-[#003366] text-center line-clamp-2 leading-tight">
                {subject.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats Cards (Original) */}
      <div className="px-4 mt-2 grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={16} className="text-blue-600" />
            <h3 className="text-xs font-semibold text-gray-500 uppercase">Jours restants</h3>
          </div>
          <p className="text-2xl font-bold text-[#003366]">{daysRemaining}</p>
        </div>
        
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={16} className="text-green-600" />
            <h3 className="text-xs font-semibold text-gray-500 uppercase">Progression</h3>
          </div>
          <p className="text-2xl font-bold text-[#003366]">{progress}%</p>
        </div>
      </div>
    </div>
  );
}
