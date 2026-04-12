import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { generateStudyPackFromImages } from '../lib/gemini';

const MAX_SCANS_PER_DAY = 5;
const MAX_IMAGES_PER_SCAN = 5;

export default function Scan() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scansRemaining, setScansRemaining] = useState<number | null>(null);
  const [checkingQuota, setCheckingQuota] = useState(true);

  // Check quota on mount
  useEffect(() => {
    async function checkQuota() {
      if (!user) return;
      
      try {
        const today = new Date().toISOString().split('T')[0];
        const quotaRef = doc(db, 'users', user.uid, 'quotas', today);
        const quotaDoc = await getDoc(quotaRef);
        
        if (quotaDoc.exists()) {
          const used = quotaDoc.data().scansUsed || 0;
          setScansRemaining(Math.max(0, MAX_SCANS_PER_DAY - used));
        } else {
          setScansRemaining(MAX_SCANS_PER_DAY);
        }
      } catch (err) {
        console.error("Erreur vérification quota:", err);
      } finally {
        setCheckingQuota(false);
      }
    }
    
    checkQuota();
  }, [user]);

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
    if (scansRemaining !== null && scansRemaining <= 0) {
      setError("Vous avez atteint votre limite de scans pour aujourd'hui. Revenez demain !");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Call Gemini to generate the study pack
      const studyPack = await generateStudyPackFromImages(images);

      // 2. Save to Firestore
      const scanRef = await addDoc(collection(db, 'users', user.uid, 'scans'), {
        createdAt: serverTimestamp(),
        summary: studyPack.summary,
        interactivePrompt: studyPack.interactivePrompt,
        exercises: studyPack.exercises,
        imageCount: images.length
      });

      // 3. Update Quota
      const today = new Date().toISOString().split('T')[0];
      const quotaRef = doc(db, 'users', user.uid, 'quotas', today);
      const quotaDoc = await getDoc(quotaRef);
      
      if (quotaDoc.exists()) {
        await updateDoc(quotaRef, { scansUsed: increment(1) });
      } else {
        await setDoc(quotaRef, { scansUsed: 1, date: today });
      }

      // 4. Navigate to result page
      navigate(`/study-pack/${scanRef.id}`);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Une erreur est survenue lors de l'analyse.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingQuota) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-[#003366]" /></div>;
  }

  return (
    <div className="pb-8">
      <header className="bg-[#003366] text-white px-4 pt-6 pb-8 rounded-b-[40px] shadow-sm mb-6">
        <h1 className="text-2xl font-bold mb-2">Scanner un cours</h1>
        <p className="text-white/80 text-sm">
          Prenez en photo votre cours, l'IA génère un résumé et des exercices.
        </p>
        
        <div className="mt-4 flex items-center gap-2 bg-white/10 p-3 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-[#FFCC00] flex items-center justify-center text-[#003366] font-bold">
            {scansRemaining}
          </div>
          <div>
            <p className="text-sm font-medium">Scans restants aujourd'hui</p>
            <p className="text-xs text-white/60">Renouvellement à minuit</p>
          </div>
        </div>
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
            disabled={loading || scansRemaining === 0}
            className="w-full py-4 bg-[#FFCC00] text-[#003366] rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Analyse en cours (max 1 min)...
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
