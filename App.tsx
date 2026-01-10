import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import { Button, Card, Input, ThemeToggle } from './components/common';
import { AppView, UserProfile } from './types';
import { Brain, Sparkles, ArrowRight, Zap, GraduationCap, ArrowLeft } from 'lucide-react';

export default function App() {
  // Always start with no user and on Landing page, per user request to disable auto-skip.
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.LANDING);
  const [isDark, setIsDark] = useState(false);

  // Toggle Theme Class on Body
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Auth States
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLogin, setIsLogin] = useState(false);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // Check for existing profile in localStorage
      const storageKey = `studyZap_profile_${email}`;
      const savedProfile = localStorage.getItem(storageKey);
      
      let profileToLoad: UserProfile;

      if (savedProfile) {
        // Restore existing user account
        profileToLoad = JSON.parse(savedProfile);
      } else {
        // Create new user account
        profileToLoad = { 
          name: name || email.split('@')[0], 
          email, 
          studyGoal: 'Ace the Finals' 
        };
        localStorage.setItem(storageKey, JSON.stringify(profileToLoad));
      }

      setUser(profileToLoad);
      setCurrentView(AppView.DASHBOARD);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView(AppView.LANDING);
    // Note: We do NOT clear localStorage here, so data persists for next login.
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    // Update the persistent profile storage
    localStorage.setItem(`studyZap_profile_${updatedUser.email}`, JSON.stringify(updatedUser));
  };

  const renderAuth = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-brand-light dark:bg-[#0f0a1e] relative overflow-hidden font-body transition-colors duration-300">
      
      {/* Back to Home Button */}
      <div className="absolute top-6 left-6 z-50">
        <button 
          onClick={() => setCurrentView(AppView.LANDING)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur text-slate-600 dark:text-slate-300 font-bold hover:bg-white dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
        >
          <ArrowLeft size={20} /> Back to Home
        </button>
      </div>

      {/* Theme Toggle Top Right */}
      <div className="absolute top-6 right-6 z-50">
         <ThemeToggle isDark={isDark} toggle={() => setIsDark(!isDark)} />
      </div>

      {/* Decorative Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-brand-purple/20 rounded-full blur-[100px] animate-float"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-yellow/20 rounded-full blur-[100px] animate-float" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-12 z-10 items-center">
        {/* Left Side: Playful Character/Mascot Vibe */}
        <div className="hidden md:flex flex-col items-center text-center space-y-8">
           <div className="relative">
              <div className="absolute inset-0 bg-brand-yellow rounded-full blur-xl opacity-50 animate-pulse"></div>
              <div className="relative w-64 h-64 bg-white dark:bg-slate-800 rounded-full border-8 border-brand-purple flex items-center justify-center shadow-2xl animate-float">
                 <GraduationCap size={120} className="text-brand-purple" />
                 {/* Simple Face */}
                 <div className="absolute top-1/2 left-1/3 w-4 h-4 bg-slate-800 dark:bg-white rounded-full"></div>
                 <div className="absolute top-1/2 right-1/3 w-4 h-4 bg-slate-800 dark:bg-white rounded-full"></div>
                 <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-10 h-5 border-b-4 border-slate-800 dark:border-white rounded-full"></div>
              </div>
           </div>
           
           <div>
             <h1 className="text-5xl font-heading font-extrabold text-slate-900 dark:text-white mb-4">
               Hey there, <br/>
               <span className="text-brand-orange">Genius!</span>
             </h1>
             <p className="text-xl text-slate-600 dark:text-slate-300 font-bold">
               Your customized study plan is just one click away.
             </p>
           </div>
        </div>

        {/* Right Side: Interactive Form */}
        <Card className="w-full max-w-md p-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-4 border-white dark:border-slate-700 shadow-2xl relative overflow-hidden rounded-[3rem]">
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-heading font-bold text-slate-900 dark:text-white mb-2">{isLogin ? 'Welcome Back!' : 'Join the Club'}</h2>
            <div className="h-1 w-20 bg-brand-yellow mx-auto rounded-full"></div>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="animate-pop">
                <Input 
                  label="What should we call you?" 
                  placeholder="e.g. Study Master 3000" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                />
              </div>
            )}
            <Input 
              label="Student Email" 
              type="email" 
              placeholder="you@university.edu" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
            <Input 
              label="Secret Password" 
              type="password" 
              placeholder="••••••••" 
            />
            
            <Button type="submit" variant="primary" className="w-full py-4 text-lg shadow-lg mt-6 group" onClick={() => {}}>
               {isLogin ? 'Let\'s Study' : 'Start Free Trial'} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-slate-500 dark:text-slate-400 font-bold hover:text-brand-purple dark:hover:text-brand-yellow transition-colors"
            >
              {isLogin ? "Need an account? Sign Up" : "Already have an account? Log In"}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );

  return (
    <div className={isDark ? 'dark' : ''}>
      {currentView === AppView.LANDING && (
        <LandingPage onGetStarted={() => setCurrentView(AppView.AUTH)} />
      )}
      
      {currentView === AppView.AUTH && renderAuth()}
      
      {currentView === AppView.DASHBOARD && user && (
        <Dashboard 
          user={user} 
          isDark={isDark}
          toggleTheme={() => setIsDark(!isDark)}
          onLogout={handleLogout}
          onHome={() => setCurrentView(AppView.LANDING)}
          onUpdateUser={handleUpdateUser}
        />
      )}
    </div>
  );
}