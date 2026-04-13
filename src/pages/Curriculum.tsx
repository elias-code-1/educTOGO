import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, BrainCircuit, Calculator, Atom, Leaf, Languages, Globe, BookOpen, Scale, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import QuizModal from '../components/QuizModal';

export default function Curriculum() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [chapters, setChapters] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  
  const [quizChapter, setQuizChapter] = useState<{subjectId: string, subjectName: string, chapterId: string, title: string} | null>(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(collection(db, 'users', user.uid, 'subjects'), (snapshot) => {
      const subs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubjects(subs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const loadChapters = async (subjectId: string) => {
    if (!user) return;
    
    if (expandedSubject === subjectId) {
      setExpandedSubject(null);
      return;
    }

    setExpandedSubject(subjectId);
    
    if (!chapters[subjectId]) {
      try {
        const chaptersRef = collection(db, 'users', user.uid, 'subjects', subjectId, 'chapters');
        const snapshot = await getDocs(chaptersRef);
        const chaps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Sort chapters by ID (chap_0, chap_1, etc.)
        chaps.sort((a, b) => {
          const numA = parseInt(a.id.split('_')[1]);
          const numB = parseInt(b.id.split('_')[1]);
          return numA - numB;
        });
        
        setChapters(prev => ({ ...prev, [subjectId]: chaps }));
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}/subjects/${subjectId}/chapters`);
      }
    }
  };

  const handleQuizSuccess = async (subjectId: string, chapterId: string) => {
    if (!user) return;
    try {
      const chapterRef = doc(db, 'users', user.uid, 'subjects', subjectId, 'chapters', chapterId);
      await updateDoc(chapterRef, { 
        status: 'mastered',
        masteredAt: serverTimestamp()
      });
      
      // Update subject completed count
      const subject = subjects.find(s => s.id === subjectId);
      if (subject) {
        const subjectRef = doc(db, 'users', user.uid, 'subjects', subjectId);
        await updateDoc(subjectRef, {
          completedChapters: subject.completedChapters + 1
        });
      }

      // Update local state for immediate feedback
      setChapters(prev => ({
        ...prev,
        [subjectId]: prev[subjectId].map(c => 
          c.id === chapterId ? { ...c, status: 'mastered' } : c
        )
      }));
      
      setQuizChapter(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/subjects/${subjectId}/chapters/${chapterId}`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <header>
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-48 bg-gray-100 rounded animate-pulse"></div>
        </header>
        <div className="animate-pulse space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-2xl"></div>)}
        </div>
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6">
          <BookOpen size={40} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucun programme trouvé</h2>
        <p className="text-gray-500 mb-8 max-w-xs">
          Il semble que votre programme n'ait pas encore été initialisé. Cliquez sur le bouton ci-dessous pour commencer.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-6 py-3 bg-[#003366] text-white rounded-xl font-bold shadow-lg hover:bg-[#002244] transition-all"
        >
          <RefreshCw size={20} />
          Initialiser mon programme
        </button>
        
        <div className="mt-8 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3 text-left">
          <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-amber-800">
            Si le problème persiste, vérifiez votre connexion internet ou essayez de vous déconnecter et de vous reconnecter.
          </p>
        </div>
      </div>
    );
  }

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Calculator': return <Calculator size={24} />;
      case 'Atom': return <Atom size={24} />;
      case 'Leaf': return <Leaf size={24} />;
      case 'Languages': return <Languages size={24} />;
      case 'Globe': return <Globe size={24} />;
      case 'BookOpen': return <BookOpen size={24} />;
      case 'Scale': return <Scale size={24} />;
      default: return <BookOpen size={24} />;
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Programme Officiel</h1>
        <p className="text-gray-500 mt-1">Valide tes connaissances chapitre par chapitre.</p>
      </header>

      <div className="space-y-4">
        {subjects.map(subject => {
          const isExpanded = expandedSubject === subject.id;
          const progress = subject.totalChapters > 0 ? Math.round((subject.completedChapters / subject.totalChapters) * 100) : 0;
          const estimatedSubjectGrade = subject.totalChapters > 0 ? ((subject.completedChapters / subject.totalChapters) * 20).toFixed(1) : "0.0";
          
          return (
            <div key={subject.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div 
                className="p-4 md:p-6 cursor-pointer hover:bg-gray-50 transition-colors flex flex-col md:flex-row md:items-center gap-4"
                onClick={() => loadChapters(subject.id)}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className={cn("w-12 h-12 rounded-xl text-white flex items-center justify-center shadow-inner", subject.color)}>
                    {getIcon(subject.icon)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{subject.name}</h3>
                    <p className="text-sm text-gray-500">Coef. {subject.coefficient} • {subject.completedChapters}/{subject.totalChapters} chapitres</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="w-32 hidden md:block">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-gray-700">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className={cn("h-2 rounded-full", subject.color)} style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <span className="text-sm text-gray-500">Note estimée:</span>
                    <div className="w-16 p-1 bg-gray-50 border border-gray-200 rounded text-center font-semibold text-blue-600">
                      {estimatedSubjectGrade}
                    </div>
                    <span className="text-gray-500">/20</span>
                  </div>
                  
                  <button className="text-gray-400 hover:text-gray-600">
                    {isExpanded ? <ChevronUp /> : <ChevronDown />}
                  </button>
                </div>
              </div>

              {isExpanded && chapters[subject.id] && (
                <div className="border-t border-gray-100 bg-gray-50 p-4 md:p-6">
                  <div className="space-y-3">
                    {chapters[subject.id].map((chapter) => {
                      const isMastered = chapter.status === 'mastered';
                      return (
                        <div key={chapter.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                          <div className="flex items-center gap-3">
                            {isMastered ? (
                              <CheckCircle2 className="text-green-500" size={24} />
                            ) : (
                              <Circle className="text-gray-300" size={24} />
                            )}
                            <span className={cn("font-medium", isMastered ? "text-gray-900" : "text-gray-600")}>
                              {chapter.title}
                            </span>
                          </div>
                          
                          {!isMastered && (
                            <button 
                              onClick={() => setQuizChapter({
                                subjectId: subject.id,
                                subjectName: subject.name,
                                chapterId: chapter.id,
                                title: chapter.title
                              })}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 font-medium rounded-lg hover:bg-blue-100 transition-colors text-sm"
                            >
                              <BrainCircuit size={16} />
                              Valider (IA)
                            </button>
                          )}
                          {isMastered && (
                            <span className="text-xs font-medium px-3 py-1 bg-green-100 text-green-700 rounded-full">
                              Maîtrisé
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {quizChapter && (
        <QuizModal 
          chapter={quizChapter} 
          onClose={() => setQuizChapter(null)} 
          onSuccess={() => handleQuizSuccess(quizChapter.subjectId, quizChapter.chapterId)}
        />
      )}
    </div>
  );
}
