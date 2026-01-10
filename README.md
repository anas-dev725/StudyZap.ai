StudyZap.ai
Turn boring slides into instant As.
An intelligent exam preparation assistant that converts documents into structured study notes, interactive quizzes, and insightful analytics using the Google Gemini API.

Overview
StudyZap helps students maximize their concentration and minimize preparation time. Instead of manually sifting through hundreds of PDF slides, users simply upload their materials. The app uses advanced AI to extract key concepts, generate "Test Yourself" quizzes, and provide an AI Tutor chat interface—all wrapped in a gamified, responsive dashboard.

Key Features
📄 Universal Document Processing: Upload PDFs, Text files, Markdown, or Images. The AI instantly analyzes the content.
📝 Smart Notes Generation: Automatically creates structured summaries, including "Exam Cheatsheets," "Real-World Applications," and "Key Definitions."
🎯 Interactive Quiz Mode: Generates dynamic 10-question quizzes based on your specific material. Includes score tracking and celebratory animations (confetti!).
🧠 AI Tutor Chat: A "Chat with your Document" feature allowing users to ask specific questions about the uploaded content.
📊 Performance Analytics: Visualizes progress with charts, tracks daily streaks, and calculates average scores to gamify the study process.
💾 Persistent Sessions: User profiles and project libraries are saved locally via localStorage. Log out and log back in with your email to restore your entire study history.
🌗 Dark/Light Mode: A fully responsive UI with seamless theme switching.

Tech Stack
Frontend: React 19, TypeScript
Styling: Tailwind CSS
AI Integration: Google GenAI SDK (@google/genai)
Models used: gemini-3-flash-preview
Visualization: Recharts (Data visualization), Lucide React (Icons)
State Management: React Hooks + Local Storage

Getting Started
Prerequisites
Node.js installed.
A valid Google Gemini API Key.
Installation
Clone the repository
code
Bash
git clone https://github.com/your-username/studyzap.git
cd studyzap
Install dependencies
code
Bash
npm install
Configure Environment
Create a .env file in the root directory and add your API key:
code
Env
API_KEY=your_google_gemini_api_key_here
Run the application
code
Bash
npm start

Usage Flow
Landing: Introduction to the app's value proposition.
Auth: Sign up/Login (Local storage based) to create a personalized profile.
Dashboard:
Library: Upload new files or select previous projects.
Magic: Click "Generate Magic" to process the file.
Notes: Review the AI-generated study guide.
Quiz: Take the test and get instant feedback.
Stats: View your performance history.
🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.
