import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowLeft, BookOpen, BrainCircuit, CheckCircle2, ChevronRight, MessageSquare, PlayCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function StudyPack() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [pack, setPack] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'interactive' | 'exercises'>('summary');
  const [currentExercise, setCurrentExercise] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    async function fetchPack() {
      if (!user || !id) return;
      try {
        const docRef = doc(db, 'users', user.uid, 'scans', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPack(docSnap.data());
        } else {
          console.error("Pack introuvable");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchPack();
  }, [user, id]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500 animate-pulse">Chargement du pack d'étude...</div>;
  }

  if (!pack) {
    return <div className="p-8 text-center text-red-500">Pack d'étude introuvable.</div>;
  }

  return (
    <div className="pb-8 min-h-screen bg-[#F4F6F8]">
      {/* Header */}
      <header className="bg-white px-4 py-4 flex items-center gap-3 sticky top-0 z-20 shadow-sm">
        <button onClick={() => navigate('/')} className="p-2 bg-gray-100 rounded-full text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-[#003366] text-lg">Pack d'Étude</h1>
      </header>

      {/* Tabs */}
      <div className="flex p-4 gap-2 overflow-x-auto hide-scrollbar bg-white shadow-sm mb-4">
        <button 
          onClick={() => setActiveTab('summary')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'summary' ? 'bg-[#003366] text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          <BookOpen size={16} /> Résumé
        </button>
        <button 
          onClick={() => setActiveTab('interactive')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'interactive' ? 'bg-[#003366] text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          <BrainCircuit size={16} /> Apprentissage Actif
        </button>
        <button 
          onClick={() => setActiveTab('exercises')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'exercises' ? 'bg-[#003366] text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          <CheckCircle2 size={16} /> Exercices ({pack.exercises?.length || 0})
        </button>
      </div>

      <div className="px-4">
        {/* SUMMARY TAB */}
        {activeTab === 'summary' && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-[#003366] mb-4 flex items-center gap-2">
              <BookOpen className="text-[#FFCC00]" /> L'essentiel à retenir
            </h2>
            <div className="prose prose-sm md:prose-base prose-blue max-w-none text-gray-700">
              <ReactMarkdown>{pack.summary}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* INTERACTIVE TAB */}
        {activeTab === 'interactive' && (
          <div className="bg-gradient-to-br from-[#003366] to-blue-900 rounded-3xl p-6 shadow-lg text-white">
            <div className="w-12 h-12 bg-[#FFCC00] rounded-2xl flex items-center justify-center text-[#003366] mb-4">
              <MessageSquare size={24} />
            </div>
            <h2 className="text-xl font-bold mb-2">Réflexion</h2>
            <p className="text-blue-100 text-sm mb-6">Prends un moment pour réfléchir à cette question avant de passer aux exercices.</p>
            
            <div className="bg-white/10 p-5 rounded-2xl border border-white/20 backdrop-blur-sm">
              <p className="text-lg font-medium leading-relaxed">{pack.interactivePrompt}</p>
            </div>
            
            <button 
              onClick={() => setActiveTab('exercises')}
              className="mt-8 w-full py-3.5 bg-[#FFCC00] text-[#003366] rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors"
            >
              J'ai compris, aux exercices ! <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* EXERCISES TAB */}
        {activeTab === 'exercises' && pack.exercises && pack.exercises.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-500">Exercice {currentExercise + 1} sur {pack.exercises.length}</span>
              <div className="flex gap-1">
                {pack.exercises.map((_: any, idx: number) => (
                  <div key={idx} className={`w-2 h-2 rounded-full ${idx === currentExercise ? 'bg-[#003366]' : 'bg-gray-300'}`} />
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{pack.exercises[currentExercise].question}</h3>
              
              {pack.exercises[currentExercise].options && pack.exercises[currentExercise].options.length > 0 && (
                <div className="space-y-2 mb-6">
                  {pack.exercises[currentExercise].options.map((opt: string, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 text-sm">
                      {opt}
                    </div>
                  ))}
                </div>
              )}

              {!showAnswer ? (
                <button 
                  onClick={() => setShowAnswer(true)}
                  className="w-full py-3 bg-blue-50 text-blue-600 rounded-xl font-medium border border-blue-100 hover:bg-blue-100 transition-colors"
                >
                  Voir la réponse
                </button>
              ) : (
                <div className="mt-4 animate-in fade-in slide-in-from-bottom-2">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-2xl mb-4">
                    <p className="font-bold text-green-800 mb-1">Réponse :</p>
                    <p className="text-green-700">{pack.exercises[currentExercise].answer}</p>
                  </div>
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl">
                    <p className="font-bold text-gray-700 mb-1">Explication :</p>
                    <p className="text-gray-600 text-sm">{pack.exercises[currentExercise].explanation}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => {
                  setCurrentExercise(Math.max(0, currentExercise - 1));
                  setShowAnswer(false);
                }}
                disabled={currentExercise === 0}
                className="flex-1 py-3.5 bg-white text-gray-700 border border-gray-200 rounded-xl font-medium disabled:opacity-50"
              >
                Précédent
              </button>
              <button 
                onClick={() => {
                  if (currentExercise < pack.exercises.length - 1) {
                    setCurrentExercise(currentExercise + 1);
                    setShowAnswer(false);
                  } else {
                    navigate('/');
                  }
                }}
                className="flex-1 py-3.5 bg-[#003366] text-white rounded-xl font-medium"
              >
                {currentExercise < pack.exercises.length - 1 ? 'Suivant' : 'Terminer'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
