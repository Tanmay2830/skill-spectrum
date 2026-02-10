
import React, { useState, useEffect, useRef } from 'react';
import UniverseView, { UniverseViewHandle } from './components/UniverseView';
import SimulationView from './components/SimulationView';
import LoginView from './components/LoginView';
import HUD from './components/HUD';
import { generateSkillUniverseData } from './services/geminiService';
import { SkillNode, ViewMode, UserRole, UserState } from './types';
import { Loader2, Zap, Orbit, Cpu, ShieldCheck } from 'lucide-react';

const LOADING_STEPS = [
  { icon: Cpu, text: "INITIALIZING QUANTUM CORE..." },
  { icon: ShieldCheck, text: "AUTHENTICATING IDENTITY SIGNATURE..." },
  { icon: Zap, text: "SCANNING ENTERPRISE CAPABILITY MATRICES..." },
  { icon: Orbit, text: "CALCULATING SKILL GRAVITY & ORBITS..." },
  { icon: Loader2, text: "RENDERing PERSPECTIVE VIEWPORT..." }
];

const LoadingOverlay: React.FC<{ role: UserRole }> = ({ role }) => {
  const [currentStep, setCurrentStep] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 1200);
    return () => clearInterval(interval);
  }, []);
  const StepIcon = LOADING_STEPS[currentStep].icon;
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black z-50 overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/20 rounded-full blur-[120px] animate-pulse"></div>
      </div>
      <div className="flex flex-col items-center max-w-md w-full px-8 relative z-20">
        <div className="relative mb-8">
           <div className="w-24 h-24 border-2 border-blue-500/30 rounded-full flex items-center justify-center"><StepIcon className="w-10 h-10 text-blue-400 animate-pulse" /></div>
           <div className="absolute inset-0 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        </div>
        <div className="w-full space-y-4">
          <div className="flex justify-between items-end">
            <h2 className="text-sm font-mono tracking-[0.3em] text-blue-400 uppercase">{role.replace('_', ' ')} PERSPECTIVE</h2>
            <span className="text-[10px] font-mono text-slate-500">{Math.round(((currentStep + 1) / LOADING_STEPS.length) * 100)}%</span>
          </div>
          <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
             <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-400 transition-all duration-1000 ease-out" style={{ width: `${((currentStep + 1) / LOADING_STEPS.length) * 100}%` }}></div>
          </div>
          <div className="space-y-2 pt-4">
             {LOADING_STEPS.map((step, idx) => (
               <div key={idx} className={`flex items-center gap-3 text-[10px] font-mono transition-opacity duration-300 ${idx === currentStep ? 'text-blue-300 opacity-100' : idx < currentStep ? 'text-green-500 opacity-60' : 'text-slate-700 opacity-30'}`}>{idx < currentStep ? '✓' : idx === currentStep ? '▶' : '○'}{step.text}</div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.LOGIN);
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
  const [universeData, setUniverseData] = useState<SkillNode[]>([]);
  const [loadingUniverse, setLoadingUniverse] = useState(false);
  const [highlightedSkill, setHighlightedSkill] = useState<string | undefined>("Kubernetes Troubleshooting");
  
  const universeRef = useRef<UniverseViewHandle>(null);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.EMPLOYEE);
  const [userState, setUserState] = useState<UserState>({
    role: UserRole.EMPLOYEE,
    name: "Alex Pilot",
    title: "Junior Architect",
    level: 4,
    xp: 2450
  });

  const [dimensions, setDimensions] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const handleResize = () => setDimensions({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogin = async (role: UserRole) => {
    setUserRole(role);
    setUserState(prev => ({ ...prev, role }));
    setLoadingUniverse(true);
    setViewMode(ViewMode.UNIVERSE);
    const data = await generateSkillUniverseData(role === UserRole.EMPLOYEE ? "Full Stack Engineer" : role === UserRole.MANAGER ? "Engineering Dept" : "Global Enterprise", role);
    setUniverseData(data);
    setLoadingUniverse(false);
  };

  const handleNodeClick = (node: SkillNode) => {
    if (node.type === 'PLANET' || node.type === 'TEAM') {
      setSelectedNode(node);
      setViewMode(ViewMode.SIMULATION);
    }
  };

  const handleFindSkill = (skillName: string) => {
    setHighlightedSkill(skillName);
    universeRef.current?.focusOnSkill(skillName);
  };

  const handleRoleSwitch = async (role: UserRole) => {
    setUserRole(role);
    setUserState(prev => ({ ...prev, role }));
    setLoadingUniverse(true);
    const data = await generateSkillUniverseData(role === UserRole.EMPLOYEE ? "Full Stack Engineer" : role === UserRole.MANAGER ? "Engineering Dept" : "Global Enterprise", role);
    setUniverseData(data);
    setLoadingUniverse(false);
  };

  const handleLogout = () => {
    setViewMode(ViewMode.LOGIN);
    setUniverseData([]);
    setSelectedNode(null);
  };

  if (viewMode === ViewMode.LOGIN) return <LoginView onLogin={handleLogin} />;

  return (
    <div className="w-full h-full relative font-sans text-white bg-black overflow-hidden">
      {viewMode === ViewMode.UNIVERSE && (
        <>
           {loadingUniverse ? (
             <LoadingOverlay role={userRole} />
           ) : (
             <UniverseView 
               ref={universeRef}
               data={universeData} 
               width={dimensions.w} 
               height={dimensions.h} 
               onNodeClick={handleNodeClick} 
               highlightedSkillName={highlightedSkill}
             />
           )}
        </>
      )}
      {viewMode === ViewMode.SIMULATION && selectedNode && (
        <div className="absolute inset-0 z-40 bg-black animate-in zoom-in-95 duration-500">
           <SimulationView 
             node={selectedNode} 
             user={userState}
             onExit={() => setViewMode(ViewMode.UNIVERSE)} 
           />
        </div>
      )}
      <HUD 
        user={userState} 
        role={userRole} 
        onRoleChange={handleRoleSwitch} 
        onLogout={handleLogout}
        onFindSkill={handleFindSkill}
        viewMode={viewMode} 
      />
    </div>
  );
};

export default App;
