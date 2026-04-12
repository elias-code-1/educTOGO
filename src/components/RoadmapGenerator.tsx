import { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { CURRICULUM } from '../data/curriculum';
import { Loader2, Sparkles, Calendar, Target, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface RoadmapPlan {
  date: string;
  tasks: string[];
}

export default function RoadmapGenerator() {
  const { user } = useAuth();
  const [targetGrade, setTargetGrade] = useState<number>(15);
  const [availability, setAvailability] = useState<string>('Lundi au Vendredi: 2h le soir\nSamedi: 4h\nDimanche: Repos');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<RoadmapPlan[] | null>(null);

  useEffect(() => {
    if (!user) return;
    
    const loadExistingRoadmap = async () => {
      try {
        const docRef = doc(db, 'users', user.uid, 'roadmaps', 'current');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTargetGrade(data.targetGrade);
          setAvailability(data.availability);
          setPlan(JSON.parse(data.plan));
        }
      } catch (err) {
        console.error("Failed to load roadmap", err);
      }
    };
    
    loadExistingRoadmap();
  }, [user]);

  const generateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const curriculumStr = CURRICULUM.map(sub => `${sub.name} (Coef ${sub.coefficient}): ${sub.chapters.length} chapitres`).join('\n');
      
      const prompt = `
        Tu es un coach d'étude expert pour le Baccalauréat Première D au Togo.
        L'examen est le 18 Mai 2026. Nous sommes le 12 Avril 2026.
        
        L'élève vise une moyenne de ${targetGrade}/20.
        Voici ses disponibilités hebdomadaires :
        ${availability}
        
        Voici le résumé du programme :
        ${curriculumStr}
        
        Génère un planning d'étude jour par jour du 12 Avril 2026 au 18 Mai 2026.
        Concentre-toi sur les matières à fort coefficient (Maths, PC, SVT) mais n'oublie pas les autres.
        
        Réponds UNIQUEMENT avec un objet JSON valide ayant la structure suivante :
        {
          "plan": [
            {
              "date": "2026-04-12",
              "tasks": ["Réviser Maths: Équations du second degré", "Faire 2 exercices de PC"]
            }
          ]
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const text = response.text;
      if (!text) throw new Error("Réponse vide de l'IA");
      
      const data = JSON.parse(text);
      if (!data.plan || !Array.isArray(data.plan)) {
        throw new Error("Format de réponse invalide");
      }
      
      setPlan(data.plan);
      
      // Save to Firestore
      const docRef = doc(db, 'users', user.uid, 'roadmaps', 'current');
      await setDoc(docRef, {
        targetGrade,
        availability,
        plan: JSON.stringify(data.plan),
        generatedAt: serverTimestamp(),
        uid: user.uid
      });
      
    } catch (err) {
      console.error(err);
      setError("Impossible de générer la roadmap. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 md:p-8 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-900">Roadmap Intelligente (IA)</h2>
        </div>
        <p className="text-gray-600">Génère un planning de révision sur mesure jusqu'au Bac (18 Mai).</p>
      </div>
      
      <div className="p-6 md:p-8">
        <form onSubmit={generateRoadmap} className="space-y-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Target size={16} /> Moyenne visée (/20)
              </label>
              <input 
                type="number" 
                min="10" max="20" step="0.5"
                value={targetGrade}
                onChange={(e) => setTargetGrade(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none"
                required
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Clock size={16} /> Disponibilités hebdomadaires
              </label>
              <textarea 
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none h-24 resize-none"
                placeholder="Ex: Lundi 2h, Mardi 1h..."
                required
              />
            </div>
          </div>
          
          {error && <p className="text-red-600 text-sm">{error}</p>}
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
            {loading ? "Génération en cours (cela peut prendre 10-20s)..." : "Générer ma Roadmap"}
          </button>
        </form>

        {plan && (
          <div className="space-y-6 mt-8">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="text-indigo-600" /> Ton planning jusqu'au Bac
            </h3>
            <div className="relative border-l-2 border-indigo-100 ml-3 space-y-8 pb-4">
              {plan.map((day, idx) => {
                const dateObj = parseISO(day.date);
                const isToday = day.date === '2026-04-12'; // Mock today
                
                return (
                  <div key={idx} className="relative pl-6">
                    <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white ${isToday ? 'bg-indigo-600' : 'bg-indigo-300'}`}></div>
                    <h4 className={`font-bold ${isToday ? 'text-indigo-600' : 'text-gray-900'}`}>
                      {format(dateObj, 'EEEE d MMMM', { locale: fr })}
                      {isToday && <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Aujourd'hui</span>}
                    </h4>
                    <ul className="mt-2 space-y-2">
                      {day.tasks.map((task, tIdx) => (
                        <li key={tIdx} className="text-gray-600 bg-gray-50 p-3 rounded-lg text-sm border border-gray-100">
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
