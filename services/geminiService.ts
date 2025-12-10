import { GoogleGenAI } from "@google/genai";
import { AssessmentResult, AssessmentType } from "../types";
import { calculateDifficulty } from "../utils/scoring";

export const generateAnalysis = async (results: AssessmentResult[]): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key missing. Cannot generate AI analysis.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Format results for the prompt with rich details (Raw Metrics + Score)
  const resultsSummary = results.map(r => {
    const { level } = calculateDifficulty(r.score);
    let detail = '';
    
    // Add specific raw metric context based on type
    if ([AssessmentType.WordRecognition, AssessmentType.VisualProcessing].includes(r.type)) {
       detail = `Speed: ${r.rawMetric}ms`;
    } else if (r.type === AssessmentType.WorkingMemory) {
       detail = `Max Span: ${r.rawMetric} digits`;
    } else {
       detail = `Accuracy: ${r.rawMetric}/${r.totalItems}`;
    }

    return `- ${r.type}: Score ${r.score}/100 (${level}) [${detail}]`;
  }).join('\n');

  const prompt = `
    Act as a professional educational psychologist and dyslexia specialist. 
    Analyze the following assessment scores for a user. 
    
    Data:
    ${resultsSummary}

    Task:
    1. Provide a brief, encouraging summary of the user's cognitive strengths based on high scores.
    2. Identify potential areas of dyslexia-related difficulty based on low scores and specific raw metrics (e.g., slow reaction times >1000ms, low memory span <5).
    3. Predict the overall Dyslexia Severity (Mild/Moderate/Severe) based on the pattern.
    4. Suggest 2 specific, actionable exercises tailored to the weakest areas.
    
    Keep the response under 150 words. Format with clear paragraphs. Talk directly to the user ("You").
  `;

  // NOTE: If you plan to use your own model later, replace this block with your custom API fetch.
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Could not generate analysis.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "An error occurred while communicating with the AI analysis service.";
  }
};