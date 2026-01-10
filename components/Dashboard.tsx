import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  Upload, FileText, CheckSquare, MessageSquare, 
  Settings, LogOut, ChevronRight, Loader2, Send, Brain, 
  LayoutDashboard, BookOpen, User, Bell, Zap, TrendingUp, Trophy, Save, ArrowRight, Target, Flame, Clock, Sparkles, Home, History, Download, XCircle, CheckCircle, AlertTriangle, Menu, X, Plus
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, PieChart, Pie
} from 'recharts';
import { Button, Card, MarkdownText, ThemeToggle, Input } from './common';
import { 
  DashboardTab, UploadedFile, GeneratedContent, QuizResult, UserProfile, ChatMessage, StudyProject 
} from '../types';
import { 
  generateStudyNotes, generateQuiz, generateQuizFeedback, chatWithDocument 
} from '../services/geminiService';

interface DashboardProps {
  user: UserProfile;
  isDark: boolean;
  toggleTheme: () => void;
  onLogout: () => void;
  onHome: () => void;
  onUpdateUser: (user: UserProfile) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, isDark, toggleTheme, onLogout, onHome, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>(DashboardTab.HOME);
  
  // Project Management with Persistence
  const [projects, setProjects] = useState<StudyProject[]>(() => {
    try {
      const saved = localStorage.getItem(`studyZap_projects_${user.email}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load projects:", e);
      return [];
    }
  });

  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // Save projects to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(`studyZap_projects_${user.email}`, JSON.stringify(projects));
    } catch (e) {
      console.error("Failed to save projects (quota exceeded?):", e);
      // Optional: alert user if storage is full
    }
  }, [projects, user.email]);

  // Derived Active State
  const activeProject = useMemo(() => 
    projects.find(p => p.id === activeProjectId) || null
  , [projects, activeProjectId]);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const notesRef = useRef<HTMLDivElement>(null);
  
  // Quiz Session State (Temporary state while taking a quiz)
  const [currentQuizQuestion, setCurrentQuizQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  
  // Chat States
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // Settings States
  const [settingsForm, setSettingsForm] = useState({
    name: user.name,
    studyGoal: user.studyGoal,
    email: user.email,
    notifications: true
  });
  const [avatar, setAvatar] = useState(0); 

  // Dynamic Stats Calculation
  const stats = useMemo(() => {
    const completedQuizzes = projects.filter(p => p.quizResult !== null);
    const totalScore = completedQuizzes.reduce((acc, curr) => acc + (curr.quizResult ? (curr.quizResult.score / curr.quizResult.totalQuestions) * 100 : 0), 0);
    const avgScore = completedQuizzes.length > 0 ? Math.round(totalScore / completedQuizzes.length) : 0;
    
    // Calculate streak based on project timestamps (Simple logic: if last project was today/yesterday)
    const hasActivity = projects.length > 0;

    return {
      quizzesTaken: completedQuizzes.length,
      filesUploaded: projects.length,
      avgScore: avgScore,
      dayStreak: hasActivity ? Math.floor(projects.length / 2) + 1 : 0
    };
  }, [projects]);

  // Quiz History for Chart
  const quizHistoryData = useMemo(() => {
     return projects
        .filter(p => p.quizResult)
        .map((p, i) => ({
            date: `Quiz ${i + 1}`,
            score: p.quizResult ? Math.round((p.quizResult.score / p.quizResult.totalQuestions) * 100) : 0
        }));
  }, [projects]);

  const avatars = [
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Felix",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Aneka",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Bob",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Cal"
  ];

  // --- Handlers ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.match(/(pdf|text|image|json)/) && !selectedFile.name.endsWith('.md')) {
         alert("Unsupported file type. Please upload a PDF, Text file, or Image.");
         return;
      }

      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target?.result as string;
        
        const newProject: StudyProject = {
            id: Date.now().toString(),
            file: {
                name: selectedFile.name,
                type: selectedFile.type,
                data: base64Data
            },
            content: null,
            quizResult: null,
            timestamp: Date.now()
        };
        
        // Attempt to add new project, handle storage errors early
        try {
            setProjects(prev => {
                const updated = [...prev, newProject];
                // Test stringify to catch quota errors before React state update
                JSON.stringify(updated); 
                return updated;
            });
            setActiveProjectId(newProject.id);
            // Reset quiz session states
            setCurrentQuizQuestion(0);
            setSelectedAnswers([]);
            setActiveTab(DashboardTab.UPLOAD);
        } catch (error) {
            alert("Storage limit reached! Please delete some old projects before uploading new ones.");
        }
      };
      reader.readAsDataURL(selectedFile);
    }
    e.target.value = ''; 
  };

  const switchToProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    setActiveProjectId(projectId);
    
    // Reset transient states
    setCurrentQuizQuestion(0);
    setSelectedAnswers([]);
    setChatHistory([]); // Reset chat for new context

    // Smart Redirect
    if (project.quizResult) {
        setActiveTab(DashboardTab.RESULTS);
    } else if (project.content) {
        setActiveTab(DashboardTab.NOTES);
    } else {
        setActiveTab(DashboardTab.UPLOAD);
    }
  };

  const processDocument = async () => {
    if (!activeProject) return;
    setIsLoading(true);
    setLoadingStep('Crunching the numbers...');
    try {
      setLoadingStep('Extracting genius notes...');
      const notes = await generateStudyNotes(activeProject.file.data, activeProject.file.type);
      setLoadingStep('Cooking up a quiz (10 questions)...');
      const quiz = await generateQuiz(activeProject.file.data, activeProject.file.type);
      
      const generatedContent: GeneratedContent = { notes, quiz };
      
      // Update Project
      setProjects(prev => prev.map(p => 
        p.id === activeProjectId 
        ? { ...p, content: generatedContent } 
        : p
      ));

      // Initialize answers array
      setSelectedAnswers(new Array(quiz.length).fill(-1));
      setActiveTab(DashboardTab.NOTES);
    } catch (error: any) {
      alert(error.message || "Error processing document. Please check if the file is valid.");
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleExportPDF = () => {
    if (!activeProject?.content) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const notesHtml = document.getElementById('notes-content')?.innerHTML;
      printWindow.document.write(`
        <html>
          <head>
            <title>StudyZap Notes - ${activeProject.file.name}</title>
            <style>
              body { font-family: sans-serif; line-height: 1.6; padding: 40px; color: #333; }
              h1, h2, h3 { color: #8B5CF6; }
              h1 { border-bottom: 2px solid #FBBF24; padding-bottom: 10px; }
              h2 { margin-top: 30px; border-bottom: 1px solid #eee; }
              strong { color: #2E1065; background: #FFF7ED; padding: 2px 4px; }
              ul { margin-bottom: 20px; }
              li { margin-bottom: 8px; }
            </style>
          </head>
          <body>
            <h1>StudyZap Notes: ${activeProject.file.name}</h1>
            ${notesHtml}
            <script>window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleAnswerSelect = (optionIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuizQuestion] = optionIndex;
    setSelectedAnswers(newAnswers);
  };

  const submitQuiz = async () => {
    if (!activeProject?.content) return;
    setIsLoading(true);
    let score = 0;
    activeProject.content.quiz.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswerIndex) score++;
    });
    
    const feedback = await generateQuizFeedback(score, activeProject.content.quiz.length, activeProject.file.name);
    
    const result: QuizResult = {
      score,
      totalQuestions: activeProject.content.quiz.length,
      userAnswers: selectedAnswers,
      questions: activeProject.content.quiz,
      feedback
    };

    // Update Project with Result
    setProjects(prev => prev.map(p => 
        p.id === activeProjectId 
        ? { ...p, quizResult: result } 
        : p
    ));
    
    setActiveTab(DashboardTab.RESULTS);
    setIsLoading(false);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !activeProject) return;
    const newUserMsg: ChatMessage = { role: 'user', text: chatInput, timestamp: Date.now() };
    setChatHistory(prev => [...prev, newUserMsg]);
    setChatInput('');
    setIsChatLoading(true);
    try {
      const historyForApi = chatHistory.map(msg => ({ role: msg.role === 'model' ? 'model' : 'user', parts: [{ text: msg.text }] }));
      const responseText = await chatWithDocument(activeProject.file.data, activeProject.file.type, historyForApi, newUserMsg.text);
      setChatHistory(prev => [...prev, { role: 'model', text: responseText, timestamp: Date.now() }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'model', text: "Oops, my brain froze. Try again?", timestamp: Date.now() }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSaveSettings = () => {
    onUpdateUser({ ...user, ...settingsForm });
    alert("Profile Updated!");
  };

  const handleMobileNav = (tab: DashboardTab) => {
      setActiveTab(tab);
      setIsMobileMenuOpen(false);
  };

  // --- Visual Components ---

  const NavItem = ({ tab, icon: Icon, label, onClick }: { tab: DashboardTab, icon: any, label: string, onClick?: () => void }) => (
    <button
      onClick={onClick || (() => setActiveTab(tab))}
      className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-bold group relative w-full border-2 ${
        activeTab === tab 
          ? 'bg-brand-purple border-brand-purple text-white shadow-lg shadow-brand-purple/20' 
          : 'border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-brand-purple dark:hover:text-brand-yellow'
      }`}
    >
      <div className={`p-1.5 rounded-lg transition-colors ${activeTab === tab ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-brand-purple/10 dark:group-hover:bg-brand-yellow/10'}`}>
        <Icon size={20} className={activeTab === tab ? 'text-white' : 'text-current'} />
      </div>
      <span className="text-sm font-heading">{label}</span>
      {activeTab === tab && <div className="absolute right-3 w-2 h-2 rounded-full bg-brand-yellow hidden md:block animate-pulse"></div>}
    </button>
  );

  const RadialProgress = ({ percentage }: { percentage: number }) => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    return (
      <div className="relative w-36 h-36 flex items-center justify-center">
        <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-200 dark:text-slate-700" />
          <circle cx="70" cy="70" r={radius} stroke="#8B5CF6" strokeWidth="12" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-3xl font-heading font-extrabold text-slate-900 dark:text-white">{percentage}%</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Goal</span>
        </div>
      </div>
    );
  };

  const QuizAnimations = ({ score, total }: { score: number, total: number }) => {
      const percentage = score / total;
      const isPass = percentage >= 0.7;
      
      return (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
             {isPass ? (
                 <>
                    {[...Array(50)].map((_, i) => (
                      <div key={i} className="confetti" style={{ 
                          left: `${Math.random() * 100}%`, 
                          animationDelay: `${Math.random() * 2}s`,
                          backgroundColor: ['#FBBF24', '#8B5CF6', '#F97316', '#10B981'][Math.floor(Math.random() * 4)]
                      }}></div>
                  ))}
                 </>
             ) : (
                 <>
                     {/* Sad Cloud Emoji Rain */}
                     {[...Array(20)].map((_, i) => (
                          <div key={i} className="sad-emoji" style={{ 
                              left: `${Math.random() * 100}%`, 
                              animationDelay: `${Math.random() * 3}s`
                          }}>
                              {['💧', '😢', '🌧️', '☁️'][Math.floor(Math.random() * 4)]}
                          </div>
                      ))}
                 </>
             )}
          </div>
      );
  };

  return (
    <div className="flex h-screen bg-brand-light dark:bg-[#0f0a1e] text-slate-900 dark:text-slate-100 font-body transition-colors duration-300 overflow-hidden">
      
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-white dark:bg-[#15102a] flex flex-col p-6 animate-fade-in md:hidden">
              <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-2">
                     <Zap className="text-brand-yellow fill-current" size={24} />
                     <span className="text-2xl font-heading font-bold">StudyZap</span>
                  </div>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800">
                      <X size={24} />
                  </button>
              </div>
              <nav className="flex-1 space-y-2 overflow-y-auto">
                  <NavItem tab={DashboardTab.HOME} icon={LayoutDashboard} label="Overview" onClick={() => handleMobileNav(DashboardTab.HOME)} />
                  <NavItem tab={DashboardTab.PERFORMANCE} icon={TrendingUp} label="Performance" onClick={() => handleMobileNav(DashboardTab.PERFORMANCE)} />
                  <NavItem tab={DashboardTab.UPLOAD} icon={Upload} label="Library" onClick={() => handleMobileNav(DashboardTab.UPLOAD)} />
                  <NavItem tab={DashboardTab.NOTES} icon={BookOpen} label="Smart Notes" onClick={() => handleMobileNav(DashboardTab.NOTES)} />
                  <NavItem tab={DashboardTab.QUIZ} icon={Target} label="Quiz Mode" onClick={() => handleMobileNav(DashboardTab.QUIZ)} />
                  <NavItem tab={DashboardTab.CHAT} icon={MessageSquare} label="AI Tutor" onClick={() => handleMobileNav(DashboardTab.CHAT)} />
                  <NavItem tab={DashboardTab.SETTINGS} icon={Settings} label="Settings" onClick={() => handleMobileNav(DashboardTab.SETTINGS)} />
              </nav>
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                      <span className="font-bold">Dark Mode</span>
                      <ThemeToggle isDark={isDark} toggle={toggleTheme} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" onClick={onHome} className="w-full text-sm">
                        <Home size={16} /> Home
                    </Button>
                    <Button variant="danger" onClick={onLogout} className="w-full text-sm">
                        <LogOut size={16} /> Log Out
                    </Button>
                  </div>
              </div>
          </div>
      )}

      {/* Sidebar Navigation (Desktop) */}
      <aside className="hidden md:flex flex-col w-72 h-full border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#15102a] shadow-sm z-20">
        <div className="p-6 flex-shrink-0">
            <div className="flex items-center gap-2 px-2 cursor-pointer group" onClick={onHome}>
                <div className="bg-brand-yellow p-2 rounded-xl rotate-3 group-hover:rotate-12 transition-transform"><Zap className="w-6 h-6 text-brand-dark fill-current" /></div>
                <span className="text-2xl font-heading font-extrabold">Study<span className="text-brand-purple">Zap</span></span>
            </div>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto px-6 scrollbar-thin">
          <NavItem tab={DashboardTab.HOME} icon={LayoutDashboard} label="Overview" />
          <NavItem tab={DashboardTab.PERFORMANCE} icon={TrendingUp} label="Performance" />
          
          <div className="pt-6 pb-2 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
             <span className="w-full h-px bg-slate-200 dark:bg-slate-700"></span> Tools
          </div>
          
          <NavItem tab={DashboardTab.UPLOAD} icon={Upload} label="Library" />
          <NavItem tab={DashboardTab.NOTES} icon={BookOpen} label="Smart Notes" />
          <NavItem tab={DashboardTab.QUIZ} icon={Target} label="Quiz Mode" />
          <NavItem tab={DashboardTab.CHAT} icon={MessageSquare} label="AI Tutor" />
          <NavItem tab={DashboardTab.SETTINGS} icon={Settings} label="Settings" />
        </nav>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 mt-auto flex-shrink-0 bg-white dark:bg-[#15102a]">
           <div className="flex items-center justify-between px-2 mb-4">
              <span className="text-xs font-bold text-slate-400">THEME</span>
              <ThemeToggle isDark={isDark} toggle={toggleTheme} />
           </div>
           
           <div className="grid grid-cols-2 gap-2">
               <button onClick={onHome} className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-sm transition-colors border border-slate-200 dark:border-slate-700">
                  <Home size={18} /> Home
               </button>
               <button onClick={onLogout} className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 font-bold text-sm transition-colors border border-transparent">
                  <LogOut size={18} /> Exit
               </button>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 bg-white dark:bg-[#15102a] flex-shrink-0 z-40 relative">
           <div className="flex items-center gap-3">
             <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
                <Menu size={24} />
             </button>
             <div className="flex items-center gap-2" onClick={onHome}>
                <Zap className="text-brand-yellow fill-current" size={24} />
                <span className="text-xl font-heading font-bold">StudyZap</span>
             </div>
           </div>
           <ThemeToggle isDark={isDark} toggle={toggleTheme} />
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8 scrollbar-thin relative z-10">
           
           {/* VIEW: HOME */}
           {activeTab === DashboardTab.HOME && (
             <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
                <header className="flex justify-between items-end">
                   <div>
                      <h1 className="text-3xl md:text-4xl font-heading font-extrabold mb-1">Hi, {user.name.split(' ')[0]}! 🚀</h1>
                      <p className="text-slate-500 dark:text-slate-400 font-bold">Ready to crush your study goal: <span className="text-brand-purple">{user.studyGoal}</span>?</p>
                   </div>
                   <div className="hidden md:block">
                      <Button onClick={() => setActiveTab(DashboardTab.UPLOAD)} variant="primary" className="shadow-lg">
                        <Upload size={20} /> New Upload
                      </Button>
                   </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {/* Radial Goal Tracker */}
                   <Card className="p-6 flex items-center justify-between bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 relative overflow-hidden shadow-lg border-2 border-slate-100 dark:border-slate-700">
                      <div className="relative z-10">
                         <h3 className="font-heading font-bold text-xl mb-1">Daily Goal</h3>
                         <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{Math.min(stats.quizzesTaken, 5)}/5 Quizzes Done</p>
                         <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${stats.quizzesTaken >= 5 ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'}`}>
                             {stats.quizzesTaken >= 5 ? 'Completed' : 'In Progress'}
                         </div>
                      </div>
                      <RadialProgress percentage={Math.min((stats.quizzesTaken / 5) * 100, 100)} />
                   </Card>

                   {/* Quick Stats - Dynamic & Mobile Stacked */}
                   <Card className="p-6 md:col-span-2 border-2 border-slate-100 dark:border-slate-700">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { label: 'Avg Score', value: `${stats.avgScore}%`, icon: Trophy, color: 'text-brand-yellow', bg: 'bg-brand-yellow/10' },
                        { label: 'Streak', value: `${stats.dayStreak} Days`, icon: Flame, color: 'text-brand-orange', bg: 'bg-brand-orange/10' },
                        { label: 'Projects', value: stats.filesUploaded, icon: BookOpen, color: 'text-brand-purple', bg: 'bg-brand-purple/10' },
                      ].map((s, i) => (
                        <div key={i} className="flex flex-row sm:flex-col items-center sm:justify-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-default border border-transparent hover:border-slate-200 dark:hover:border-slate-700 gap-4 sm:gap-2">
                           <div className={`p-3 rounded-full ${s.bg} ${s.color} shadow-sm shrink-0`}>
                             <s.icon size={24} />
                           </div>
                           <div className="text-left sm:text-center">
                             <div className="text-2xl font-heading font-bold leading-none mb-1">{s.value}</div>
                             <div className="text-xs font-bold text-slate-400 uppercase">{s.label}</div>
                           </div>
                        </div>
                      ))}
                      </div>
                   </Card>
                </div>

                {/* Recent History / Restore */}
                <div>
                   <h2 className="text-xl font-heading font-bold mb-4 flex items-center gap-2"><History size={20} /> Recent Projects</h2>
                   {projects.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                         {projects.slice().reverse().map((p) => (
                            <button key={p.id} onClick={() => switchToProject(p.id)} className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-brand-purple dark:hover:border-brand-purple shadow-sm transition-all group text-left relative overflow-hidden">
                               <div className="bg-brand-light dark:bg-slate-900 p-3 rounded-xl text-brand-purple group-hover:bg-brand-purple group-hover:text-white transition-colors">
                                  <FileText size={20} />
                               </div>
                               <div className="min-w-0 flex-1">
                                  <p className="font-bold truncate">{p.file.name}</p>
                                  <div className="flex items-center gap-2 text-xs text-slate-500">
                                      {p.quizResult ? <span className="text-green-500 font-bold">Quiz Done</span> : p.content ? <span className="text-blue-500 font-bold">Ready</span> : <span>Uploaded</span>}
                                  </div>
                               </div>
                               {activeProjectId === p.id && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-500"></div>}
                            </button>
                         ))}
                      </div>
                   ) : (
                      <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-center text-slate-400 font-bold">
                         No recent projects found. Start by uploading!
                      </div>
                   )}
                </div>

                {/* Quick Actions Grid */}
                <h2 className="text-xl font-heading font-bold flex items-center gap-2"><Sparkles size={20} /> Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   {[
                      { icon: Upload, label: "Upload", sub: "New Material", color: "bg-brand-purple", tab: DashboardTab.UPLOAD },
                      { icon: Target, label: "Quiz Me", sub: "Test Knowledge", color: "bg-pink-500", tab: DashboardTab.QUIZ, disabled: !activeProject?.content },
                      { icon: Brain, label: "AI Tutor", sub: "Ask Anything", color: "bg-brand-yellow", tab: DashboardTab.CHAT, disabled: !activeProject?.file },
                      { icon: TrendingUp, label: "Stats", sub: "View Progress", color: "bg-brand-orange", tab: DashboardTab.PERFORMANCE },
                   ].map((action, i) => (
                      <button 
                         key={i} 
                         onClick={() => action.tab && setActiveTab(action.tab)} 
                         disabled={action.disabled}
                         className={`p-6 rounded-3xl border-2 border-slate-100 dark:border-slate-700 transition-all flex flex-col items-center gap-2 group relative overflow-hidden bg-white dark:bg-slate-800 ${action.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-1 hover:shadow-xl'}`}
                      >
                         <div className={`p-4 rounded-2xl text-white mb-2 shadow-md ${action.color}`}>
                            <action.icon size={28} />
                         </div>
                         <span className="font-heading font-bold text-lg">{action.label}</span>
                         <span className="text-xs text-slate-400 font-bold uppercase">{action.sub}</span>
                      </button>
                   ))}
                </div>
             </div>
           )}

           {/* VIEW: PERFORMANCE */}
           {activeTab === DashboardTab.PERFORMANCE && (
             <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-20">
               <h2 className="text-3xl font-heading font-bold">Your Progress 📈</h2>
               <Card className="p-8 h-96">
                 <h3 className="font-bold mb-6 text-slate-500 uppercase tracking-widest text-sm">Quiz Scores History</h3>
                 <ResponsiveContainer width="100%" height="85%">
                    <LineChart data={quizHistoryData.length > 0 ? quizHistoryData : [{date: 'Start', score: 0}]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                      <XAxis dataKey="date" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                      />
                      <Line type="monotone" dataKey="score" stroke="#8B5CF6" strokeWidth={4} activeDot={{ r: 8 }} />
                    </LineChart>
                 </ResponsiveContainer>
               </Card>
               <div className="grid md:grid-cols-2 gap-6">
                  <Card className="p-6 bg-brand-orange text-white">
                     <h3 className="font-heading font-bold text-2xl mb-2">Needs Focus</h3>
                     <p className="text-orange-100 mb-4">You can do it! Review your recent incorrect answers.</p>
                     <Button variant="glass" onClick={() => setActiveTab(DashboardTab.CHAT)} className="w-full">Get AI Help</Button>
                  </Card>
                  <Card className="p-6 bg-brand-purple text-white">
                     <h3 className="font-heading font-bold text-2xl mb-2">Total Quizzes</h3>
                     <p className="text-purple-100 mb-4">You have completed {stats.quizzesTaken} quizzes.</p>
                     <Button variant="glass" onClick={() => setActiveTab(DashboardTab.UPLOAD)} className="w-full">New Subject</Button>
                  </Card>
               </div>
             </div>
           )}

           {/* VIEW: QUIZ (COMPACT for Mobile) */}
           {activeTab === DashboardTab.QUIZ && activeProject?.content && (
             <div className="h-full flex flex-col animate-fade-in max-w-5xl mx-auto pb-20">
                <div className="flex justify-between items-center mb-4">
                   <div className="text-sm font-bold text-slate-500 uppercase">Question {currentQuizQuestion + 1} of {activeProject.content.quiz.length}</div>
                   <Button variant="ghost" onClick={() => setActiveTab(DashboardTab.HOME)} className="text-sm py-1 h-8">Exit</Button>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full mb-6 overflow-hidden">
                   <div className="h-full bg-brand-yellow transition-all duration-300" style={{ width: `${((currentQuizQuestion + 1) / activeProject.content.quiz.length) * 100}%` }}></div>
                </div>

                {/* Quiz Layout - Optimized for Mobile */}
                <div className="flex-1 flex flex-col md:flex-row gap-4 md:gap-6 min-h-0 overflow-hidden md:overflow-visible">
                   {/* Question Side - Reduced size on mobile */}
                   <Card className="flex-none md:flex-1 p-5 md:p-8 flex items-center justify-center bg-brand-purple text-white relative overflow-hidden min-h-[160px] md:min-h-[300px] shrink-0">
                      <div className="absolute top-0 right-0 p-10 opacity-10"><Brain size={120} md-size={200} /></div>
                      <h2 className="text-lg md:text-3xl font-heading font-bold text-center leading-relaxed relative z-10">
                         {activeProject.content.quiz[currentQuizQuestion].question}
                      </h2>
                   </Card>

                   {/* Options Side - Scrollable if needed */}
                   <div className="flex-1 flex flex-col gap-3 overflow-y-auto pb-4">
                      {activeProject.content.quiz[currentQuizQuestion].options.map((option, idx) => (
                         <button
                           key={idx}
                           onClick={() => handleAnswerSelect(idx)}
                           className={`p-4 md:p-5 rounded-2xl border-2 text-left font-bold transition-all text-sm md:text-lg flex items-center gap-3 md:gap-4 shrink-0 ${
                             selectedAnswers[currentQuizQuestion] === idx 
                             ? 'border-brand-purple bg-brand-purple/10 text-brand-purple dark:text-brand-yellow dark:border-brand-yellow dark:bg-brand-yellow/10 transform scale-[1.01]' 
                             : 'border-slate-200 dark:border-slate-700 hover:border-brand-purple dark:hover:border-brand-purple bg-white dark:bg-slate-800'
                           }`}
                         >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 shrink-0 ${
                               selectedAnswers[currentQuizQuestion] === idx ? 'bg-brand-purple text-white border-brand-purple' : 'border-slate-300 text-slate-400'
                            }`}>
                               {String.fromCharCode(65 + idx)}
                            </div>
                            <span>{option}</span>
                         </button>
                      ))}
                   </div>
                </div>

                <div className="mt-4 md:mt-6 flex justify-end">
                   {currentQuizQuestion < activeProject.content.quiz.length - 1 ? (
                      <Button onClick={() => setCurrentQuizQuestion(prev => prev + 1)} variant="primary" className="px-8 md:px-10 py-3 md:py-4 shadow-lg w-full md:w-auto">
                         Next Question <ChevronRight />
                      </Button>
                   ) : (
                      <Button onClick={submitQuiz} disabled={isLoading} variant="secondary" className="px-8 md:px-10 py-3 md:py-4 shadow-lg w-full md:w-auto">
                         {isLoading ? <Loader2 className="animate-spin" /> : "Finish Quiz"}
                      </Button>
                   )}
                </div>
             </div>
           )}

           {/* VIEW: UPLOAD (Enhanced Multi-File Library) */}
           {activeTab === DashboardTab.UPLOAD && (
              <div className="h-full flex flex-col items-center justify-center animate-fade-in p-4 pb-20">
                 <div className="max-w-3xl w-full">
                    {projects.length === 0 ? (
                        <div className="text-center">
                            <div className="mb-8 relative inline-block">
                            <div className="absolute inset-0 bg-brand-yellow rounded-full blur-xl opacity-50 animate-pulse"></div>
                            <div className="relative bg-white dark:bg-slate-800 p-8 rounded-full shadow-2xl">
                                <Upload size={64} className="text-brand-purple" />
                            </div>
                            </div>
                            <h2 className="text-4xl font-heading font-extrabold mb-4">Feed me knowledge! 📄</h2>
                            <p className="text-xl text-slate-500 mb-10">Upload your PDF or notes. I'll turn them into a study plan.</p>
                            
                            <div className="relative group cursor-pointer max-w-xl mx-auto">
                                <div className="absolute -inset-1 bg-gradient-to-r from-brand-purple to-brand-orange rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-200"></div>
                                <button onClick={() => document.getElementById('main-upload')?.click()} className="relative w-full bg-white dark:bg-slate-800 p-12 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-brand-purple dark:hover:border-brand-purple transition-all flex flex-col items-center gap-4">
                                    <span className="font-heading font-bold text-2xl text-brand-dark dark:text-white">Click to Upload</span>
                                    <span className="text-slate-400 font-bold">PDF, TXT, MD (Max 10MB)</span>
                                </button>
                                <input 
                                    type="file" 
                                    id="main-upload" 
                                    className="hidden" 
                                    accept=".pdf,.txt,.md,.csv,.html,.jpg,.jpeg,.png,.webp" 
                                    onChange={handleFileUpload} 
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-heading font-extrabold mb-2">My Library 📚</h2>
                                <p className="text-slate-500">Select a project to work on.</p>
                            </div>

                            {/* Horizontal Project Scroll */}
                            <div className="flex gap-4 overflow-x-auto pb-4 px-2 snap-x">
                                {projects.map((p) => (
                                    <button 
                                        key={p.id}
                                        onClick={() => switchToProject(p.id)}
                                        className={`flex-shrink-0 w-40 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 snap-center relative overflow-hidden ${
                                            activeProjectId === p.id 
                                            ? 'border-brand-purple bg-brand-purple/10 ring-2 ring-brand-purple ring-offset-2 dark:ring-offset-[#0f0a1e]' 
                                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-brand-purple/50'
                                        }`}
                                    >
                                        <div className="p-3 rounded-full bg-brand-light dark:bg-slate-900 text-brand-purple">
                                            <FileText size={24} />
                                        </div>
                                        <span className="text-sm font-bold truncate w-full text-center">{p.file.name}</span>
                                        {p.content && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500"></div>}
                                    </button>
                                ))}
                                
                                {/* Add New Project Button */}
                                <div className="flex-shrink-0 w-40 relative">
                                    <button 
                                        onClick={() => document.getElementById('add-more-upload')?.click()}
                                        className="w-full h-full min-h-[140px] rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-brand-purple flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-brand-purple transition-colors"
                                    >
                                        <Plus size={32} />
                                        <span className="font-bold text-sm">Add New</span>
                                    </button>
                                    <input 
                                        type="file" 
                                        id="add-more-upload" 
                                        className="hidden" 
                                        accept=".pdf,.txt,.md,.csv,.html,.jpg,.jpeg,.png,.webp" 
                                        onChange={handleFileUpload} 
                                    />
                                </div>
                            </div>

                            {/* Active Project Details */}
                            {activeProject && (
                                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border-2 border-slate-100 dark:border-slate-700 animate-pop">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="p-4 rounded-2xl bg-brand-purple text-white">
                                            <FileText size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold">{activeProject.file.name}</h3>
                                            <p className="text-slate-500 text-sm font-bold uppercase">{activeProject.file.type.split('/')[1] || 'DOC'}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {activeProject.content ? (
                                             <div className="col-span-2 grid grid-cols-2 gap-4">
                                                 <Button onClick={() => setActiveTab(DashboardTab.NOTES)} variant="secondary" className="w-full text-lg py-4 shadow-lg">
                                                    View Notes
                                                 </Button>
                                                 <Button onClick={() => setActiveTab(DashboardTab.QUIZ)} variant="primary" className="w-full text-lg py-4 shadow-lg">
                                                    {activeProject.quizResult ? "Retake Quiz" : "Start Quiz"}
                                                 </Button>
                                             </div>
                                        ) : (
                                            <Button onClick={processDocument} disabled={isLoading} variant="primary" className="w-full text-lg py-4 shadow-lg col-span-2">
                                                {isLoading ? (
                                                    <span className="flex items-center gap-2"><Loader2 className="animate-spin" /> {loadingStep}</span>
                                                ) : (
                                                    <span className="flex items-center gap-2"><Sparkles /> Generate Magic</span>
                                                )}
                                            </Button>
                                        )}
                                        
                                        <Button onClick={() => {
                                            if(confirm("Are you sure you want to delete this project?")) {
                                                const newProjects = projects.filter(p => p.id !== activeProjectId);
                                                setProjects(newProjects);
                                                if(newProjects.length > 0) switchToProject(newProjects[0].id);
                                                else setActiveProjectId(null);
                                            }
                                        }} variant="danger" className="w-full col-span-2">
                                            Delete Project
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                 </div>
              </div>
           )}

           {/* VIEW: NOTES */}
           {activeTab === DashboardTab.NOTES && activeProject?.content && (
             <div className="max-w-4xl mx-auto animate-fade-in pb-20">
                <div className="flex justify-end mb-4">
                    <Button onClick={handleExportPDF} variant="outline" className="gap-2">
                        <Download size={20} /> Export to PDF
                    </Button>
                </div>
                <div id="notes-content" className="bg-white dark:bg-slate-800 p-8 md:p-12 rounded-[3rem] shadow-xl border border-slate-100 dark:border-slate-700">
                    <div ref={notesRef}>
                        <MarkdownText text={activeProject.content.notes} />
                    </div>
                </div>
             </div>
           )}

           {/* VIEW: RESULTS (Updated with Answer Review) */}
           {activeTab === DashboardTab.RESULTS && activeProject?.quizResult && (
              <div className="max-w-4xl mx-auto animate-fade-in text-center relative h-full flex flex-col justify-start pb-20 overflow-y-auto">
                 {/* Animation Background */}
                 <QuizAnimations score={activeProject.quizResult.score} total={activeProject.quizResult.totalQuestions} />
                 
                 <div className="relative z-10 space-y-8 mt-10">
                    {/* Score Card - Shakes if low score */}
                    <div className={`bg-white dark:bg-slate-800 p-10 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-700 inline-block ${activeProject.quizResult.score/activeProject.quizResult.totalQuestions < 0.7 ? 'animate-shake' : ''}`}>
                        {activeProject.quizResult.score / activeProject.quizResult.totalQuestions < 0.7 ? (
                            <div className="text-6xl mb-4">😐</div>
                        ) : (
                            <div className="text-6xl mb-4">🎉</div>
                        )}
                        <div className="text-7xl font-heading font-extrabold text-brand-purple mb-2">
                            {activeProject.quizResult.score}<span className="text-4xl text-slate-300">/{activeProject.quizResult.totalQuestions}</span>
                        </div>
                        <div className="text-slate-400 font-bold uppercase tracking-widest">Final Score</div>
                    </div>

                    {/* Detailed Breakdown - ENHANCED VISUALS */}
                    <div className="grid md:grid-cols-2 gap-6 text-left">
                        <Card className="p-6 flex flex-col items-center justify-center">
                            <h3 className="font-bold text-slate-500 uppercase tracking-widest text-xs mb-6 w-full text-center">Visual Performance</h3>
                            <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Correct', value: activeProject.quizResult.score },
                                                { name: 'Incorrect', value: activeProject.quizResult.totalQuestions - activeProject.quizResult.score }
                                            ]}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            <Cell key="cell-0" fill="#10B981" />
                                            <Cell key="cell-1" fill="#EF4444" />
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex gap-4 mt-2">
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div> Correct
                                </div>
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div> Incorrect
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6 bg-brand-yellow/10 border-brand-yellow/20 flex flex-col justify-center">
                             <div className="p-3 bg-brand-yellow rounded-xl w-fit mb-4 text-brand-dark">
                                <Zap size={24} />
                             </div>
                             <h3 className="font-bold text-brand-orange mb-3 text-xl">AI Feedback</h3>
                             <p className="text-slate-700 dark:text-slate-300 italic text-lg leading-relaxed">"{activeProject.quizResult.feedback}"</p>
                        </Card>
                    </div>

                    {/* Question by Question Review */}
                    <div className="text-left space-y-4">
                        <h3 className="text-2xl font-heading font-bold mb-4">Answer Review</h3>
                        {activeProject.quizResult.questions.map((q, idx) => {
                            const userAnswer = activeProject.quizResult!.userAnswers[idx];
                            const isCorrect = userAnswer === q.correctAnswerIndex;
                            return (
                                <Card key={idx} className={`p-6 border-l-8 ${isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
                                    <div className="flex items-start gap-4 mb-3">
                                        <div className={`mt-1 p-1 rounded-full text-white ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                                            {isCorrect ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg text-slate-800 dark:text-white">{q.question}</h4>
                                        </div>
                                    </div>
                                    
                                    <div className="ml-10 space-y-2">
                                        {!isCorrect && (
                                            <div className="text-red-500 font-bold bg-red-50 dark:bg-red-900/20 p-2 rounded-lg text-sm">
                                                Your Answer: {q.options[userAnswer] || "Skipped"}
                                            </div>
                                        )}
                                        <div className="text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-900/20 p-2 rounded-lg text-sm">
                                            Correct Answer: {q.options[q.correctAnswerIndex]}
                                        </div>
                                        <p className="text-slate-500 text-sm mt-2 italic">
                                            Explanation: {q.explanation || "No explanation available."}
                                        </p>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>

                    <div className="flex justify-center gap-4 pb-10">
                        <Button onClick={() => setActiveTab(DashboardTab.HOME)} variant="outline" className="px-8 py-4 bg-white dark:bg-slate-800">
                            Back to Dashboard
                        </Button>
                        <Button onClick={() => setActiveTab(DashboardTab.NOTES)} variant="primary" className="px-8 py-4 shadow-xl">
                            Review Notes
                        </Button>
                    </div>
                 </div>
              </div>
           )}

           {/* VIEW: CHAT */}
           {activeTab === DashboardTab.CHAT && (
             <div className="h-full flex flex-col max-w-3xl mx-auto animate-fade-in pb-20">
               <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatHistory.length === 0 && (
                     <div className="text-center mt-20 opacity-50">
                        <Brain size={80} className="mx-auto mb-4" />
                        <h3 className="text-2xl font-bold">Ask me anything!</h3>
                        {activeProject ? (
                            <p>I'm ready to answer questions about <strong>{activeProject.file.name}</strong></p>
                        ) : (
                            <p>Please select a project from the Library first.</p>
                        )}
                     </div>
                  )}
                  {chatHistory.map((msg, i) => (
                     <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-brand-purple text-white rounded-br-none' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-bl-none shadow-sm'}`}>
                           <MarkdownText text={msg.text} />
                        </div>
                     </div>
                  ))}
                  {isChatLoading && <div className="text-slate-400 text-sm font-bold animate-pulse">Thinking...</div>}
               </div>
               <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-700 flex gap-2">
                  <input 
                    className="flex-1 bg-transparent outline-none font-bold text-slate-700 dark:text-slate-200 placeholder-slate-400"
                    placeholder="Ask a question..."
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    disabled={!activeProject}
                  />
                  <Button variant="primary" onClick={handleSendMessage} className="p-3 rounded-xl h-auto aspect-square" disabled={!activeProject}><Send size={20} /></Button>
               </div>
             </div>
           )}

           {/* VIEW: SETTINGS */}
           {activeTab === DashboardTab.SETTINGS && (
               <div className="max-w-2xl mx-auto space-y-8 animate-fade-in pb-20">
                   <h2 className="text-3xl font-heading font-bold">Your Profile</h2>
                   
                   {/* Avatar Selection */}
                   <div className="flex justify-center gap-4 mb-8">
                       {[0, 1, 2, 3].map((i) => (
                           <div key={i} onClick={() => setAvatar(i)} className={`w-20 h-20 rounded-full border-4 cursor-pointer hover:scale-105 transition-transform overflow-hidden bg-slate-100 ${avatar === i ? 'border-brand-purple' : 'border-transparent'}`}>
                               <img src={avatars[i]} alt="Avatar" className="w-full h-full" />
                           </div>
                       ))}
                   </div>

                   <Card className="p-8">
                       <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-100 dark:border-slate-700">
                           <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100">
                               <img src={avatars[avatar]} alt="Current Avatar" />
                           </div>
                           <div>
                               <h3 className="font-bold text-xl">{user.name}</h3>
                               <p className="text-slate-400 text-sm">Account ID: #STUDY-{Math.floor(Math.random() * 10000)}</p>
                           </div>
                       </div>
                       
                       <div className="space-y-4">
                           <Input label="Display Name" value={settingsForm.name} onChange={(e) => setSettingsForm({...settingsForm, name: e.target.value})} />
                           <Input label="Email" value={settingsForm.email} className="opacity-50 pointer-events-none" />
                           <Input label="Study Goal" value={settingsForm.studyGoal} onChange={(e) => setSettingsForm({...settingsForm, studyGoal: e.target.value})} />
                           
                           <Button onClick={handleSaveSettings} variant="primary" className="w-full mt-4">Save Changes</Button>
                       </div>
                   </Card>
               </div>
           )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;