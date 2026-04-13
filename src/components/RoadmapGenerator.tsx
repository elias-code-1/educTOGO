import { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { CURRICULUM } from '../data/curriculum';
import { Loader2, Sparkles, Calendar, Target, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface RoadmapTask {
  title: string;
  completed: boolean;
}

interface RoadmapPlan {
  date: string;
  tasks: RoadmapTask[];
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
          
          // Normalize plan to handle old string tasks
          const parsedPlan = JSON.parse(data.plan);
          const normalizedPlan = parsedPlan.map((day: any) => ({
            ...day,
            tasks: day.tasks.map((t: any) => typeof t === 'string' ? { title: t, completed: false } : t)
          }));
          
          setPlan(normalizedPlan);
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
      
      const todayDate = new Date();
      const todayStr = format(todayDate, 'yyyy-MM-dd');
      const examDateStr = '2026-05-18';
      
      const prompt = `
        Tu es un coach d'étude expert pour le Baccalauréat Première D au Togo.
        L'examen est le ${examDateStr}. Aujourd'hui nous sommes le ${todayStr}.
        
        L'élève vise une moyenne de ${targetGrade}/20.
        Voici ses disponibilités hebdomadaires :
        ${availability}
        
        Voici le résumé du programme :
        ${curriculumStr}
        
        Génère un planning d'étude jour par jour du ${todayStr} au ${examDateStr} inclus.
        Concentre-toi sur les matières à fort coefficient (Maths, PC, SVT) mais n'oublie pas les autres.
        
        Réponds UNIQUEMENT avec un objet JSON valide ayant la structure suivante :
        {
          "plan": [
            {
              "date": "YYYY-MM-DD",
              "tasks": ["Réviser Maths: Équations du second degré", "Faire 2 exercices de PC"]
            }
          ]
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              plan: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    date: { type: Type.STRING },
                    tasks: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    }
                  },
                  required: ["date", "tasks"]
                }
              }
            },
            required: ["plan"]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("Réponse vide de l'IA");
      
      const data = JSON.parse(text);
      if (!data.plan || !Array.isArray(data.plan)) {
        throw new Error("Format de réponse invalide");
      }
      
      const mappedPlan: RoadmapPlan[] = data.plan.map((day: any) => ({
        date: day.date,
        tasks: day.tasks.map((t: string) => ({ title: t, completed: false }))
      }));
      
      setPlan(mappedPlan);
      
      // Save to Firestore
      const docRef = doc(db, 'users', user.uid, 'roadmaps', 'current');
      await setDoc(docRef, {
        targetGrade,
        availability,
        plan: JSON.stringify(mappedPlan),
        generatedAt: serverTimestamp(),
        uid: user.uid
      });
      
    } catch (err) {
      console.error("Roadmap Generation Error:", err);
      setError("Impossible de générer la roadmap. Vérifiez votre connexion ou réessayez plus tard.");
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (dayIndex: number, taskIndex: number) => {
    if (!plan || !user) return;
    
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    if (plan[dayIndex].date !== todayStr) return; // Only allow checking today's tasks
    
    const newPlan = [...plan];
    const task = newPlan[dayIndex].tasks[taskIndex];
    task.completed = !task.completed;
    setPlan(newPlan);
    
    try {
      const docRef = doc(db, 'users', user.uid, 'roadmaps', 'current');
      await updateDoc(docRef, {
        plan: JSON.stringify(newPlan)
      });
      
      // If task is completed, log a session to update analytics
      if (task.completed) {
        const sessionsRef = collection(db, 'users', user.uid, 'sessions');
        await addDoc(sessionsRef, {
          subjectId: 'roadmap',
          subjectName: 'Roadmap',
          durationMinutes: 30, // Estimate 30 mins per task
          date: serverTimestamp(),
          notes: task.title
        });
      }
    } catch (err) {
      console.error("Failed to update task", err);
      // Revert on failure
      task.completed = !task.completed;
      setPlan([...newPlan]);
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
        {!plan ? (
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
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="text-indigo-600" /> Ton planning jusqu'au Bac
              </h3>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Généré par l'IA</span>
            </div>
            
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3 mb-6">
              <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-blue-800">
                Tu ne peux valider que les tâches du jour. Les tâches non validées avant minuit seront considérées comme manquées.
              </p>
            </div>

            <div className="relative border-l-2 border-indigo-100 ml-3 space-y-8 pb-4">
              {plan.map((day, idx) => {
                const dateObj = parseISO(day.date);
                const todayStr = format(new Date(), 'yyyy-MM-dd');
                const isToday = day.date === todayStr;
                const isPast = day.date < todayStr;
                const isFuture = day.date > todayStr;
                
                return (
                  <div key={idx} className={`relative pl-6 ${isPast ? 'opacity-75' : ''}`}>
                    <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white ${isToday ? 'bg-indigo-600' : isPast ? 'bg-gray-400' : 'bg-indigo-300'}`}></div>
                    <h4 className={`font-bold ${isToday ? 'text-indigo-600' : isPast ? 'text-gray-500' : 'text-gray-900'}`}>
                      {format(dateObj, 'EEEE d MMMM', { locale: fr })}
                      {isToday && <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Aujourd'hui</span>}
                    </h4>
                    <ul className="mt-3 space-y-2">
                      {day.tasks.map((task, tIdx) => {
                        const disabled = !isToday;
                        const missed = isPast && !task.completed;
                        
                        return (
                          <li key={tIdx} className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${task.completed ? 'bg-green-50 border-green-100' : missed ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                            <input 
                              type="checkbox" 
                              checked={task.completed} 
                              disabled={disabled}
                              onChange={() => toggleTask(idx, tIdx)}
                              className="mt-0.5 w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-600 disabled:opacity-50 cursor-pointer"
                            />
                            <div className="flex-1">
                              <span className={`block text-sm ${task.completed ? 'line-through text-gray-400' : missed ? 'text-red-700' : 'text-gray-700'}`}>
                                {task.title}
                              </span>
                              {missed && <span className="text-xs text-red-500 font-medium mt-1 block">Tâche manquée</span>}
                              {task.completed && <span className="text-xs text-green-600 font-medium mt-1 block">Validée ! (+30 min)</span>}
                            </div>
                          </li>
                        )
                      })}
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
