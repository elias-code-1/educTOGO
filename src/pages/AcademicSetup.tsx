import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { 
  ArrowLeft, 
  Check, 
  ArrowRight, 
  Loader2, 
  GraduationCap, 
  Compass, 
  Layers, 
  Sparkles,
  BookOpen,
  Cpu,
  Calculator,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AcademicClasse, 
  AcademicFiliere, 
  CLASSES, 
  FILIERES, 
  getSeriesForSelection 
} from '../data/academic';

export default function AcademicSetup() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Étape courante : 1 = Classe, 2 = Filière, 3 = Série
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Sélections de l'élève
  const [selectedClasse, setSelectedClasse] = useState<AcademicClasse | null>(null);
  const [selectedFiliere, setSelectedFiliere] = useState<AcademicFiliere | null>(null);
  const [selectedSerie, setSelectedSerie] = useState<string | null>(null);

  // États d'enregistrement et d'erreur
  const [saving, setSaving] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Charger les données existantes si l'élève a déjà commencé
  useEffect(() => {
    async function loadExistingStudent() {
      if (!user) {
        setLoadingInitial(false);
        return;
      }
      try {
        const studentRef = doc(db, 'students', user.uid);
        const snap = await getDoc(studentRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.classe) setSelectedClasse(data.classe as AcademicClasse);
          if (data.filiere) setSelectedFiliere(data.filiere as AcademicFiliere);
          if (data.serie) setSelectedSerie(data.serie);
        }
      } catch (err) {
        console.warn("Impossible de précharger les données d'élève:", err);
      } finally {
        setLoadingInitial(false);
      }
    }
    loadExistingStudent();
  }, [user]);

  // Si la classe ou filière change, réinitialiser la série si elle n'est plus valide
  useEffect(() => {
    if (selectedClasse && selectedFiliere) {
      const allowedSeries = getSeriesForSelection(selectedClasse, selectedFiliere);
      if (selectedSerie && !allowedSeries.some(s => s.code === selectedSerie)) {
        setSelectedSerie(null);
      }
    }
  }, [selectedClasse, selectedFiliere]);

  // Gestion du retour
  const handleBack = () => {
    setErrorMessage(null);
    if (step === 3) {
      setStep(2);
    } else if (step === 2) {
      setStep(1);
    } else {
      // Étape 1 : retour en arrière dans l'historique ou tableau de bord
      navigate(-1);
    }
  };

  // Passage à l'étape suivante ou validation finale
  const handleNextStep1 = (classe: AcademicClasse) => {
    setSelectedClasse(classe);
    setErrorMessage(null);
    setStep(2);
  };

  const handleNextStep2 = (filiere: AcademicFiliere) => {
    setSelectedFiliere(filiere);
    setErrorMessage(null);
    setStep(3);
  };

  // Enregistrement final dans Firestore
  const handleFinalSubmit = async (serieToSave?: string) => {
    const finalSerie = serieToSave || selectedSerie;
    if (!selectedClasse || !selectedFiliere || !finalSerie) {
      setErrorMessage('Veuillez sélectionner votre série avant de continuer.');
      return;
    }

    if (!user) {
      setErrorMessage('Vous devez être connecté pour enregistrer votre parcours.');
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    const studentPath = `students/${user.uid}`;
    try {
      const studentRef = doc(db, 'students', user.uid);
      await setDoc(
        studentRef,
        {
          uid: user.uid,
          classe: selectedClasse,
          filiere: selectedFiliere,
          serie: finalSerie,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Redirection vers la route provisoire demandée : "matieres"
      navigate('/matieres');
    } catch (err) {
      console.error("Erreur lors de l'enregistrement de l'élève :", err);
      try {
        handleFirestoreError(err, OperationType.WRITE, studentPath);
      } catch (wrappedErr: any) {
        setErrorMessage(
          "Une erreur est survenue lors de l'enregistrement de votre profil académique. Veuillez réessayer."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const availableSeries = getSeriesForSelection(selectedClasse, selectedFiliere);

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#006e2f]/10 flex items-center justify-center text-[#006e2f]">
            <Loader2 className="animate-spin" size={24} />
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Chargement de votre parcours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-slate-900 flex flex-col justify-between p-4 sm:p-6 md:p-8 font-sans selection:bg-[#006e2f]/20">
      {/* Conteneur centré format mobile/tablette élégant */}
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col">
        
        {/* Header : Bouton Retour, Logo eduFRY et Indicateur de progression */}
        <header className="flex items-center justify-between pt-2 pb-6">
          <button
            id="academic-back-button"
            type="button"
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-white border border-slate-200/90 shadow-sm flex items-center justify-center text-slate-700 hover:text-slate-900 hover:border-slate-300 active:scale-95 transition-all"
            aria-label="Retour à l'étape précédente"
          >
            <ArrowLeft size={18} strokeWidth={2.2} />
          </button>

          {/* Logo eduFRY Dynamic Scholastic */}
          <div className="flex items-center gap-2 select-none">
            <div className="w-7 h-7 rounded-lg bg-[#006e2f] flex items-center justify-center text-white font-black text-sm shadow-sm">
              e
            </div>
            <span className="text-base font-extrabold tracking-tight">
              edu<span className="text-[#006e2f]">FRY</span>
            </span>
          </div>

          {/* Indicateur de progression discret type "Étape X sur 3" */}
          <div 
            id="step-progress-indicator"
            className="px-3 py-1 rounded-full bg-[#eaf7ed] border border-[#006e2f]/20 text-[#006e2f] text-[11px] font-bold tracking-tight shadow-2xs select-none"
          >
            Étape {step} sur 3
          </div>
        </header>

        {/* Barre de progression visuelle discrète */}
        <div className="w-full h-1 bg-slate-200/80 rounded-full overflow-hidden mb-6">
          <motion.div 
            className="h-full bg-[#006e2f] rounded-full"
            initial={{ width: `${((step - 1) / 3) * 100}%` }}
            animate={{ width: `${(step / 3) * 100}%` }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />
        </div>

        {/* Message d'erreur éventuel */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
            <span className="flex-1">{errorMessage}</span>
          </motion.div>
        )}

        {/* Contenu dynamique animé selon l'étape */}
        <div className="flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {/* ========================================================= */}
            {/* ÉCRAN 1 : SÉLECTION DE LA CLASSE                         */}
            {/* ========================================================= */}
            {step === 1 && (
              <motion.div
                key="step-1-classe"
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="flex flex-col flex-1"
              >
                <div className="mb-6">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#006e2f] mb-1">
                    <GraduationCap size={14} />
                    <span>Niveau d'études</span>
                  </div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
                    Dans quelle classe es-tu ?
                  </h1>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Choisis ta classe pour adapter ton programme scolaire officiel.
                  </p>
                </div>

                {/* 3 cartes sélectionnables : Seconde, Première, Terminale */}
                <div className="space-y-3.5 mb-8">
                  {CLASSES.map((c) => {
                    const isSelected = selectedClasse === c.id;
                    return (
                      <button
                        key={c.id}
                        id={`classe-card-${c.id.toLowerCase()}`}
                        type="button"
                        onClick={() => setSelectedClasse(c.id)}
                        className={`w-full text-left p-4 sm:p-5 rounded-2xl md:rounded-3xl border transition-all duration-200 flex items-center justify-between group active:scale-[0.99] ${
                          isSelected
                            ? 'bg-[#eaf7ed]/80 border-[#006e2f] shadow-sm ring-1 ring-[#006e2f]/30'
                            : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 sm:gap-4">
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-base transition-colors ${
                              isSelected
                                ? 'bg-[#006e2f] text-white shadow-sm'
                                : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200/70'
                            }`}
                          >
                            {c.badge}
                          </div>
                          <div>
                            <div className="text-base font-bold text-slate-900 flex items-center gap-2">
                              <span>{c.label}</span>
                            </div>
                            <p className="text-[12px] text-slate-500 font-medium mt-0.5 leading-snug">
                              {c.description}
                            </p>
                          </div>
                        </div>

                        {/* Indicateur radio / coche */}
                        <div
                          className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                            isSelected
                              ? 'bg-[#006e2f] border-[#006e2f] text-white shadow-xs'
                              : 'border-slate-300 bg-white group-hover:border-slate-400'
                          }`}
                        >
                          {isSelected && <Check size={14} strokeWidth={2.8} />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Bouton pilule Continuer */}
                <div className="mt-auto pt-4">
                  <button
                    id="btn-next-step-1"
                    type="button"
                    disabled={!selectedClasse}
                    onClick={() => selectedClasse && handleNextStep1(selectedClasse)}
                    className="w-full py-4 px-6 rounded-full bg-[#006e2f] text-white font-bold text-sm tracking-wide shadow-md shadow-[#006e2f]/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-[#005725] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>Continuer vers la filière</span>
                    <ArrowRight size={16} strokeWidth={2.4} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* ÉCRAN 2 : SÉLECTION DE LA FILIÈRE                        */}
            {/* ========================================================= */}
            {step === 2 && (
              <motion.div
                key="step-2-filiere"
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="flex flex-col flex-1"
              >
                <div className="mb-6">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#006e2f] mb-1">
                    <Compass size={14} />
                    <span>Orientation académique</span>
                  </div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
                    Quelle est ta filière ?
                  </h1>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Classe choisie : <span className="font-bold text-slate-800">{selectedClasse}</span>. Indique ton type d'enseignement.
                  </p>
                </div>

                {/* 2 cartes sélectionnables : Général et Technique */}
                <div className="space-y-3.5 mb-8">
                  {FILIERES.map((f) => {
                    const isSelected = selectedFiliere === f.id;
                    const isGeneral = f.id === 'Général';
                    return (
                      <button
                        key={f.id}
                        id={`filiere-card-${f.id.toLowerCase()}`}
                        type="button"
                        onClick={() => setSelectedFiliere(f.id)}
                        className={`w-full text-left p-4 sm:p-5 rounded-2xl md:rounded-3xl border transition-all duration-200 flex items-center justify-between group active:scale-[0.99] ${
                          isSelected
                            ? 'bg-[#eaf7ed]/80 border-[#006e2f] shadow-sm ring-1 ring-[#006e2f]/30'
                            : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 sm:gap-4">
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-[#006e2f] text-white shadow-sm'
                                : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200/70'
                            }`}
                          >
                            {isGeneral ? <BookOpen size={22} /> : <Cpu size={22} />}
                          </div>
                          <div>
                            <div className="text-base font-bold text-slate-900 flex items-center gap-2">
                              <span>{f.label}</span>
                            </div>
                            <p className="text-[12px] text-slate-500 font-medium mt-0.5 leading-snug">
                              {f.description}
                            </p>
                          </div>
                        </div>

                        {/* Indicateur radio / coche */}
                        <div
                          className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                            isSelected
                              ? 'bg-[#006e2f] border-[#006e2f] text-white shadow-xs'
                              : 'border-slate-300 bg-white group-hover:border-slate-400'
                          }`}
                        >
                          {isSelected && <Check size={14} strokeWidth={2.8} />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Bouton pilule Continuer */}
                <div className="mt-auto pt-4">
                  <button
                    id="btn-next-step-2"
                    type="button"
                    disabled={!selectedFiliere}
                    onClick={() => selectedFiliere && handleNextStep2(selectedFiliere)}
                    className="w-full py-4 px-6 rounded-full bg-[#006e2f] text-white font-bold text-sm tracking-wide shadow-md shadow-[#006e2f]/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-[#005725] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>Continuer vers la série</span>
                    <ArrowRight size={16} strokeWidth={2.4} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* ÉCRAN 3 : SÉLECTION DE LA SÉRIE                           */}
            {/* ========================================================= */}
            {step === 3 && (
              <motion.div
                key="step-3-serie"
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="flex flex-col flex-1"
              >
                <div className="mb-5">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#006e2f] mb-1">
                    <Layers size={14} />
                    <span>Spécialité & Série</span>
                  </div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
                    Choisis ta série
                  </h1>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Niveau : <span className="font-bold text-slate-800">{selectedClasse}</span> • Filière : <span className="font-bold text-slate-800">{selectedFiliere}</span>
                  </p>
                </div>

                {/* Liste des séries sous forme de cartes avec code et intitulé court */}
                <div className="space-y-2.5 mb-6 max-h-[50vh] overflow-y-auto pr-1">
                  {availableSeries.map((s) => {
                    const isSelected = selectedSerie === s.code;
                    return (
                      <button
                        key={s.code}
                        id={`serie-card-${s.code.toLowerCase()}`}
                        type="button"
                        onClick={() => setSelectedSerie(s.code)}
                        className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between group active:scale-[0.99] ${
                          isSelected
                            ? 'bg-[#eaf7ed]/85 border-[#006e2f] shadow-sm ring-1 ring-[#006e2f]/30'
                            : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm tracking-tight transition-colors shrink-0 ${
                              isSelected
                                ? 'bg-[#006e2f] text-white shadow-xs'
                                : 'bg-slate-100 text-slate-800 group-hover:bg-slate-200/70'
                            }`}
                          >
                            {s.code}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                              <span>{s.code}</span>
                              {s.label && (
                                <span className="text-[12px] font-semibold text-slate-600">
                                  ({s.label})
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-medium text-slate-400 capitalize">
                              {s.category === 'scientifique' && 'Sciences exactes'}
                              {s.category === 'litteraire' && 'Lettres & Langues'}
                              {s.category === 'industriel' && 'Sciences & Technologies Industrielles'}
                              {s.category === 'tertiaire' && 'Sciences Économiques & Gestion'}
                            </span>
                          </div>
                        </div>

                        {/* Indicateur coche / radio */}
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                            isSelected
                              ? 'bg-[#006e2f] border-[#006e2f] text-white shadow-xs'
                              : 'border-slate-300 bg-white group-hover:border-slate-400'
                          }`}
                        >
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Bouton pilule Valider et enregistrer */}
                <div className="mt-auto pt-2">
                  <button
                    id="btn-confirm-academic-setup"
                    type="button"
                    disabled={!selectedSerie || saving}
                    onClick={() => handleFinalSubmit()}
                    className="w-full py-4 px-6 rounded-full bg-[#006e2f] text-white font-bold text-sm tracking-wide shadow-md shadow-[#006e2f]/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-[#005725] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {saving ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Enregistrement en cours...</span>
                      </>
                    ) : (
                      <>
                        <span>Confirmer et passer aux matières</span>
                        <ArrowRight size={16} strokeWidth={2.4} />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
