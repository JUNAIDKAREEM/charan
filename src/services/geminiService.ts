import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface AnalysisResult {
  category: string;
  urgency: "low" | "medium" | "high" | "critical";
  summary: string;
  suggestedDepartment: string;
  isSpam: boolean;
  spamReason?: string;
  confidenceScore: number;
}

export const analyzeIssue = async (base64Image: string, mimeType: string): Promise<AnalysisResult> => {
  const model = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType
            }
          },
          {
            text: "Analyze this civic issue image. Identify the category (e.g., Pothole, Street Light, Garbage, Water Leakage, Sewage), predict urgency (low, medium, high, critical), provide a 1-sentence summary, and suggest the responsible government department (e.g., PWD, Power Dept, Municipal Corp, Water Board). Also, detect if this is a spam or fake report (e.g., if the image is not related to a civic issue, or is a joke). Provide a confidence score between 0 and 1 for your analysis."
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          urgency: { type: Type.STRING, enum: ["low", "medium", "high", "critical"] },
          summary: { type: Type.STRING },
          suggestedDepartment: { type: Type.STRING },
          isSpam: { type: Type.BOOLEAN },
          spamReason: { type: Type.STRING },
          confidenceScore: { type: Type.NUMBER }
        },
        required: ["category", "urgency", "summary", "suggestedDepartment", "isSpam", "confidenceScore"]
      }
    }
  });

  const response = await model;
  return JSON.parse(response.text || "{}");
};

export const civicCoach = async (query: string, history: any[]): Promise<string> => {
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: "You are a helpful Civic Coach for 'Smart Samadhan'. Help citizens report issues, explain the process, and provide status updates. Be concise and professional."
    }
  });

  const response = await chat.sendMessage({ message: query });
  return response.text || "I'm sorry, I couldn't process that.";
};
