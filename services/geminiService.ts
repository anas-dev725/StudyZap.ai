import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion } from "../types";

// Supported MIME types for Gemini API inlineData
const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv',
  'text/html',
  'text/javascript',
  'text/x-typescript',
  'application/json',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif'
];

// Helper to strip the data URL prefix (e.g., "data:image/png;base64,")
const stripBase64Prefix = (base64: string): string => {
  return base64.split(',')[1] || base64;
};

const validateMimeType = (mimeType: string) => {
  if (!SUPPORTED_MIME_TYPES.includes(mimeType)) {
    throw new Error(`Unsupported file type: ${mimeType}. Please upload a PDF, Text file, Markdown, or Image.`);
  }
};

export const generateStudyNotes = async (
  fileData: string,
  mimeType: string
): Promise<string> => {
  validateMimeType(mimeType);

  // Exclusively use process.env.API_KEY for initialization as per system requirements.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Analyze the provided document and generate a highly structured study guide that covers every important detail.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: stripBase64Prefix(fileData)
            }
          },
          { text: prompt }
        ]
      },
      config: {
        systemInstruction: `
          You are an elite academic tutor named "Zap". 
          Format your response strictly using these markdown sections:

          ## 🚀 Overview
          Explain the main topic and purpose of the document in a concise way.

          ## 🔑 Key Concepts & Definitions
          List the most important terms and concepts found in the text.
          - Concept 1: Definition...
          - Concept 2: Definition...

          ## 🧠 Core Details & Analysis
          Break down the main sections of the document. Explain the "How" and "Why".
          Cover specific details like methodologies, processes, or theories mentioned.

          ## 🌍 Real-World Applications
          Provide 3 concrete examples or use cases of these concepts in real life.
          
          ## 💡 Exam Cheatsheet
          List 5 specific things that are highly likely to appear on an exam based on this content.
          
          ## ❓ Potential Exam Questions
          List 3-5 short answer or essay style questions that a professor might ask, along with brief bullet-point answers.

          Do not use asterisks ** around headers, use the ## syntax. Use ** only for highlighting specific keywords inside sentences.
        `
      }
    });

    return response.text || "Failed to generate notes.";
  } catch (error: any) {
    console.error("Error generating notes:", error);
    if (error.message?.includes('400') || error.status === 400) {
       throw new Error("The AI model rejected this file. Please ensure it is a valid PDF or Text file.");
    }
    throw error;
  }
};

export const generateQuiz = async (
  fileData: string,
  mimeType: string
): Promise<QuizQuestion[]> => {
  validateMimeType(mimeType);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `Based on the provided document, generate a fun and challenging quiz.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: stripBase64Prefix(fileData)
            }
          },
          { text: prompt }
        ]
      },
      config: {
        systemInstruction: `
          Create exactly 10 multiple-choice questions based on the provided content.
          The tone should be slightly playful but educational.
          Ensure the questions map to the key topics in the document.
          Avoid obvious answers.
        `,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING } 
              },
              correctAnswerIndex: { 
                type: Type.INTEGER, 
                description: "The index (0-3) of the correct option" 
              },
              explanation: { type: Type.STRING }
            },
            required: ["question", "options", "correctAnswerIndex", "explanation"]
          }
        }
      }
    });

    const jsonText = response.text || "[]";
    return JSON.parse(jsonText) as QuizQuestion[];
  } catch (error) {
    console.error("Error generating quiz:", error);
    return [];
  }
};

export const generateQuizFeedback = async (
  score: number,
  total: number,
  topic: string
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `The student scored ${score} out of ${total} on a quiz about "${topic}". Provide feedback.`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            systemInstruction: `
                If the score is high (>80%), be super celebratory and enthusiastic.
                If the score is low, be encouraging but acknowledge it was tough.
                Provide 1 specific tip for improvement.
                Keep it under 60 words.
            `
        }
    });

    return response.text || "Keep studying!";
}

export const chatWithDocument = async (
    fileData: string,
    mimeType: string,
    history: {role: string, parts: {text: string}[]}[],
    message: string
) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const contents = [
        ...history,
        {
            role: 'user',
            parts: [
                {
                    inlineData: {
                        mimeType: mimeType,
                        data: stripBase64Prefix(fileData)
                    }
                },
                { text: message }
            ]
        }
    ];

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: contents,
        config: {
            systemInstruction: "You are 'Zap', a fun and helpful AI study buddy. Answer the user's question based strictly on the document provided. Keep it concise."
        }
    });

    return response.text || "I couldn't generate a response.";
};