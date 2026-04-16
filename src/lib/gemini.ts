import { GoogleGenAI } from "@google/genai";

// Modèle Flash-Lite 2.5 (économique free tier 2026)
const MODEL_NAME = "gemini-2.5-flash-lite";

// Initialisation du client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

/**
 * Vérifie si la clé API est configurée
 */
export function checkApiKey(): boolean {
  const key = process.env.GEMINI_API_KEY;
  if (key && key.trim() !== "") {
    return true;
  }
  console.error("⚠️ GEMINI_API_KEY manquante");
  return false;
}

/**
 * Utilitaire pour gérer le timeout de 30 secondes
 */
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 30000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error("TIMEOUT")), timeoutMs)
    )
  ]);
}

/**
 * Génère un résumé de cours (texte ou image)
 */
export async function generateSummary(content: string, type: "text" | "image_base64"): Promise<string> {
  const systemPrompt = `Tu es un professeur expert pour les élèves de Première D au Togo. Quand on te donne un cours, tu produis un résumé complet et bien structuré. 

Respecte OBLIGATOIREMENT ce format :

# [Titre du cours en majuscules]

## 📌 Introduction
[2-3 phrases qui introduisent le sujet et son importance]

## 📚 [Partie 1 — titre explicite]
[Explication détaillée en 3-5 phrases. Utilise des exemples concrets du quotidien africain quand c'est possible.]

### Points clés :
- [point important 1]
- [point important 2]  
- [point important 3]

## 📚 [Partie 2 — titre explicite]
[Même structure]

### Points clés :
- ...

## 📚 [Partie 3 — titre explicite si nécessaire]
[Même structure]

## 🔑 À retenir absolument
[Liste de 5 à 8 points essentiels à mémoriser pour le BAC, formulés de façon courte et percutante]

## 📝 Définitions importantes
[Tableau ou liste : Terme → Définition simple]

## 💡 Astuce BAC
[1 conseil pratique sur comment ce cours tombe souvent au BAC Première D au Togo]

---
Réponds UNIQUEMENT en français. Le résumé doit être long, complet et permettre à un élève de réviser sans avoir besoin de relire le cours original.`;
  
  try {
    let contents: any[];
    const timeoutMs = type === "image_base64" ? 600000 : 30000;
    
    if (type === "text") {
      contents = [{ role: "user", parts: [{ text: `${systemPrompt}\n\nCours :\n${content}` }] }];
    } else {
      // Extraction des données base64 si nécessaire
      let base64Data = content.includes("base64,") ? content.split("base64,")[1] : content;
      
      contents = [{
        role: "user",
        parts: [
          { text: systemPrompt },
          { inlineData: { mimeType: "image/jpeg", data: base64Data } }
        ]
      }];
    }

    const response = await withTimeout(ai.models.generateContent({
      model: MODEL_NAME,
      contents: contents,
      config: { temperature: 0.3 }
    }), timeoutMs);

    return response.text || "Désolé, je n'ai pas pu générer de résumé.";
  } catch (error: any) {
    if (error.message?.includes("429") || error.status === 429 || 
        error.message?.includes("404") || error.message?.includes("not found") || error.message?.includes("INVALID_ARGUMENT")) {
      return "⏳ Quota IA atteint. Réessaie après minuit (heure de Paris). Tu as le droit à 1000 résumés par jour.";
    }
    if (error.message === "TIMEOUT") {
      return "⏳ Scan trop long. Vérifie ta connexion internet et réessaie.";
    }
    console.error("Gemini Error:", error);
    throw error;
  }
}

/**
 * Génère un quiz QCM de 5 questions
 */
export async function generateQuiz(subject: string, topic: string, difficulty: "facile" | "moyen" | "difficile"): Promise<QuizQuestion[]> {
  const prompt = `Tu es un professeur qui prépare des élèves de Première D au BAC au Togo. Génère 5 questions QCM sur le sujet donné. 
  Sujet : ${topic} (${subject})
  Difficulté : ${difficulty}
  
  Réponds UNIQUEMENT en JSON valide, sans markdown, sans backticks, format : [{"question": "...", "options": ["...", "...", "...", "..."], "correctIndex": 0-3, "explanation": "..."}]`;

  try {
    const response = await withTimeout(ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { 
        temperature: 0.5,
        responseMimeType: "application/json"
      }
    }));

    const text = response.text;
    if (!text) return [];

    // Nettoyage au cas où le modèle renvoie du markdown
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanJson) as QuizQuestion[];
  } catch (error: any) {
    if (error.message?.includes("429") || error.status === 429 || 
        error.message?.includes("404") || error.message?.includes("not found") || error.message?.includes("INVALID_ARGUMENT")) {
      return [];
    }
    console.error("Gemini Quiz Error:", error);
    return [];
  }
}

/**
 * Génère une roadmap de révision
 */
export async function generateRoadmap(weakSubjects: string[], availableWeeks: number): Promise<string> {
  const prompt = `Tu es un coach scolaire expert pour le BAC Première D au Togo. Crée un planning de révision semaine par semaine, priorise les matières faibles listées. 
  Matières à renforcer : ${weakSubjects.join(", ")}
  Durée : ${availableWeeks} semaines
  
  Format : semaines numérotées avec objectifs clairs. Réponds en français.`;

  try {
    const response = await withTimeout(ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { temperature: 0.4 }
    }));

    return response.text || "Désolé, je n'ai pas pu générer de roadmap.";
  } catch (error: any) {
    if (error.message?.includes("429") || error.status === 429 || 
        error.message?.includes("404") || error.message?.includes("not found") || error.message?.includes("INVALID_ARGUMENT")) {
      return "⏳ Quota IA atteint. Réessaie demain.";
    }
    console.error("Gemini Roadmap Error:", error);
    throw error;
  }
}
