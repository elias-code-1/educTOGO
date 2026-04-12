import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini API client
// We use the environment variable provided by Vite
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface StudyPack {
  summary: string;
  interactivePrompt: string;
  exercises: {
    question: string;
    options?: string[];
    answer: string;
    explanation: string;
  }[];
}

export async function generateStudyPackFromImages(base64Images: string[]): Promise<StudyPack> {
  if (!base64Images || base64Images.length === 0) {
    throw new Error("Aucune image fournie.");
  }

  const prompt = `
    Tu es un professeur expert du programme de Première D au Togo.
    Analyse les images de cours fournies et génère un "Pack d'Étude" complet au format JSON STRICT.
    
    Le JSON doit avoir la structure suivante :
    {
      "summary": "Un résumé clair et structuré des points clés à retenir absolument de ce cours.",
      "interactivePrompt": "Une question ouverte ou une mise en situation pour forcer l'élève à réfléchir sur le concept principal (apprentissage actif).",
      "exercises": [
        {
          "question": "Question de l'exercice (QCM ou calcul)",
          "options": ["Option A", "Option B", "Option C", "Option D"], // Optionnel, seulement pour les QCM
          "answer": "La bonne réponse",
          "explanation": "Explication détaillée de la réponse"
        }
      ]
    }
    
    Génère exactement 10 exercices de difficulté progressive (type Bac Togo).
    Assure-toi que la réponse soit uniquement le JSON valide, sans aucun texte avant ou après (pas de markdown \`\`\`json).
  `;

  try {
    const contents = [
      prompt,
      ...base64Images.map(base64 => {
        // Extract mime type and base64 data
        const match = base64.match(/^data:(image\/[a-z]+);base64,(.+)$/);
        if (!match) throw new Error("Format d'image invalide");
        
        return {
          inlineData: {
            mimeType: match[1],
            data: match[2]
          }
        };
      })
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
      }
    });

    if (!response.text) {
      throw new Error("La réponse de l'IA est vide.");
    }

    const result = JSON.parse(response.text);
    return result as StudyPack;

  } catch (error) {
    console.error("Erreur lors de la génération du pack d'étude:", error);
    throw new Error("Impossible d'analyser le cours. Veuillez réessayer.");
  }
}
