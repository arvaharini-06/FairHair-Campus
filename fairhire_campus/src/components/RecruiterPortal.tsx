import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Brain, Star, Filter, ArrowUpRight, Search, Trash2, Zap, Briefcase } from 'lucide-react';
import { rankCandidates } from '../services/geminiService';

export default function RecruiterPortal() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobDescription, setJobDescription] = useState('');
  const [rankingInProgress, setRankingInProgress] = useState(false);
  const [rankedResults, setRankedResults] = useState<any[] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'shortlisted'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "profiles"), orderBy("updatedAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      setCandidates(data);
      setLoading(false);
      // Set initial selection if none
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].candidate_id);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "profiles");
    });
    return () => unsubscribe();
  }, [db]);

  const handleRankCandidates = async () => {
    if (!jobDescription.trim() || candidates.length === 0) return;
    setRankingInProgress(true);
    try {
      const results = await rankCandidates(jobDescription, candidates);
      setRankedResults(results);
      if (results.length > 0) {
        setSelectedId(results[0].candidate_id);
      }
    } catch (error) {
      alert("Ranking failed");
    } finally {
      setRankingInProgress(false);
    }
  };

  const displayCandidates = (rankedResults 
    ? candidates.map(c => {
        const ranking = rankedResults.find(r => r.candidate_id === c.candidate_id);
        return { 
          ...c, 
          match_score: ranking?.match_score || 0,
          match_explanation: ranking?.match_explanation || c.match_explanation,
          isRanked: true
        };
      }).sort((a, b) => (b.match_score || 0) - (a.match_score || 0))
    : candidates.map(c => ({ ...c, isRanked: false })))
    .filter(c => {
      // Apply status filter
      if (activeFilter === 'shortlisted' && c.status !== 'shortlisted') return false;
      
      // Apply search filter
      const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
      if (searchTerms.length === 0) return true;

      // Extract all searchable strings from the candidate
      const skills = Array.isArray(c.skills) ? c.skills : [];
      const matrixKeys = Object.keys(c.skill_matrix || {});
      const candidateId = c.candidate_id || "";
      const reasoning = c.reasoning || "";
      const explanation = c.match_explanation || "";
      const redactedText = c.redactedText || "";

      // Check if all search terms are found in at least one field (AND search)
      // or if any term is found (OR search). Let's do OR search for flexibility but within terms.
      return searchTerms.every(term => {
        const matchSkills = skills.some((s: string) => s.toLowerCase().includes(term));
        const matchMatrix = matrixKeys.some((k: string) => k.toLowerCase().includes(term));
        const matchId = candidateId.toLowerCase().includes(term);
        const matchReasoning = reasoning.toLowerCase().includes(term);
        const matchExplanation = explanation.toLowerCase().includes(term);
        const matchText = redactedText.toLowerCase().includes(term);
        
        return matchSkills || matchMatrix || matchId || matchReasoning || matchExplanation || matchText;
      });
    });

  const selectedCandidate = displayCandidates.find(c => c.candidate_id === selectedId) || displayCandidates[0];

  const handleDelete = async (id: string) => {
    if (!db) return;
    try {
      console.log("Deleting profile:", id);
      await deleteDoc(doc(db, "profiles", id));
    } catch (error) {
      console.error("Delete failed:", error);
      handleFirestoreError(error, OperationType.DELETE, `profiles/${id}`);
    }
  };

  const shortlistedCount = candidates.length > 0 
    ? candidates.filter(c => c.status === 'shortlisted').length
    : 12;

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Candidate Pool</h1>
          <p className="text-base text-slate-500 dark:text-slate-400 mt-1">Reviewing anonymized professional profiles</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Skills & Keywords..." 
              className="bg-white dark:bg-dark-card border border-border dark:border-dark-border pl-11 pr-5 py-2.5 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all w-72 shadow-sm"
            />
          </div>
          <button 
            onClick={() => setActiveFilter(prev => prev === 'all' ? 'shortlisted' : 'all')}
            className={`p-2.5 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl transition-all shadow-sm flex items-center gap-2 ${activeFilter === 'shortlisted' ? 'text-indigo-600 border-indigo-200 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Filter size={18} />
            {activeFilter === 'shortlisted' && <span className="text-xs font-bold uppercase tracking-tight">Shortlisted</span>}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Pool", value: candidates.length > 0 ? candidates.length : 142, icon: <ShieldCheck size={22}/>, bg: "bg-indigo-50", color: "text-indigo-600" },
          { label: "Shortlisted", value: shortlistedCount, icon: <Star size={22}/>, bg: "bg-secondary/10", color: "text-secondary" },
          { 
            label: "Shortlist Rate", 
            value: candidates.length > 0 ? `${Math.round((shortlistedCount / candidates.length) * 100)}%` : "N/A", 
            icon: <Brain size={22}/>, 
            bg: "bg-sky-50", 
            color: "text-sky-600" 
          }
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-dark-card p-7 rounded-2xl border border-border dark:border-dark-border shadow-sm flex flex-col items-start transition-all hover:shadow-md">
            <div className={`w-12 h-12 ${stat.bg} dark:bg-opacity-10 rounded-xl flex items-center justify-center mb-5 ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{stat.value}</div>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          {/* Job Ranking Control */}
          <div className="bg-white dark:bg-dark-card p-8 rounded-2xl border border-border dark:border-dark-border shadow-sm text-left">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <Briefcase size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Active Requirement</h3>
            </div>
            <textarea 
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste job description to rank candidates by relevance..."
              className="w-full h-32 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-dark-border rounded-xl p-5 text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all mb-6"
            />
            <button 
              onClick={handleRankCandidates}
              disabled={rankingInProgress || !jobDescription.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/20"
            >
              {rankingInProgress ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Zap size={16} />}
              {rankingInProgress ? "AI Matching..." : "Rank Candidates by Relevance"}
            </button>
          </div>

          <div className="bg-white dark:bg-dark-card rounded-2xl border border-border dark:border-dark-border shadow-sm overflow-hidden text-left">
            <div className="px-8 py-5 border-b border-border dark:border-dark-border flex justify-between items-center bg-slate-50/30 dark:bg-slate-900/10">
              <h3 className="text-sm font-bold text-slate-700 dark:text-white tracking-tight">
                {rankedResults ? "AI Ranked Candidates" : "General Pool"}
              </h3>
              {loading && <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />}
            </div>
            <div className="divide-y divide-slate-100 dark:divide-dark-border">
              {displayCandidates.map((c) => (
                <div key={c.id} onClick={() => setSelectedId(c.candidate_id)} className={`cursor-pointer transition-all ${selectedId === c.candidate_id ? 'bg-indigo-50/50 dark:bg-indigo-500/10' : ''}`}>
                  <CandidateRow candidate={c} onDelete={() => handleDelete(c.id)} />
                </div>
              ))}
              {displayCandidates.length === 0 && (
                <div className="p-12 text-center text-slate-400 font-medium">No candidates found in this pool.</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white dark:bg-dark-card p-8 rounded-2xl border border-border dark:border-dark-border shadow-sm text-left">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                <Brain size={18} />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white tracking-tight">AI Insights</h3>
            </div>
            {selectedCandidate && (
              <div className="space-y-8">
                <div className="p-5 bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100/50 dark:border-indigo-500/20 rounded-xl">
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    "{selectedCandidate.match_explanation || selectedCandidate.reasoning}"
                  </p>
                </div>
              </div>
            )}
            {!selectedCandidate && displayCandidates.length > 0 && (
              <p className="text-sm text-slate-500 py-20 text-center">Select a candidate profile to view AI insights</p>
            )}
          </div>

          <div className="bg-slate-900 dark:bg-indigo-950 p-8 rounded-2xl border border-slate-800 shadow-xl overflow-hidden relative group text-left">
            <div className="absolute -top-4 -right-4 p-8 opacity-10 pointer-events-none transition-transform group-hover:scale-110">
              <ShieldCheck size={120} className="text-white" />
            </div>
            <h3 className="text-sm font-bold text-white tracking-widest uppercase mb-5">Bias Shield Protocol</h3>
            <p className="text-sm text-slate-300 dark:text-indigo-200 leading-relaxed italic mb-6">
              "Personal identifiers are automatically redacted by the Gemini 1.5 Pro engine to ensure selection is driven solely by technical merit and potential."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Secure 128-bit Anonymization</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CandidateRow({ candidate, onDelete }: { candidate: any, onDelete: () => void }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const isShortlisted = candidate.status === 'shortlisted';

  const toggleShortlist = async () => {
    if (!db) return;
    setIsUpdating(true);
    try {
      const candidateRef = doc(db, "profiles", candidate.id);
      const newStatus = candidate.status === 'shortlisted' ? 'active' : 'shortlisted';
      await updateDoc(candidateRef, { status: newStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `profiles/${candidate.id}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className={`p-8 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-all flex items-start justify-between group border-l-4 ${isShortlisted ? 'border-primary' : 'border-transparent'}`}>
      <div className="flex items-start gap-6">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xs border transition-all ${isShortlisted ? 'bg-primary text-white border-primary shadow-lg shadow-indigo-500/20' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800'}`}>
          {isShortlisted ? <Star size={18} fill="currentColor" /> : (candidate.candidate_id || "#")}
        </div>
        <div className="text-left">
          <div className="flex items-center gap-4 mb-3">
            <span className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
              {candidate.isRanked ? candidate.match_score : candidate.meritScore}
              <span className="text-sm text-indigo-600 font-medium ml-1">
                {candidate.isRanked ? '% Relevance' : '% Merit'}
              </span>
            </span>
            <div className="flex gap-2">
              {candidate.skills?.slice(0, 3).map((s: string, i: number) => (
                <span key={i} className="text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-2.5 py-1 rounded-md text-slate-500 tracking-tight transition-colors group-hover:border-indigo-100">
                  {s}
                </span>
              ))}
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed max-w-xl group-hover:line-clamp-none transition-all duration-300">
            {candidate.reasoning || candidate.match_explanation}
          </p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-3">
        <div className="flex gap-3">
          <button 
            onClick={async (e) => {
              e.stopPropagation();
              console.log("Delete button clicked for ID:", candidate.id);
              try {
                await onDelete();
              } catch (err: any) {
                alert("Delete failed: " + err.message);
              }
            }}
            className="p-3 rounded-xl text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/30 transition-all border border-red-100 dark:border-red-500/20 shadow-sm relative z-50 px-4 flex items-center gap-2"
            title="Delete candidate profile"
          >
            <Trash2 size={20} />
            <span className="text-[10px] font-bold uppercase">Remove</span>
          </button>
          <button 
            onClick={toggleShortlist}
            disabled={isUpdating}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold tracking-tight transition-all shadow-sm ${
              isShortlisted 
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md'
            }`}
          >
            {isUpdating ? '...' : (isShortlisted ? 'Deselect Candidate' : 'Shortlist Resume')}
          </button>
        </div>
        <span className="text-[10px] text-slate-300 dark:text-slate-600 font-bold uppercase tracking-widest">
          Auth Reference: {candidate.candidate_id || 'AI-PRO'}
        </span>
      </div>
    </div>
  );
}
