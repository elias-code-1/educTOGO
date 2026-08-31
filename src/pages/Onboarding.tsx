import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Target, BrainCircuit, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const slides = [
  {
    title: "Bienvenue sur CPLA 1er D",
    description: "La première application conçue spécialement pour les élèves de Première D au Togo. Révise intelligemment et suis tes progrès en temps réel.",
    icon: BookOpen,
    color: "bg-blue-100 text-blue-600"
  },
  {
    title: "Atteins tes objectifs",
    description: "Avec des parcours de révision personnalisés et un suivi de tes notes, prépare ton passage en Terminale sereinement.",
    icon: Target,
    color: "bg-emerald-100 text-emerald-600"
  },
  {
    title: "Révise avec l'IA",
    description: "Prends en photo tes cours et laisse notre IA te générer des résumés clairs, des fiches et des QCM d'entraînement.",
    icon: BrainCircuit,
    color: "bg-purple-100 text-purple-600"
  }
];

export default function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentSlide === slides.length - 1) {
      navigate('/signup');
    } else {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    navigate('/signup');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden">
      {/* Skip button */}
      <div className="absolute top-6 right-6 z-10">
        <button 
          onClick={handleSkip}
          className="text-gray-500 font-medium text-sm hover:text-gray-900 transition-colors"
        >
          Passer
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center px-8 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center"
          >
            <div className={`w-32 h-32 rounded-3xl ${slides[currentSlide].color} flex items-center justify-center mb-10 shadow-sm`}>
              {React.createElement(slides[currentSlide].icon, { size: 64, strokeWidth: 1.5 })}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
              {slides[currentSlide].title}
            </h1>
            <p className="text-gray-500 text-lg leading-relaxed max-w-sm">
              {slides[currentSlide].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-8 pb-12 flex flex-col items-center">
        {/* Pagination Dots */}
        <div className="flex gap-2 mb-8">
          {slides.map((_, index) => (
            <div 
              key={index} 
              className={`h-2 rounded-full transition-all duration-300 ${
                currentSlide === index ? 'w-8 bg-[#003366]' : 'w-2 bg-gray-200'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="w-full max-w-sm bg-[#003366] text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-[#002244] transition-colors shadow-lg active:scale-95"
        >
          {currentSlide === slides.length - 1 ? 'Commencer' : 'Continuer'}
          <ChevronRight size={24} />
        </button>
        
        <p className="mt-6 text-sm text-gray-500">
          Tu as déjà un compte ?{' '}
          <button onClick={() => navigate('/login')} className="text-[#003366] font-bold hover:underline">
            Connecte-toi
          </button>
        </p>
      </div>
    </div>
  );
}
