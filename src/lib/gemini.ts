import { GoogleGenAI } from "@google/genai";
import { getTotalUsed, getGeminiKeys, MAX_RPD_PER_KEY, forceSkipToNextKey } from "./quotaManager";

const MODEL_NAME = "gemini-3-flash-preview";

// On remplace le client statique par un client dynamique généré à la volée 
// en fonction de la consommation actuelle du quota pour créer l'effet Key Rotation.
async function getAiClient(uid: string) {
  const keys = getGeminiKeys();
  if (keys.length === 0) {
    throw new Error("GEMINI_API_KEY manquante");
  }

  const totalUsed = await getTotalUsed(uid);
  const activeIndex = Math.min(Math.floor(totalUsed / MAX_RPD_PER_KEY), keys.length - 1);
  const activeKey = keys[activeIndex];

  return new GoogleGenAI({ apiKey: activeKey });
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export function checkApiKey(): boolean {
  return getGeminiKeys().length > 0;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 30000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error("TIMEOUT")), timeoutMs)
    )
  ]);
}

/**
 * Exécute une tâche Gemini avec Retry automatique
 * Si une erreur 429 survient, on "brûle" la clé actuelle dans la base de données
 * puis on passe automatiquement à la suivante et on relance la requête.
 */
async function executeWithRotationRetries<T>(
  uid: string, 
  task: (aiClient: GoogleGenAI) => Promise<T>
): Promise<T> {
  try {
    const ai = await getAiClient(uid);
    return await task(ai);
  } catch (error: any) {
    // Si c'est une erreur de quota (429 Too Many Requests, Resource Exhausted)
    if (error.message?.includes("429") || error.status === 429 || error.message?.includes("RESOURCE_EXHAUSTED")) {
      console.warn("⚠️ Quota limite atteint pour cette clé. Passage à la clé suivante...");
      
      // On force le passage à la clé suivante (incrémentation dans Firestore)
      await forceSkipToNextKey(uid);
      
      // On relance instantanément avec le nouveau client (et donc la nouvelle clé active)
      const newAi = await getAiClient(uid);
      return await task(newAi);
    }
    throw error;
  }
}

export async function generateSummary(content: string | string[], type: "text" | "image_base64", uid: string): Promise<string> {
  const promptText = `Tu es un professeur expert pour les élèves de Première D au Togo. Quand on te donne un cours, tu produis un résumé complet et bien structuré. 

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

## 🔑 À retenir absolument
[Liste de 5 à 8 points essentiels à mémoriser pour le BAC]

## 📝 Définitions importantes
[Tableau ou liste : Terme -> Définition simple]

## 💡 Astuce BAC
[1 conseil pratique sur comment ce cours tombe souvent au BAC Première D]

---
RÈGLE OBLIGATOIRE SUR LES MATHÉMATIQUES : 
NE JAMAIS utiliser des signes de dollars simples "$" ou "$$" pour les formules. Tu DOIS ABSOLUMENT utiliser le vrai bloc de code mathématique ou laisser la formule en texte brut lisible avec des parenthèses simples.
Ex: "Matière brute (mb) : ..." (PAS de symboles mystères). 
Si tu as absolument besoin du formatage mathématique, utilise un bloc latex avec \`\`\`math ... \`\`\` 

Réponds UNIQUEMENT en français. Le résumé doit être long, complet et permettre à un élève de réviser sans avoir besoin de relire le cours original.`;

  const promptImage = "Tu es prof de Première D au Togo. Analyse ces pages de cours jointes et génère un résumé global structuré complet en français avec : titre, introduction, parties numérotées avec points clés, définitions importantes, astuce BAC.";

  const systemPrompt = type === "text" ? promptText : promptImage;
  
  try {
    let contents: any[];
    const timeoutMs = type === "image_base64" ? 600000 : 30000;
    
    if (type === "text") {
      contents = [{ role: "user", parts: [{ text: `${systemPrompt}\n\nCours :\n${content as string}` }] }];
    } else {
      // Cas de tableau d'images (ou chaîne unique convertie en tableau)
      const imagesArray = Array.isArray(content) ? content : [content];
      
      const parts: any[] = [{ text: systemPrompt }];
      
      // Ajouter toutes les pages au prompt
      for (const imgBase64 of imagesArray) {
          let cleanBase64 = imgBase64.includes("base64,") ? imgBase64.split("base64,")[1] : imgBase64;
          parts.push({ inlineData: { mimeType: "image/jpeg", data: cleanBase64 } });
      }

      contents = [{
        role: "user",
        parts: parts
      }];
    }

    // Appel avec système de rotation anti-429
    const responseText = await executeWithRotationRetries(uid, async (ai) => {
      const response = await withTimeout(ai.models.generateContent({
        model: MODEL_NAME,
        contents: contents,
        config: { temperature: 0.3 }
      }), timeoutMs);
      return response.text;
    });

    return responseText || "Désolé, je n'ai pas pu générer de résumé.";
  } catch (error: any) {
    if (error.message?.includes("429") || error.status === 429) {
      return "⏳ Vous avez épuisé TOUTES VOS CLÉS (Quota Global atteint). Réessaie après minuit.";
    }
    if (error.message === "TIMEOUT") {
      return "⏳ Scan trop long. Vérifie ta connexion internet et réessaie.";
    }
    console.error("Gemini Error:", error);
    throw error;
  }
}

export async function generateQuiz(subject: string, topic: string, difficulty: "facile" | "moyen" | "difficile", uid: string): Promise<QuizQuestion[]> {
  const prompt = `Tu es un professeur qui prépare des élèves de Première D au BAC au Togo. Génère 5 questions QCM sur le sujet donné. 
  Sujet : ${topic} (${subject})
  Difficulté : ${difficulty}
  
  Réponds UNIQUEMENT en JSON valide, sans markdown, sans backticks, format : [{"question": "...", "options": ["...", "...", "...", "..."], "correctIndex": 0-3, "explanation": "..."}]`;

  try {
    const textResponse = await executeWithRotationRetries(uid, async (ai) => {
      const response = await withTimeout(ai.models.generateContent({
        model: MODEL_NAME,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { 
          temperature: 0.5,
          responseMimeType: "application/json"
        }
      }));
      return response.text;
    });

    if (!textResponse) return [];

    const cleanJson = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanJson) as QuizQuestion[];
  } catch (error: any) {
    if (error.message?.includes("429") || error.status === 429) {
      // Toutes les clés sont cramées
    }
    console.error("Gemini Quiz Error:", error);
    return [];
  }
}

export async function generateRoadmap(weakSubjects: string[], availableWeeks: number, uid: string): Promise<string> {
  const prompt = `Tu es un coach scolaire expert pour le BAC Première D au Togo. Crée un planning de révision semaine par semaine, priorise les matières faibles listées. 
  Matières à renforcer : ${weakSubjects.join(", ")}
  Durée : ${availableWeeks} semaines
  
  Format : semaines numérotées avec objectifs clairs. Réponds en français.`;

  try {
    const responseText = await executeWithRotationRetries(uid, async (ai) => {
      const response = await withTimeout(ai.models.generateContent({
        model: MODEL_NAME,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { temperature: 0.4 }
      }));
      return response.text;
    });

    return responseText || "Désolé, je n'ai pas pu générer de roadmap.";
  } catch (error: any) {
    if (error.message?.includes("429") || error.status === 429) {
      return "⏳ Quota Global IA totalement épuisé. Réessaie demain.";
    }
    console.error("Gemini Roadmap Error:", error);
    throw error;
  }
}
