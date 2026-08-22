import { GoogleGenerativeAI } from "@google/generative-ai";
import { RawEvaluationSchema, type RawEvaluation } from "./schemas";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function evaluateWithGemini(prompt: string): Promise<RawEvaluation> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    generationConfig: {
      temperature: 0.1,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    },
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const cleaned = text.replace(/^```json\s*/, "").replace(/```\s*$/, "").trim();
  const parsed = JSON.parse(cleaned);
  return RawEvaluationSchema.parse(parsed);
}
