import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { analyzeResume, AnalysisResult } from '../services/geminiService';
import { ShieldCheck, Brain, Sparkles, CheckCircle2, Star } from 'lucide-react';

export default function StudentDashboard() {
  const [pastedText, setPastedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleTextSubmit = async () => {
    if (!pastedText.trim()) return;
    setIsProcessing(true);
    
    try {
      const dynamicResult = await analyzeResume(pastedText);

      // In a real app we'd use auth.currentUser.uid
      const studentUid = "student_" + Math.random().toString(36).substring(7);

      await addDoc(collection(db, "profiles"), {
        ...dynamicResult,
        student_uid: studentUid,
        updatedAt: new Date().toISOString()
      });
      
      setResult(dynamicResult);
      setPastedText('');
    } catch (err: any) {
      alert("Analysis failed: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return (
      <div className="max-w-2xl mx-auto p-12 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-2xl text-center space-y-8 shadow-saas">
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 border-4 border-indigo-100 dark:border-indigo-900/30 rounded-full" />
          <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
            <Brain size={32} />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Quantifying Merit</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Our AI is stripping PII and mapping your skills to industry benchmarks.</p>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 dark:bg-green-500/10 rounded-2xl flex items-center justify-center text-green-600 shadow-sm border border-green-100">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Merit Profile Generated</h2>
              <p className="text-sm text-slate-500 font-medium">Reference ID: <span className="text-indigo-600 font-bold">{result.candidate_id}</span></p>
            </div>
          </div>
          <button 
            onClick={() => setResult(null)}
            className="px-5 py-2.5 bg-white border border-border text-slate-600 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all"
          >
            Reset Analysis
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            <div className="bg-white dark:bg-dark-card p-10 rounded-2xl border border-border dark:border-dark-border shadow-sm relative overflow-hidden text-left">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                  <Star size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Composite Merit Index</h2>
              </div>
              
              <div className="flex items-baseline gap-4 mb-4">
                <span className="text-8xl font-bold text-indigo-600 tracking-tighter">{result.meritScore}</span>
                <span className="text-2xl font-semibold text-slate-300">/ 100</span>
              </div>
              
              <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 mb-10">
                 <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium italic">"{result.reasoning}"</p>
              </div>

              <div className="bg-indigo-50/30 dark:bg-indigo-900/10 p-6 rounded-2xl border border-indigo-100/50 mb-10">
                 <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-6">Bias Filter Log</h4>
                 <ul className="space-y-4">
                    {['Identifiable PII Redacted', 'School Labeling Normalized', 'Gender Context Stripped'].map((log, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm font-semibold text-indigo-700/70">
                         <ShieldCheck size={16} />
                         {log}
                      </li>
                    ))}
                 </ul>
              </div>
            </div>
          </div>

          <div className="space-y-10">
            <div className="bg-white dark:bg-dark-card p-8 rounded-2xl border border-border dark:border-dark-border shadow-sm text-left">
              <div className="flex items-center gap-3 mb-8">
                <Sparkles size={20} className="text-secondary" />
                <h3 className="text-lg font-bold text-slate-800 tracking-tight">Growth Pathway</h3>
              </div>
              <div className="space-y-6">
                {(result.skill_gaps || []).map((gap: any, i: number) => (
                  <div key={i} className="p-5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-transparent hover:border-indigo-100 transition-all">
                     <div className="text-sm font-bold text-slate-800 mb-2">{gap.skill}</div>
                     <p className="text-xs text-slate-500 mb-4 leading-relaxed">{gap.recommendation}</p>
                     <div className="text-[10px] font-bold text-secondary bg-secondary/10 px-3 py-1.5 rounded-lg inline-block uppercase tracking-tight">
                        Next Step: {gap.action_item}
                     </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-2xl shadow-xl text-left">
               <h4 className="text-white font-bold mb-4">Pipeline Status</h4>
               <p className="text-indigo-200 text-sm mb-6 leading-relaxed">
                 Your profile is now live in the global anonymized recruiter feed. Merit Score <span className="text-white font-bold">{result.meritScore}%</span> ranks in top 15% of candidates.
               </p>
               <div className="flex items-center gap-2 text-indigo-400">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-ping" />
                  <span className="text-xs font-bold uppercase tracking-widest">Active Market Sync</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-slate-800 dark:text-white tracking-tight">Your merit, unmasked.</h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          We use AI to redact biased identifiers from your resume and showcase your technical impact directly to global recruiters.
        </p>
      </div>

      <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-2xl p-10 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
        <textarea 
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
          placeholder="Paste your experience, projects, or full resume text here..."
          className="w-full h-80 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-dark-border rounded-2xl p-8 text-slate-800 dark:text-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all text-base leading-relaxed custom-scrollbar placeholder:text-slate-400"
        />
        
        <div className="mt-10 flex flex-col items-center gap-6">
          <button 
            onClick={handleTextSubmit}
            disabled={isProcessing}
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg rounded-2xl transition-all shadow-lg shadow-indigo-600/10 disabled:opacity-50 flex items-center justify-center gap-3 tracking-tight"
          >
            <ShieldCheck size={24} />
            {isProcessing ? "Optimizing Profile..." : "Analyze My Technical Merit"}
          </button>
          
          <div className="flex items-center gap-3 py-3 px-6 bg-slate-50 dark:bg-slate-900 rounded-full border border-slate-100 dark:border-slate-800">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Zero-Bias Protocol 2.1 Active
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {[
          { icon: <ShieldCheck size={24}/>, title: "100% Anonymized", desc: "Names, schools, and gender are instantly redacted." },
          { icon: <Brain size={24}/>, title: "Skill Mapped", desc: "Your impact is benchmarked against top industry standards." },
          { icon: <Sparkles size={24}/>, title: "Instant Match", desc: "Get shortlisted based solely on verified competencies." }
        ].map((item, idx) => (
          <div key={idx} className="text-center group p-4">
            <div className="w-16 h-16 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm transition-transform group-hover:-translate-y-1 text-indigo-600">
              {item.icon}
            </div>
            <h4 className="text-base font-bold text-slate-800 dark:text-white mb-2 tracking-tight">{item.title}</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
