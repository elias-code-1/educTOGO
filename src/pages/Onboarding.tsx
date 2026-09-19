import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

const slides = [
  {
    id: 'welcome',
    title: "Bienvenue sur eduFRY",
    description: "Ton nouveau compagnon intelligent pour réussir ton année scolaire. Découvre comment nous allons t'aider à exceller au quotidien.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDVc-sYamrNzaqo3qR-Wt0_3PpHSZnMLC5-bt1Sbm-HHVoMCzkRSUIy9h6BuQ1TXGAeP0mzHap1q6edjhjbCQgsqA4D_RTZ4HuzJhgd5Y-m5Rr_DONLJ1mrqDa0R7boXwfLYqih4KQgIYPf8Pg-QQh8I4yvHa2G-di5Lk9SKbdAeL0DGgPhTUpgX2bg7MkhNzs_2GyTzI4S7I-U8b5ZuN9S4GmItzRoJ4c7FWz6wVL3QM6mFjimr2Bq", // Fallback to scan image as generic welcome if specific isn't provided, or we can use a custom styling.
    isWelcome: true, // Special flag for styling
  },
  {
    id: 'scan',
    title: "Scanne tes cours",
    description: "Prends une simple photo de ton cahier ou manuel. Notre IA intelligente analyse la page et la transforme instantanément en fiches claires et exercices ciblés.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDVc-sYamrNzaqo3qR-Wt0_3PpHSZnMLC5-bt1Sbm-HHVoMCzkRSUIy9h6BuQ1TXGAeP0mzHap1q6edjhjbCQgsqA4D_RTZ4HuzJhgd5Y-m5Rr_DONLJ1mrqDa0R7boXwfLYqih4KQgIYPf8Pg-QQh8I4yvHa2G-di5Lk9SKbdAeL0DGgPhTUpgX2bg7MkhNzs_2GyTzI4S7I-U8b5ZuN9S4GmItzRoJ4c7FWz6wVL3QM6mFjimr2Bq",
    topBadgeText: "IA Vision 2.0",
    topBadgeIcon: "auto_awesome",
    bottomBadgeText: "Scan IA instantané",
    bottomBadgeIcon: "document_scanner"
  },
  {
    id: 'quiz',
    title: "Révise en t'amusant",
    description: "Des quiz stimulants et interactifs générés sur mesure selon ton niveau, ta classe et ta série.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB0aUXuFuB2H5vJey7gyDrjNTqvruaEWvKIhCm-C7hRiyT9bRJePZcUDkStuBbSsWJCJvYaLY99ZJ6vm0O5Ve3hQycKBOdKwqxFpcAJPNMMUf1_mqWtWD4EiIZSpKF2x44cso-XlEm2FVwbd0hnMbpE_p9TrB9RSQFUoyAYBGazLuuxKlOsINJy1kqRWy8J9XZ1CRgFlAIJSKnCkDkeTUVe7XFygtwE81aRGLPRC29pwm1twh8HxAji",
    topBadgeText: "Quiz IA personnalisé",
    topBadgeIcon: "auto_awesome",
    bottomBadgeText: "Gamification & Défis",
    bottomBadgeIcon: "military_tech"
  },
  {
    id: 'tutor',
    title: "Un assistant toujours là",
    description: "Pose toutes tes questions à notre tuteur IA bienveillant, débloque tes exercices difficiles et révise tes leçons à n'importe quelle heure du jour ou de la nuit.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD3hBANBRhTWgoqNO48mzMXcwSGyFfZx0sIdCuWjtbuUNGeQ6M2e2_Tbxwk33XoDj0d7i4EiHAF3zjQ2OVMykfvKUgMu_GrcFb-eeugU8eAhotW2uYAmiBd3YOdiptqzW5smJV1K9d40-PqG2hUViZz592klN8My9vcaWcvq8WPbn7MuDrv_U4HJltDgz8v4lkJVHncZ92nE8N74inq-ESqNPZbLtVHUvcuihqzuKWTd9q_-ZPRSYo_",
    topBadgeText: "Tuteur IA 24/7",
    topBadgeIcon: "auto_awesome",
    bottomBadgeText: "Réponses & aide en direct",
    bottomBadgeIcon: "chat"
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
    <div className="min-h-screen bg-[#f7f9fb] flex flex-col relative overflow-hidden font-sans selection:bg-[#006e2f]/20 selection:text-[#005423]">
      {/* Header with Skip button */}
      <header className="fixed top-0 inset-x-0 z-50 pt-safe">
        <div className="h-14 px-6 flex items-center justify-end pt-4">
          <button 
            onClick={handleSkip}
            className="font-semibold text-sm text-slate-500 hover:text-[#006e2f] transition-colors py-2 px-4 rounded-full active:bg-slate-200/50"
          >
            Passer
          </button>
        </div>
      </header>

      {/* Main Content Carousel */}
      <main className="flex-1 flex flex-col w-full px-6 pt-20 pb-44 items-center justify-center max-w-md mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center w-full"
          >
            {/* Visual Presentation Area */}
            <div className="relative w-full aspect-square max-w-[320px] flex items-center justify-center mb-8">
              {slides[currentSlide].isWelcome ? (
                // Special styling for the Welcome slide
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <div className="absolute inset-0 bg-[#eaf7ed] rounded-3xl shadow-[0_4px_24px_-2px_rgba(0,110,47,0.1)] flex flex-col items-center justify-center p-8 text-center border border-[#006e2f]/10">
                    <div className="w-20 h-20 bg-[#006e2f] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[#006e2f]/25">
                      <span className="text-white text-4xl font-black">e</span>
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">edu<span className="text-[#006e2f]">FRY</span></h2>
                    <p className="text-sm text-[#006e2f] font-semibold mt-2 tracking-wide uppercase">L'excellence scolaire</p>
                  </div>
                </div>
              ) : (
                // Standard Image Frame for feature slides
                <>
                  <div className="absolute inset-0 bg-white/80 rounded-3xl shadow-[0_4px_24px_-2px_rgba(0,110,47,0.06)] backdrop-blur-sm border border-slate-200/50"></div>
                  <img 
                    alt={slides[currentSlide].title} 
                    className="relative z-10 w-full h-full object-cover rounded-3xl p-1.5 drop-shadow-sm select-none" 
                    src={slides[currentSlide].image} 
                  />
                  
                  {/* Top Badge */}
                  <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-slate-100">
                    <span className="material-symbols-rounded text-[#006e2f] text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {slides[currentSlide].topBadgeIcon}
                    </span>
                    <span className="text-[11px] font-bold text-[#006e2f] tracking-wide uppercase">
                      {slides[currentSlide].topBadgeText}
                    </span>
                  </div>

                  {/* Bottom Badge */}
                  <div className="absolute -bottom-3 z-20 flex items-center gap-1.5 bg-[#006e2f] text-white px-4 py-1.5 rounded-full shadow-md">
                    <span className="material-symbols-rounded text-[18px]">
                      {slides[currentSlide].bottomBadgeIcon}
                    </span>
                    <span className="text-[11px] font-bold tracking-wide uppercase">
                      {slides[currentSlide].bottomBadgeText}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Typography */}
            <div className="flex flex-col items-center text-center px-2 mt-4">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {slides[currentSlide].title}
              </h1>
              <p className="text-[13px] text-slate-500 mt-3 max-w-[280px] leading-relaxed">
                {slides[currentSlide].description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Navigation */}
      <footer className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-[#f7f9fb]/90 backdrop-blur-xl">
        <div className="px-6 pt-4 pb-8 flex flex-col gap-5 max-w-md mx-auto w-full">
          
          {/* Pagination Indicators */}
          <div className="flex items-center justify-center gap-2 py-1" role="tablist">
            {slides.map((_, index) => (
              <div 
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentSlide === index ? 'w-6 bg-[#006e2f]' : 'w-2 bg-[#006e2f]/20'
                }`}
                aria-hidden="true"
              />
            ))}
          </div>

          {/* Primary Action Button */}
          <div className="w-full">
            <button
              onClick={handleNext}
              className="w-full h-[52px] bg-[#006e2f] text-white font-bold text-[15px] rounded-full flex items-center justify-center gap-2 shadow-[0_8px_20px_-4px_rgba(0,110,47,0.25)] active:scale-[0.98] transition-all hover:bg-[#005423]"
            >
              {currentSlide === slides.length - 1 ? (
                <>
                  <span>Commencer</span>
                  <span className="material-symbols-rounded text-[20px]">arrow_forward</span>
                </>
              ) : (
                'Suivant'
              )}
            </button>
          </div>
          
          {/* Login Link */}
          <p className="text-center text-[13px] text-slate-500 font-medium">
            Déjà un compte ?{' '}
            <button 
              onClick={() => navigate('/login')} 
              className="text-[#006e2f] font-bold hover:underline active:opacity-80 transition-opacity"
            >
              Connecte-toi
            </button>
          </p>

        </div>
      </footer>
    </div>
  );
}
