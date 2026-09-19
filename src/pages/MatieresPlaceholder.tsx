import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { 
  BookOpen, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  GraduationCap, 
  Compass, 
  Edit3,
  Home
} from 'lucide-react';
import { motion } from 'motion/react';

interface StudentData {
  classe?: string;
  filiere?: string;
  serie?: string;
}

export default function MatieresPlaceholder() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStudent() {
      if (!user) return;
      try {
        const studentRef = doc(db, 'students', user.uid);
        const snap = await getDoc(studentRef);
        if (snap.exists()) {
          setStudent(snap.data() as StudentData);
        }
      } catch (err) {
        console.error("Erreur lors de la lecture des données de l'élève:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStudent();
  }, [user]);

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-slate-900 flex flex-col justify-between p-4 sm:p-6 md:p-8 font-sans selection:bg-[#006e2f]/20">
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center py-6">
        
        {/* Header simple avec logo eduFRY */}
        <div className="flex items-center justify-center gap-2 mb-8 select-none">
          <div className="w-8 h-8 rounded-xl bg-[#006e2f] flex items-center justify-center text-white font-black text-base shadow-sm">
            e
          </div>
          <span className="text-xl font-extrabold tracking-tight">
            edu<span className="text-[#006e2f]">FRY</span>
          </span>
        </div>

        {/* Carte principale de confirmation & route provisoire */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm"
        >
          {/* Badge statut succès */}
          <div className="w-14 h-14 rounded-2xl bg-[#eaf7ed] text-[#006e2f] flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={30} strokeWidth={2.4} />
          </div>

          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eaf7ed] border border-[#006e2f]/20 text-[#006e2f] text-[11px] font-bold tracking-tight mb-2">
              <Sparkles size={13} />
              <span>Profil académique enregistré</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Écran provisoire : Matières
            </h1>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-xs mx-auto">
              Tes informations ont bien été enregistrées dans Firestore (collection <code className="text-[#006e2f] font-bold bg-[#eaf7ed] px-1 py-0.5 rounded">students</code>).
            </p>
          </div>

          {/* Récapitulatif du choix de l'élève */}
          <div className="bg-[#f7f9fb] rounded-2xl p-4 border border-slate-200/80 mb-6 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Récapitulatif de ton parcours
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/70">
                <div className="text-[10px] font-semibold text-slate-400">Classe</div>
                <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                  {student?.classe || '...'}
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200/70">
                <div className="text-[10px] font-semibold text-slate-400">Filière</div>
                <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                  {student?.filiere || '...'}
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200/70">
                <div className="text-[10px] font-semibold text-slate-400">Série</div>
                <div className="text-sm font-extrabold text-[#006e2f] mt-0.5">
                  {student?.serie || '...'}
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/60 text-amber-900 text-xs leading-relaxed flex items-start gap-2.5 mb-6">
            <BookOpen size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <p>
              L'étape suivante d'<strong>ajout personnalisé des matières</strong> sera connectée ici dans la prochaine phase.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full py-3.5 px-6 rounded-full bg-[#006e2f] text-white font-bold text-sm tracking-wide shadow-md shadow-[#006e2f]/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-[#005725] cursor-pointer"
            >
              <Home size={16} />
              <span>Aller au tableau de bord</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/academic-setup')}
              className="w-full py-3.5 px-6 rounded-full bg-white text-slate-700 border border-slate-200 font-bold text-sm tracking-wide flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-slate-50 cursor-pointer"
            >
              <Edit3 size={15} />
              <span>Modifier ma classe ou série</span>
            </button>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
