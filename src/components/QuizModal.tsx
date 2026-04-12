import { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { X, CheckCircle2, XCircle, Loader2, BrainCircuit } from 'lucide-react';
import { cn } from '../lib/utils';

interface QuizModalProps {
  chapter: { subjectId: string, subjectName: string, chapterId: string, title: string };
  onClose: () => void;
  onSuccess: () => void;
}

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export default function QuizModal({ chapter, onClose, onSuccess }: QuizModalProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    generateQuiz();
  }, [chapter]);

  const generateQuiz = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `
        Tu es un professeur expert du programme de Première D au Togo.
        Génère un QCM de 5 questions pour évaluer la maîtrise de l'élève sur le chapitre suivant :
        Matière : ${chapter.subjectName}
        Chapitre : ${chapter.title}
        
        Les questions doivent être de niveau Première D, précises et sans ambiguïté.
        
        Réponds UNIQUEMENT avec un objet JSON valide ayant la structure suivante :
        {
          "questions": [
            {
              "question": "Texte de la question",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correctIndex": 0, // Index de la bonne réponse (0 à 3)
              "explanation": "Explication courte de la bonne réponse"
            }
          ]
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const text = response.text;
      if (!text) throw new Error("Réponse vide de l'IA");
      
      const data = JSON.parse(text);
      if (!data.questions || data.questions.length !== 5) {
        throw new Error("Format de réponse invalide");
      }
      
      setQuestions(data.questions);
    } catch (err) {
      console.error(err);
      setError("Impossible de générer le quiz. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (optionIndex: number) => {
    if (showResults) return;
    setSelectedAnswers(prev => ({ ...prev, [currentQuestionIndex]: optionIndex }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, i) => {
      if (selectedAnswers[i] === q.correctIndex) score++;
    });
    return score;
  };

  const renderQuizContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600 font-medium">L'IA génère ton QCM sur mesure...</p>
          <p className="text-sm text-gray-400 mt-2 text-center">Chapitre : {chapter.title}</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle size={32} />
          </div>
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button onClick={generateQuiz} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
            Réessayer
          </button>
        </div>
      );
    }

    if (showResults) {
      const score = calculateScore();
      const passed = score >= 4;

      return (
        <div className="text-center py-6">
          <div className={cn(
            "w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6",
            passed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
          )}>
            {passed ? <CheckCircle2 size={48} /> : <XCircle size={48} />}
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Score : {score}/5</h2>
          
          {passed ? (
            <div className="space-y-6">
              <p className="text-green-600 font-medium text-lg">Félicitations ! Tu maîtrises ce chapitre.</p>
              <button 
                onClick={onSuccess}
                className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
              >
                Valider le chapitre
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-red-600 font-medium text-lg">Il te faut au moins 4/5 pour valider.</p>
              <p className="text-gray-600">Révise encore un peu et retente ta chance !</p>
              <button 
                onClick={onClose}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                Fermer
              </button>
            </div>
          )}
        </div>
      );
    }

    const currentQ = questions[currentQuestionIndex];
    const hasAnswered = selectedAnswers[currentQuestionIndex] !== undefined;

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            Question {currentQuestionIndex + 1}/5
          </span>
          <div className="flex gap-1">
            {questions.map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "w-8 h-2 rounded-full",
                  i === currentQuestionIndex ? "bg-blue-600" : 
                  i < currentQuestionIndex ? "bg-blue-200" : "bg-gray-100"
                )}
              />
            ))}
          </div>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-6 leading-relaxed">
          {currentQ.question}
        </h3>

        <div className="space-y-3 mb-8">
          {currentQ.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectOption(idx)}
              className={cn(
                "w-full text-left p-4 rounded-xl border-2 transition-all",
                selectedAnswers[currentQuestionIndex] === idx 
                  ? "border-blue-600 bg-blue-50 text-blue-900 font-medium" 
                  : "border-gray-100 hover:border-blue-200 hover:bg-gray-50 text-gray-700"
              )}
            >
              {option}
            </button>
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={!hasAnswered}
          className={cn(
            "w-full py-4 rounded-xl font-bold text-lg transition-all",
            hasAnswered 
              ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200" 
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          )}
        >
          {currentQuestionIndex === questions.length - 1 ? "Voir les résultats" : "Question suivante"}
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-gray-500">
            <BrainCircuit size={20} />
            <span className="font-medium text-sm">Validation IA</span>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 md:p-8 overflow-y-auto">
          {renderQuizContent()}
        </div>
      </div>
    </div>
  );
}
