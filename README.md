# 🚀 StudyZap.ai  
**Turn boring slides into instant A’s.**

StudyZap.ai is an intelligent exam preparation assistant that converts academic documents into structured study notes, interactive quizzes, and insightful performance analytics using the **Google Gemini API**.

---

## 📘 Overview

StudyZap helps students **maximize concentration** and **minimize preparation time**.  
Instead of manually sifting through hundreds of slides or PDFs, users simply upload their materials.

The app uses advanced AI to:
- Extract key concepts
- Generate exam-oriented notes
- Create interactive “Test Yourself” quizzes
- Visualize performance with analytics  

All of this is delivered through a **gamified, responsive dashboard** designed for focused exam preparation.

---

## ✨ Key Features

- **📄 Universal Document Processing**  
  Upload PDFs, text files, Markdown, or images. The AI instantly analyzes the content.

- **📝 Smart Notes Generation**  
  Automatically creates structured summaries, including:
  - Exam cheatsheets  
  - Key definitions  
  - Real-world applications  

- **🎯 Interactive Quiz Mode**  
  Dynamic 10-question quizzes generated directly from your material.  
  Includes score tracking and celebratory animations 🎉

- **🧠 AI Tutor Chat**  
  “Chat with your Document” to ask focused questions about the uploaded content.

- **📊 Performance Analytics**  
  Visual charts to track:
  - Scores over time  
  - Daily streaks  
  - Topic-wise performance  

- **💾 Persistent Sessions**  
  User profiles and project libraries are stored locally using `localStorage`.  
  Log out and log back in with your email to restore your study history.

- **🌗 Dark / Light Mode**  
  Fully responsive UI with seamless theme switching.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript  
- **Styling:** Tailwind CSS  
- **AI Integration:** Google GenAI SDK (`@google/genai`)  
- **Model:** `gemini-3-flash-preview`  
- **Data Visualization:** Recharts  
- **Icons:** Lucide React  
- **State Management:** React Hooks + Local Storage  

---

## 🚦 Getting Started

### ✅ Prerequisites

- Node.js installed  
- A valid **Google Gemini API Key**

---

### 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/studyzap.git
   cd studyzap
Install dependencies

bash
Copy code
npm install
Configure environment variables

Create a .env file in the root directory:

env
Copy code
API_KEY=your_google_gemini_api_key_here
Run the application

bash
Copy code
npm start
🧭 Usage Flow
Landing Page
Introduction to the app’s value proposition.

Authentication
Sign up / Login (localStorage-based) to create a personalized profile.

Dashboard

Library: Upload new files or select previous projects

Magic: Click Generate Magic to process documents

Notes: Review AI-generated study guides

Quiz: Test yourself and get instant feedback

Stats: View performance history and analytics
