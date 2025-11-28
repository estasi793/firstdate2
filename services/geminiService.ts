import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const hasApiKey = (): boolean => !!process.env.API_KEY;

/**
 * Generates a creative bio based on user keywords (Spanish).
 */
export const generateBio = async (name: string, traits: string): Promise<string> => {
  if (!process.env.API_KEY) return "API Key faltante. Me gustan los paseos por la playa.";

  try {
    const prompt = `Escribe una biografía corta, ingeniosa y misteriosa para una app de citas (máx 150 caracteres) para una persona llamada ${name}. 
    Gustos/Rasgos: ${traits}. 
    Tono: Divertido, ambiente de "Discoteca/Fiesta", intrigante. 
    Idioma: Español.
    Solo devuelve el texto de la biografía.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text?.trim() || "Listo para bailar toda la noche.";
  } catch (error) {
    console.error("Gemini Bio Error:", error);
    return "Solo estoy aquí por la música.";
  }
};

/**
 * Suggests a reply in a chat context (Wingman feature) in Spanish.
 */
export const getWingmanSuggestion = async (
  myBio: string,
  partnerBio: string,
  lastMessages: { sender: string; text: string }[]
): Promise<string> => {
  if (!process.env.API_KEY) return "¿Hola, qué tal la noche?";

  try {
    const context = lastMessages.map(m => `${m.sender}: ${m.text}`).join('\n');
    
    const prompt = `
    Actúa como un "Wingman" (Asistente de ligues). Sugiere una respuesta corta y atractiva (máx 1 frase) para enviar a continuación.
    
    Mi Bio: ${myBio}
    Su Bio: ${partnerBio}
    
    Historial de conversación:
    ${context}
    
    La respuesta debe ser divertida, casual y fomentar que respondan. Idioma: Español. Solo devuelve la sugerencia.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text?.trim() || "¿Cuál es tu canción favorita de las que han puesto?";
  } catch (error) {
    console.error("Gemini Wingman Error:", error);
    return "¿Te lo estás pasando bien?";
  }
};