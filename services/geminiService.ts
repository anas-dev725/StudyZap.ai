import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion } from "../types";

// Supported MIME types for Gemini API
// Note: Office formats (DOCX, PPTX, XLSX) are NOT supported natively by Gemini via inlineData.
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

// Helper to safely decode Base64 to UTF-8 text
const base64ToText = (base64: string): string => {
  const raw = atob(base64);
  try {
    return decodeURIComponent(escape(raw));
  } catch (e) {
    return raw;
  }
};

const validateMimeType = (mimeType: string) => {
  if (!SUPPORTED_MIME_TYPES.includes(mimeType)) {
    throw new Error(`Unsupported file type: ${mimeType}. Please upload a PDF, Text file, Markdown, CSV, or Image.`);
  }
};

const getFilePart = (fileData: string, mimeType: string) => {
  const cleanBase64 = stripBase64Prefix(fileData);
  
  // For text-based formats, send as text part to avoid encoding/MIME issues
  if (mimeType.startsWith('text/') || mimeType === 'application/json') {
     return { text: base64ToText(cleanBase64) };
  }
  
  // For binaries (PDF, Images), use inlineData
  return {
    inlineData: {
      mimeType: mimeType,
      data: cleanBase64
    }
  };
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
          getFilePart(fileData, mimeType),
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
       throw new Error(`The AI model rejected this file (${mimeType}). Please ensure it is a valid PDF, Text, or Image file.`);
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
          getFilePart(fileData, mimeType),
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
  topic: string,
  quizQuestions: QuizQuestion[],
  userAnswers: number[]
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Identify incorrect topics to give specific feedback
    const incorrectDetails = quizQuestions.map((q, i) => {
        if (userAnswers[i] !== q.correctAnswerIndex) {
            return `Question: "${q.question}" (Student Answered: ${q.options[userAnswers[i]] || 'Skipped'}; Correct: ${q.options[q.correctAnswerIndex]})`;
        }
        return null;
    }).filter(Boolean).join('\n');

    const prompt = `The student scored ${score} out of ${total} on a quiz about "${topic}". Provide feedback.`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            systemInstruction: `
                The student scored ${score}/${total}.
                
                Here is the context of what they missed:
                ${incorrectDetails || "They got everything right!"}

                Instructions:
                1. If the score is high (>80%), be super celebratory and enthusiastic.
                2. If the score is low, be encouraging but acknowledge it was tough.
                3. CRITICAL: Based on the missed questions above, identify 2-3 specific sub-topics or concepts they should revisit. Be very specific about what to study.
                4. Keep the response under 80 words.
                5. Do NOT use markdown bolding (asterisks like **text**). Write in plain text only.
            `
        }
    });

    // Manually strip asterisks if the model ignores the instruction
    const rawText = response.text || "Keep studying!";
    return rawText.replace(/\*\*/g, '');
}

export const chatWithDocument = async (
    fileData: string,
    mimeType: string,
    history: {role: string, parts: {text: string}[]}[],
    message: string
) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Use getFilePart to handle text vs binary correctly in chat context
    const filePart = getFilePart(fileData, mimeType);

    const contents = [
        ...history,
        {
            role: 'user',
            parts: [
                filePart,
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