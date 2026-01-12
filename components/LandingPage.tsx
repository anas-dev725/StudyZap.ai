import React, { useEffect, useState, useRef } from 'react';
import { Button, ThemeToggle } from './common';
import { BookOpen, Brain, Zap, CheckCircle, ArrowRight, Star, Upload, Trophy, PlayCircle, ChevronDown, Smile, Frown, Sparkles, TrendingUp, Users, Laptop, Coffee, Music, Gamepad2, Quote } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  isDark: boolean;
  toggleTheme: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, isDark, toggleTheme }) => {
  const [visibleSteps, setVisibleSteps] = useState<number[]>([]);
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            setVisibleSteps((prev) => Array.from(new Set([...prev, index])));
          }
        });
      },
      { threshold: 0.2 }
    );

    stepsRef.current.forEach((step) => {
      if (step) observer.observe(step);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-body overflow-x-hidden bg-brand-light dark:bg-[#0f0a1e] transition-colors duration-300">
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/70 dark:bg-[#0f0a1e]/80 backdrop-blur-lg z-50 border-b border-slate-200 dark:border-white/5 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="bg-brand-yellow p-2 rounded-xl rotate-3 group-hover:rotate-12 transition-transform duration-300">
              <Zap className="w-6 h-6 text-brand-dark fill-current" />
            </div>
            <span className="text-2xl font-heading font-bold text-slate-900 dark:text-white">Study<span className="text-brand-purple">Zap</span></span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-bold text-slate-600 dark:text-slate-300 items-center">
              <button onClick={() => scrollToSection('features')} className="hover:text-brand-purple transition-all hover:scale-105">Features</button>
              <button onClick={() => scrollToSection('how-it-works')} className="hover:text-brand-purple transition-all hover:scale-105">How it Works</button>
              <button onClick={() => scrollToSection('testimonials')} className="hover:text-brand-purple transition-all hover:scale-105">Stories</button>
          </div>
          <div className="flex gap-4 items-center">
              <ThemeToggle isDark={isDark} toggle={toggleTheme} />
              <Button onClick={onGetStarted} variant="ghost" className="hidden sm:flex font-bold hover:bg-slate-200 dark:hover:bg-slate-800">Log in</Button>
              <Button onClick={onGetStarted} variant="primary" className="shadow-[0_4px_0_rgb(109,40,217)] hover:shadow-[0_6px_0_rgb(109,40,217)] hover:-translate-y-1 transition-all">Get Started</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section (Centered & Playful) */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
         {/* Creative Floating Icons Background */}
         <div className="absolute top-20 left-10 animate-float opacity-10 dark:opacity-5 text-brand-purple"><Brain size={120} /></div>
         <div className="absolute bottom-40 right-10 animate-float opacity-10 dark:opacity-5 text-brand-yellow" style={{animationDelay: '1s'}}><BookOpen size={140} /></div>
         <div className="absolute top-40 right-[20%] animate-float opacity-10 dark:opacity-5 text-brand-orange" style={{animationDelay: '2s'}}><Coffee size={80} /></div>
         <div className="absolute bottom-20 left-[20%] animate-float opacity-10 dark:opacity-5 text-brand-purple" style={{animationDelay: '3s'}}><Gamepad2 size={90} /></div>
         <div className="absolute top-32 left-[30%] animate-float opacity-5 dark:opacity-5 text-slate-400" style={{animationDelay: '1.5s'}}><Laptop size={60} /></div>

         <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-block bg-white dark:bg-white/5 border-2 border-brand-purple px-6 py-2 rounded-full mb-8 shadow-[0_4px_0_rgb(139,92,246)] transform -rotate-1 hover:rotate-0 transition-transform cursor-default">
               <span className="font-heading font-bold text-brand-purple dark:text-brand-yellow flex items-center gap-2">
                 <Sparkles size={18} /> For Students, By Students (and AI)
               </span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-heading font-extrabold text-slate-900 dark:text-white leading-[1.1] mb-8 tracking-tight">
               Don't Panic.<br/>
               Just <span className="text-brand-purple underline decoration-brand-yellow decoration-wavy decoration-4">Zap It.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-bold mb-10 leading-relaxed">
               Turn those 300-page boring PDFs into fun quizzes and smart notes in seconds. <br className="hidden md:block" /> Study smarter, not harder.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
               <Button onClick={onGetStarted} variant="secondary" className="px-10 py-5 text-xl rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105">
                  Try It For Free <ArrowRight size={24} />
               </Button>
            </div>
         </div>
      </section>

      {/* Story / Problem Section */}
      <section className="py-24 bg-white dark:bg-[#1e1b4b] border-y-4 border-slate-100 dark:border-slate-800">
         <div className="max-w-6xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-16 items-center">
               <div className="relative group">
                  <div className="absolute inset-0 bg-brand-yellow rounded-[3rem] rotate-3 opacity-20 group-hover:rotate-6 transition-transform duration-500"></div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-8 rounded-[3rem] relative border-4 border-white dark:border-slate-700 shadow-xl group-hover:-translate-y-2 transition-transform duration-300">
                     <div className="flex items-start gap-4 mb-6">
                        <div className="bg-rose-100 p-3 rounded-full"><Frown size={32} className="text-rose-500" /></div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl rounded-tl-none shadow-sm flex-1">
                           <p className="font-bold text-slate-700 dark:text-slate-200">"It's 2 AM. I have a Biology final tomorrow. The slides are 200 pages long. I am doomed."</p>
                        </div>
                     </div>
                     <div className="flex items-start gap-4 flex-row-reverse">
                         <div className="bg-brand-purple/20 p-3 rounded-full"><Smile size={32} className="text-brand-purple" /></div>
                         <div className="bg-brand-purple p-4 rounded-2xl rounded-tr-none shadow-sm flex-1 text-white">
                            <p className="font-bold">"Relax! Upload the PDF to StudyZap. It'll make a quiz and summary in 10 seconds."</p>
                         </div>
                     </div>
                  </div>
               </div>
               
               <div>
                  <h2 className="text-4xl md:text-5xl font-heading font-extrabold text-slate-900 dark:text-white mb-6">
                     We've all been there. <br/>
                     <span className="text-brand-orange">It sucks.</span>
                  </h2>
                  <p className="text-xl text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-6">
                     Rereading textbooks is the <strong>least effective</strong> way to study. Yet, it's what everyone does because creating flashcards and quizzes takes forever.
                  </p>
                  <p className="text-xl text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                     StudyZap solves the "I don't have time to prep" problem. We automate the boring stuff so you can focus on the learning stuff.
                  </p>
               </div>
            </div>
         </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 bg-brand-light dark:bg-[#0f0a1e]">
         <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
               <h2 className="text-4xl font-heading font-extrabold text-slate-900 dark:text-white mb-4">What's in the box?</h2>
               <p className="text-xl text-slate-500 dark:text-slate-400 font-bold">Everything you need to get an A (without crying).</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
               {[
                  { title: "Instant Notes", icon: BookOpen, color: "bg-brand-purple", desc: "We strip out the fluff and give you the key concepts, executive summaries, and examples." },
                  { title: "Quiz Generator", icon: Zap, color: "bg-brand-yellow", desc: "Test yourself immediately. Our AI creates exam-style questions from your exact material." },
                  { title: "Performance Tracker", icon: Trophy, color: "bg-brand-orange", desc: "See where you're weak. We track your progress so you know exactly what to review." }
               ].map((f, i) => (
                  <div key={i} className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border-4 border-slate-100 dark:border-slate-700 hover:border-brand-purple dark:hover:border-brand-purple transition-all hover:-translate-y-2 shadow-lg group cursor-default">
                     <div className={`w-16 h-16 ${f.color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-md rotate-3 group-hover:rotate-12 transition-transform`}>
                        <f.icon size={32} />
                     </div>
                     <h3 className="text-2xl font-heading font-bold text-slate-900 dark:text-white mb-3">{f.title}</h3>
                     <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{f.desc}</p>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* Step by Step (Visualized with Scroll Reveal) */}
      <section id="how-it-works" className="py-24 px-6 bg-white dark:bg-[#1e1b4b] overflow-hidden">
         <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-heading font-extrabold text-center text-slate-900 dark:text-white mb-16">How to become a genius</h2>
            
            <div className="space-y-8 relative">
               {/* Vertical Line with Animation */}
               <div className="absolute left-8 top-0 bottom-0 w-1 bg-slate-200 dark:bg-slate-700 hidden md:block overflow-hidden rounded-full">
                   <div className="w-full h-full bg-brand-purple animate-float"></div>
               </div>

               {[
                  { step: "1", title: "Upload your boring doc", desc: "PDF, PowerPoint, Word - whatever your professor threw at you.", icon: Upload },
                  { step: "2", title: "Wait approx. 5 seconds", desc: "Our AI reads it faster than you can blink and extracts the gold.", icon: Sparkles },
                  { step: "3", title: "Quiz yourself", desc: "Play the generated quiz. Get instant feedback. Feel smart.", icon: Trophy }
               ].map((s, i) => (
                  <div 
                    key={i} 
                    data-index={i}
                    /* Fix: Use block body to return void for ref callback to satisfy TypeScript strict types */
                    ref={(el) => { stepsRef.current[i] = el; }}
                    className={`flex gap-8 items-start relative group transition-all duration-1000 transform ${visibleSteps.includes(i) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}
                  >
                     <div className="w-16 h-16 bg-brand-yellow border-4 border-white dark:border-slate-800 rounded-full flex items-center justify-center font-heading font-bold text-2xl text-brand-dark shadow-lg z-10 shrink-0 group-hover:scale-110 transition-transform">
                        {s.step}
                     </div>
                     <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-3xl flex-1 border-2 border-slate-100 dark:border-slate-700 group-hover:border-brand-purple dark:group-hover:border-brand-purple transition-all shadow-sm group-hover:shadow-lg">
                        <div className="flex items-center gap-4 mb-2">
                            <s.icon className="text-brand-purple" size={24} />
                            <h3 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">{s.title}</h3>
                        </div>
                        <p className="text-lg text-slate-600 dark:text-slate-300">{s.desc}</p>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* Real Testimonials Section (Updated & Authentic) */}
      <section id="testimonials" className="py-24 px-6 bg-brand-light dark:bg-[#0f0a1e]">
          <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                  <h2 className="text-4xl font-heading font-extrabold text-slate-900 dark:text-white mb-4">Straight from the A+ students</h2>
                  <p className="text-xl text-slate-500 dark:text-slate-400 font-bold">Don't just take our word for it.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                  {[
                      { name: "Alex R.", role: "Biology Major", quote: "I used to drown in PDFs. StudyZap's summaries let me grasp the core concepts in minutes. It feels like cheating, but it's just smart.", color: "bg-blue-100 text-blue-800" },
                      { name: "Sarah K.", role: "Law Student", quote: "The quizzes are legitimately good. They found the exact weak spots in my knowledge before the real exam did.", color: "bg-green-100 text-green-800" },
                      { name: "Mike T.", role: "History Buff", quote: "Honest review: I passed my History final because of the exam cheatsheet feature. It highlighted exactly what the prof asked.", color: "bg-purple-100 text-purple-800" },
                  ].map((t, i) => (
                      <div key={i} className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border-2 border-slate-100 dark:border-slate-700 shadow-lg relative hover:scale-105 hover:shadow-2xl hover:border-brand-purple dark:hover:border-brand-purple transition-all duration-300">
                          <Quote className="absolute top-8 right-8 text-slate-200 dark:text-slate-700" size={40} />
                          <p className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-6 relative z-10">"{t.quote}"</p>
                          <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${t.color}`}>
                                  {t.name[0]}
                              </div>
                              <div>
                                  <div className="font-heading font-bold text-slate-900 dark:text-white">{t.name}</div>
                                  <div className="text-sm text-slate-500 font-bold">{t.role}</div>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-6">
         <div className="max-w-5xl mx-auto bg-brand-purple rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-brand-purple/40">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            
            <div className="relative z-10">
               <h2 className="text-4xl md:text-6xl font-heading font-extrabold text-white mb-6">Stop procrastination now.</h2>
               <p className="text-xl text-purple-100 mb-10 max-w-2xl mx-auto font-bold">Your GPA will thank you later. Join the study revolution today.</p>
               
               <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button onClick={onGetStarted} variant="yellow" className="px-12 py-5 text-xl rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1">
                     Start Studying Now
                  </Button>
               </div>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 dark:bg-[#0f0a1e] py-12 px-6 text-center border-t border-slate-200 dark:border-white/5">
         <div className="flex items-center justify-center gap-2 mb-8">
             <div className="bg-brand-yellow p-1.5 rounded-lg"><Zap className="w-5 h-5 text-brand-dark fill-current" /></div>
             <span className="text-xl font-heading font-bold text-slate-700 dark:text-slate-200">StudyZap</span>
         </div>
         <p className="text-slate-500 font-bold">© 2024 StudyZap Inc. Made with 💜 for students.</p>
      </footer>

    </div>
  );
};

export default LandingPage;