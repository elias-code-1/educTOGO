import { useState, useEffect } from 'react';
import { generateRoadmap } from '../lib/gemini';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { Loader2, Sparkles, Calendar, Target, Clock, AlertCircle, Repeat, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { exportToPdf } from '../lib/exportPdf';

export default function RoadmapGenerator() {
  const { user } = useAuth();
  const [weakSubjects, setWeakSubjects] = useState<string>('Mathématiques, Physique-Chimie');
  const [availableWeeks, setAvailableWeeks] = useState<number>(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planText, setPlanText] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleRegenerate = async () => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'roadmaps', 'current_text'));
      setPlanText(null);
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportPdf = async () => {
    if (!planText) return;
    setIsExporting(true);
    await exportToPdf(planText, "roadmap-revision");
    setIsExporting(false);
  };

  useEffect(() => {
    if (!user) return;
    
    const loadExistingRoadmap = async () => {
      try {
        const docRef = doc(db, 'users', user.uid, 'roadmaps', 'current_text');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPlanText(data.plan);
        }
      } catch (err) {
        console.error("Failed to load roadmap", err);
      }
    };
    
    loadExistingRoadmap();
  }, [user]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const subjectsArray = weakSubjects.split(',').map(s => s.trim());
      const response = await generateRoadmap(subjectsArray, availableWeeks, user.uid);
      
      if (response.includes("⏳")) {
        setError(response);
        return;
      }
      
      setPlanText(response);
      
      // Save to Firestore
      const docRef = doc(db, 'users', user.uid, 'roadmaps', 'current_text');
      await setDoc(docRef, {
        targetGrade: 20, // Compatible field
        availability: weakSubjects, // Compatible field
        plan: response,
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

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 md:p-8 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-900">Roadmap Intelligente (IA)</h2>
        </div>
        <p className="text-gray-600">Génère un planning de révision sur mesure pour tes matières faibles.</p>
      </div>
      
      <div className="p-6 md:p-8">
        {!planText ? (
          <form onSubmit={handleGenerate} className="space-y-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Target size={16} /> Matières à renforcer (séparées par des virgules)
                </label>
                <input 
                  type="text" 
                  value={weakSubjects}
                  onChange={(e) => setWeakSubjects(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none"
                  placeholder="Ex: Maths, PC, SVT"
                  required
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Clock size={16} /> Nombre de semaines
                </label>
                <input 
                  type="number" 
                  min="1" max="12"
                  value={availableWeeks}
                  onChange={(e) => setAvailableWeeks(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none"
                  required
                />
              </div>
            </div>
            
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
              {loading ? "Génération en cours..." : "Générer ma Roadmap"}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="text-indigo-600" /> Ton planning de révision
              </h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="text-xs text-indigo-600 border border-indigo-600 px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-indigo-50 transition-colors"
                >
                  <Repeat size={14} /> Regénérer
                </button>
                <button 
                  onClick={handleExportPdf}
                  disabled={isExporting}
                  className="text-xs text-white bg-indigo-600 px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isExporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download size={14} />} 
                  {isExporting ? '...' : 'PDF'}
                </button>
              </div>
            </div>

            {isModalOpen && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 max-w-sm w-full">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Es-tu sûr ?</h3>
                  <p className="text-sm text-gray-600 mb-6">Ta roadmap actuelle sera remplacée.</p>
                  <div className="flex gap-3">
                    <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200">Annuler</button>
                    <button onClick={handleRegenerate} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white">Confirmer</button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 prose prose-indigo max-w-none">
              <ReactMarkdown>{planText}</ReactMarkdown>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
