import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, X, Loader2, AlertCircle, CheckCircle2, History } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { generateSummary, generateQuiz } from '../lib/gemini';
import { Link } from 'react-router-dom';
import QuotaBar from '../components/QuotaBar';
import { isQuotaExhausted, incrementRPD } from '../lib/quotaManager';

const MAX_IMAGES_PER_SCAN = 5;

async function compressImage(base64: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_SIZE = 1024;
      let width = img.width;
      let height = img.height;
      
      if (width > height && width > MAX_SIZE) {
        height = (height * MAX_SIZE) / width;
        width = MAX_SIZE;
      } else if (height > MAX_SIZE) {
        width = (width * MAX_SIZE) / height;
        height = MAX_SIZE;
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL('image/jpeg', 0.7);
      resolve(compressed.split('base64,')[1]);
    };
    img.src = base64.startsWith('data:') 
      ? base64 
      : 'data:image/jpeg;base64,' + base64;
  });
}

export default function Scan() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [images, setImages] = useState<string[]>([]);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (images.length + files.length > MAX_IMAGES_PER_SCAN) {
      setError(`Vous ne pouvez sélectionner que ${MAX_IMAGES_PER_SCAN} photos maximum.`);
      return;
    }

    setError(null);

    // Convert files to base64
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleScan = async () => {
    if (!user) return;
    if (images.length === 0) {
      setError("Veuillez ajouter au moins une photo de votre cours.");
      return;
    }

    if (await isQuotaExhausted(user.uid)) {
      setError("🔴 Quota IA épuisé. Renouvellement à 1h du matin.");
      return;
    }

    setLoadingMessage("📸 Analyse de l'image...");
    setError(null);

    let finalSummary = "";
    let reflectionResponse = "Résumé généré par l'IA.";
    let finalExercises: any[] = [];

    try {
      // 1. Call Gemini to generate the summary
      const compressedImage = await compressImage(images[0]);
      const summary = await generateSummary(compressedImage, "image_base64");

      if (summary.includes("⏳")) {
        setError(summary);
        setLoadingMessage(null);
        return;
      }
      
      await incrementRPD(user.uid, 1);
      finalSummary = summary;

      // 2. Generate interactive prompt (reflection)
      if (!await isQuotaExhausted(user.uid)) {
        setLoadingMessage("💭 Génération de la réflexion...");
        reflectionResponse = await generateSummary(
          `À partir de ce résumé de cours, génère UNE seule question de réflexion profonde et stimulante pour un élève de Première D. La question doit pousser à la réflexion personnelle, pas juste réciter le cours. Réponds UNIQUEMENT avec la question, rien d'autre.\n\n Résumé : ${summary}`,
          "text"
        );
        await incrementRPD(user.uid, 1);
      }

      // 3. Generate exercises
      if (!await isQuotaExhausted(user.uid)) {
        setLoadingMessage("📝 Création des exercices...");
        const quizQuestions = await generateQuiz(
          "Cours scanné",
          summary.substring(0, 200),
          "moyen"
        );
        
        finalExercises = quizQuestions.map(q => ({
          question: q.question,
          options: q.options,
          answer: q.options[q.correctIndex],
          explanation: q.explanation
        }));
        await incrementRPD(user.uid, 1);
      }

      setLoadingMessage("💾 Sauvegarde...");

      // 4. Save to Firestore
      if (finalSummary.length > 800000) {
        finalSummary = finalSummary.substring(0, 800000) + "\n\n[Résumé tronqué car trop long pour être sauvegardé]";
      }

      const scanRef = await addDoc(collection(db, 'users', user.uid, 'scans'), {
        createdAt: serverTimestamp(),
        summary: finalSummary,
        interactivePrompt: reflectionResponse,
        exercises: finalExercises,
        imageCount: images.length
      });

      // Navigate to result page
      navigate(`/study-pack/${scanRef.id}`);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Une erreur est survenue lors de l'analyse.");
    } finally {
      setLoadingMessage(null);
    }
  };

  return (
    <div className="pb-8">
      {user && <QuotaBar uid={user.uid} />}
      <header className="bg-[#003366] text-white px-4 pt-6 pb-8 rounded-b-[40px] shadow-sm mb-6 relative">
        <Link to="/scan-history" className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20">
          <History size={20} />
        </Link>
        <h1 className="text-2xl font-bold mb-2">Scanner un cours</h1>
        <p className="text-white/80 text-sm">
          Prenez en photo votre cours, l'IA génère un résumé et des exercices.
        </p>
      </header>

      <div className="px-4 space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-start gap-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* Image Preview Grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {images.map((img, idx) => (
              <div key={idx} className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-sm border border-gray-200">
                <img src={img} alt={`Scan ${idx + 1}`} className="w-full h-full object-cover" />
                <button 
                  onClick={() => removeImage(idx)}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/50 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-black/70"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            
            {images.length < MAX_IMAGES_PER_SCAN && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-[3/4] rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-[#003366] hover:text-[#003366] transition-colors"
              >
                <Upload size={24} className="mb-2" />
                <span className="text-xs font-medium text-center px-2">Ajouter une page</span>
              </button>
            )}
          </div>
        )}

        {/* Empty State / Upload Buttons */}
        {images.length === 0 && (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-[#003366]">
              <Camera size={40} strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Prenez votre cours en photo</h3>
            <p className="text-sm text-gray-500 mb-6">
              Assurez-vous que le texte soit bien lisible. Vous pouvez ajouter jusqu'à {MAX_IMAGES_PER_SCAN} pages.
            </p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3.5 bg-[#003366] text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#002244] transition-colors"
              >
                <Camera size={20} />
                Ouvrir l'appareil photo
              </button>
            </div>
          </div>
        )}

        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          multiple 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
        />

        {/* Action Button */}
        {images.length > 0 && (
          <button
            onClick={handleScan}
            disabled={loadingMessage !== null}
            className="w-full py-4 bg-[#FFCC00] text-[#003366] rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMessage !== null ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                {loadingMessage}
              </>
            ) : (
              <>
                <CheckCircle2 className="w-6 h-6" />
                Générer le Pack d'Étude
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
