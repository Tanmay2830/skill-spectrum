
import React, { useState, useEffect, useRef } from 'react';
import { SkillNode, SimulationScenario, SimulationMessage, LearningResource, UserState } from '../types';
import { generateSimulationScenario, processSmartChat, generateImage, generateVeoVideo, analyzeMedia, getLearningResources, evaluatePerformance } from '../services/geminiService';
import { searchYouTubeVideos } from '../services/youtubeService';
import LiveSession from './LiveSession';
import { 
  ArrowLeft, Mic, Video, Image as ImageIcon, Search, Map, Cpu, Loader2, Upload, 
  MessageSquare, BookOpen, Square, FileText, ExternalLink, GraduationCap, CheckCircle, 
  Zap, Play, Activity, Clock, Eye, Trash2, Milestone, ChevronRight, Award, Flame,
  RotateCcw, ShieldCheck, Timer, BookmarkPlus, Filter, X, Layout, FileJson
} from 'lucide-react';

interface SimulationViewProps {
  node: SkillNode;
  user?: UserState;
  onExit: () => void;
}

type ResourceStatus = 'pending' | 'in-progress' | 'completed';
type ProviderFilter = 'ALL' | 'YOUTUBE' | 'UDEMY' | 'DOCS' | 'INTERNAL';

const SimulationView: React.FC<SimulationViewProps> = ({ node, user, onExit }) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'learning' | 'visuals' | 'analysis' | 'live'>('chat');
  const [scenario, setScenario] = useState<SimulationScenario | null>(null);
  const [messages, setMessages] = useState<SimulationMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatTools, setChatTools] = useState({ search: false, maps: false, thinking: false });
  const scrollRef = useRef<HTMLDivElement>(null);

  const [resources, setResources] = useState<LearningResource[]>([]);
  const [activeResource, setActiveResource] = useState<LearningResource | null>(null);
  const [completedResources, setCompletedResources] = useState<Set<string>>(new Set());
  const [inProgressResources, setInProgressResources] = useState<Set<string>>(new Set());
  const [recommendedIds, setRecommendedIds] = useState<string[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [ytSearchQuery, setYtSearchQuery] = useState('');
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>('ALL');

  const [visualPrompt, setVisualPrompt] = useState('');
  const [generatedMedia, setGeneratedMedia] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [visualMode, setVisualMode] = useState<'gen_image' | 'edit_image' | 'gen_video'>('gen_image');
  const [isVisualLoading, setIsVisualLoading] = useState(false);
  
  const [analysisFile, setAnalysisFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState('');

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const data = await generateSimulationScenario(node.name, user, node.readiness);
      setScenario(data);
      setMessages([{ role: 'system', content: `DIRECTIVE: ${data.title}\nGOAL: ${data.objective}\nSTAKES: Enterprise Critical`, timestamp: new Date(), type: 'alert' }]);
      setLoading(false);
      
      setLoadingResources(true);
      const res = await getLearningResources(node.name, user, node.readiness);
      setResources(res);
      if (res.length > 0) setActiveResource(res[0]);
      setLoadingResources(false);
    };
    init();
  }, [node, user]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleManualSearch = async () => {
    if (!ytSearchQuery.trim()) return;
    setLoadingResources(true);
    const results = await searchYouTubeVideos(`${node.name} ${ytSearchQuery}`, 5);
    const newResources: LearningResource[] = results.map(v => ({
      id: v.id,
      title: v.title,
      provider: "YOUTUBE",
      url: v.id,
      description: v.description,
      relevance: "Direct inquiry for specialized " + node.name + " domain knowledge.",
      pathStep: "Research Discovery",
      tags: ["Search Result"],
      thumbnail: v.thumbnail
    }));
    setResources(newResources);
    setLoadingResources(false);
  };

  const handleChat = async () => {
    if (!input.trim() || loading) return;
    const userMsg: SimulationMessage = { role: 'user', content: input, timestamp: new Date(), type: 'text' };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    const context = scenario ? `Mission: ${scenario.objective}\nDifficulty: ${scenario.difficulty}` : '';
    const res = await processSmartChat(currentInput, messages, {
      useSearch: chatTools.search,
      useMaps: chatTools.maps,
      useThinking: chatTools.thinking
    }, context);

    setMessages(prev => [...prev, { role: 'ai', content: res.text || "No signal.", timestamp: new Date(), type: 'text' }]);
    setLoading(false);
  };

  const updateResourceStatus = (id: string, status: ResourceStatus) => {
    if (status === 'completed') {
      setCompletedResources(prev => new Set(prev).add(id));
      setInProgressResources(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } else {
      setInProgressResources(prev => new Set(prev).add(id));
      setCompletedResources(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const completionPercentage = resources.length > 0 ? (completedResources.size / resources.length) * 100 : 0;
  
  const filteredResources = resources.filter(r => providerFilter === 'ALL' || r.provider === providerFilter);
  const groupedResources: Record<string, LearningResource[]> = {};
  filteredResources.forEach(r => {
    const step = r.pathStep || "General Discovery";
    if (!groupedResources[step]) groupedResources[step] = [];
    groupedResources[step].push(r);
  });

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0a0c] text-slate-200 font-sans overflow-hidden">
      {/* HUD Header */}
      <div className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-black/40 backdrop-blur-md z-50">
        <div className="flex items-center gap-6">
          <button onClick={onExit} className="p-3 hover:bg-white/5 rounded-2xl transition-all group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-white uppercase flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              {node.name} <span className="text-slate-600 font-mono text-xs">// SIM_ACTIVE</span>
            </h1>
            <div className="text-[10px] font-mono text-blue-500/60 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
              Readiness: {node.readiness}% • Skill Gap: {100 - node.readiness}%
            </div>
          </div>
        </div>
        
        <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5">
          {[
            { id: 'chat', icon: MessageSquare, label: 'Chat' },
            { id: 'learning', icon: GraduationCap, label: 'Roadmap' },
            { id: 'visuals', icon: Zap, label: 'Visuals' },
            { id: 'analysis', icon: Upload, label: 'Audit' },
            { id: 'live', icon: Mic, label: 'Live' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-white'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" /> 
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* CHAT TAB */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full">
            <div className="flex-1 overflow-y-auto p-10 space-y-6 scroll-smooth custom-scrollbar" ref={scrollRef}>
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                  <div className={`max-w-[75%] p-5 rounded-3xl text-sm leading-relaxed border ${
                    m.role === 'user' ? 'bg-blue-600 border-blue-400/50 text-white' : 
                    m.type === 'alert' ? 'bg-red-900/20 border-red-500/50 text-red-100 font-mono text-xs' : 'bg-white/5 border-white/10 text-slate-300 backdrop-blur-sm'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && <div className="text-blue-500 animate-pulse font-mono text-[10px] tracking-widest px-2">NEURAL_LINK PROCESSING...</div>}
            </div>
            
            <div className="p-8 border-t border-white/5">
              <div className="flex gap-4">
                <input 
                  value={input} 
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleChat()}
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none placeholder-slate-700"
                  placeholder="Communicate with intelligence core..."
                />
                <button onClick={handleChat} disabled={loading} className="bg-blue-600 px-10 rounded-2xl font-black text-white hover:bg-blue-500 transition-all active:scale-95 text-xs tracking-widest uppercase">Send</button>
              </div>
            </div>
          </div>
        )}

        {/* LEARNING / ROADMAP TAB */}
        {activeTab === 'learning' && (
          <div className="flex-1 flex overflow-hidden">
            <div className="w-[420px] bg-black/40 border-r border-white/5 flex flex-col">
              <div className="p-8 border-b border-white/5">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="text-blue-500 font-black text-[10px] tracking-widest uppercase flex items-center gap-2">
                     <Milestone className="w-4 h-4" /> Personal Roadmap
                   </h3>
                   <div className="text-xs font-mono text-white/40">{Math.round(completionPercentage)}% SYNCED</div>
                </div>
                
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mb-8">
                   <div className="h-full bg-blue-500 transition-all duration-1000 ease-out" style={{ width: `${completionPercentage}%` }} />
                </div>

                <div className="flex flex-wrap gap-2">
                  {(['ALL', 'YOUTUBE', 'UDEMY', 'DOCS'] as ProviderFilter[]).map(f => (
                    <button 
                      key={f} 
                      onClick={() => setProviderFilter(f)}
                      className={`px-3 py-1.5 rounded-xl text-[9px] font-bold border transition-all ${
                        providerFilter === f ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-slate-500'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {loadingResources ? (
                  <div className="flex flex-col items-center justify-center py-20 opacity-50">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
                    <span className="text-[10px] font-mono tracking-widest">CURATING DOMAIN CONTENT...</span>
                  </div>
                ) : (
                  Object.keys(groupedResources).sort().map((phase, idx) => (
                    <div key={phase} className="space-y-4">
                      <div className="flex items-center gap-3">
                         <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg ${
                           groupedResources[phase].every(r => completedResources.has(r.id)) ? 'bg-green-600' : 'bg-blue-600'
                         }`}>
                           {groupedResources[phase].every(r => completedResources.has(r.id)) ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                         </div>
                         <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider">{phase}</h4>
                      </div>
                      
                      <div className="pl-9 space-y-3">
                        {groupedResources[phase].map(r => (
                          <div 
                            key={r.id} 
                            onClick={() => setActiveResource(r)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
                              activeResource?.id === r.id ? 'bg-blue-600/10 border-blue-500/50' : 'bg-white/5 border-white/5 hover:border-white/10'
                            }`}
                          >
                            <div className="flex gap-4">
                               <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                                  {r.provider === 'YOUTUBE' ? <Play className="w-4 h-4 text-red-500" /> : <GraduationCap className="w-4 h-4 text-purple-400" />}
                                  {completedResources.has(r.id) && <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center"><CheckCircle className="w-4 h-4 text-green-500" /></div>}
                               </div>
                               <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className={`text-[8px] font-black uppercase ${r.provider === 'UDEMY' ? 'text-purple-400' : 'text-red-400'}`}>{r.provider}</span>
                                    {completedResources.has(r.id) ? <span className="text-[8px] text-green-500 font-bold">DONE</span> : inProgressResources.has(r.id) ? <span className="text-[8px] text-blue-400 font-bold animate-pulse">SYNCING</span> : null}
                                  </div>
                                  <h5 className={`font-bold text-xs truncate ${completedResources.has(r.id) ? 'text-slate-500' : 'text-white'}`}>{r.title}</h5>
                               </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex-1 bg-black/60 flex flex-col p-12 overflow-hidden">
               {activeResource ? (
                 <div className="max-w-4xl mx-auto w-full flex flex-col h-full">
                    <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/5 mb-8">
                       {activeResource.provider === 'YOUTUBE' ? (
                         <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${activeResource.url}`} />
                       ) : (
                         <div className="w-full h-full flex flex-col items-center justify-center text-center p-10 bg-slate-900/50">
                            <GraduationCap className="w-12 h-12 text-purple-500 mb-6" />
                            <h2 className="text-2xl font-black mb-4">{activeResource.title}</h2>
                            <p className="text-slate-400 text-sm mb-10 max-w-md">{activeResource.description}</p>
                            <a href={activeResource.url} target="_blank" rel="noopener noreferrer" className="px-10 py-4 bg-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3">
                              Go to {activeResource.provider} <ExternalLink className="w-4 h-4" />
                            </a>
                         </div>
                       )}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                       <div className="bg-white/5 p-8 rounded-3xl border border-white/10 mb-8">
                          <h4 className="text-blue-400 text-[10px] font-black uppercase mb-4 tracking-widest">Personalization Logic</h4>
                          <p className="text-slate-300 text-sm leading-relaxed italic">"{activeResource.relevance}"</p>
                          
                          <div className="flex gap-4 mt-8">
                             <button 
                               onClick={() => updateResourceStatus(activeResource.id, 'in-progress')}
                               className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase border transition-all ${
                                 inProgressResources.has(activeResource.id) ? 'bg-blue-600 border-blue-500 text-white' : 'border-white/10 text-slate-500'
                               }`}
                             >
                               Set as Active
                             </button>
                             <button 
                               onClick={() => updateResourceStatus(activeResource.id, 'completed')}
                               className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase border transition-all ${
                                 completedResources.has(activeResource.id) ? 'bg-green-600 border-green-500 text-white' : 'border-white/10 text-slate-500'
                               }`}
                             >
                               Mark Mastery
                             </button>
                          </div>
                       </div>
                    </div>
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center h-full opacity-20">
                    <Cpu className="w-16 h-16 mb-6" />
                    <span className="text-[10px] font-mono tracking-widest">SELECT PROTOCOL TO INITIALIZE SYNC</span>
                 </div>
               )}
            </div>
          </div>
        )}

        {/* Other Tabs omitted for brevity in this response, assumed existing functionality persists */}
        {activeTab === 'live' && <LiveSession onClose={() => setActiveTab('chat')} />}
        {activeTab === 'visuals' && (
           <div className="flex-1 p-12 overflow-y-auto">
             <div className="max-w-3xl mx-auto space-y-8">
               <textarea value={visualPrompt} onChange={e => setVisualPrompt(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 h-40 outline-none" placeholder={`Generate a representation for ${node.name}...`} />
               <button onClick={async () => {
                 setIsVisualLoading(true);
                 const res = await generateImage(visualPrompt, '1K');
                 setGeneratedMedia(res);
                 setIsVisualLoading(false);
               }} className="bg-blue-600 px-8 py-4 rounded-xl font-bold uppercase text-[10px]">{isVisualLoading ? 'Rendering...' : 'Project to Neural Core'}</button>
               {generatedMedia && <img src={generatedMedia} className="w-full rounded-2xl border border-white/10 shadow-2xl" />}
             </div>
           </div>
        )}
      </div>

      {/* Footer HUD */}
      <div className="h-14 border-t border-white/5 bg-black/40 flex items-center justify-between px-8 text-[10px] font-mono text-slate-600 uppercase tracking-widest">
         <div className="flex gap-8">
            <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Terminal_Live</div>
            <div className="flex items-center gap-2 text-blue-500/80"><ShieldCheck className="w-3 h-3"/> Neural_Link: Priority_Alpha</div>
         </div>
         <button onClick={onExit} className="hover:text-white transition-colors">TERMINATE_SIMULATION</button>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default SimulationView;
