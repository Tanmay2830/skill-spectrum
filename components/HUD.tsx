
import React from 'react';
import { UserRole, UserState } from '../types';
import { Shield, Zap, Target, Users, LayoutDashboard, LogOut, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface HUDProps {
  user: UserState;
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
  onLogout: () => void;
  onFindSkill: (skillName: string) => void;
  viewMode: string;
}

const HUD: React.FC<HUDProps> = ({ user, role, onRoleChange, onLogout, onFindSkill, viewMode }) => {
  const dummyStats = [
    { name: 'Cloud', val: 80 },
    { name: 'Data', val: 45 },
    { name: 'Sec', val: 60 },
    { name: 'Dev', val: 90 },
  ];

  if (viewMode === 'SIMULATION') return null;

  const activeSkill = "Kubernetes Troubleshooting";

  return (
    <>
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none z-50">
        <div className="pointer-events-auto flex items-start gap-4">
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-lg p-3 flex items-center gap-4 shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white border-2 border-white/20">
              {user.name.charAt(0)}
            </div>
            <div>
              <div className="text-white font-bold text-sm tracking-wide">{user.name.toUpperCase()}</div>
              <div className="text-blue-400 text-xs font-mono">{user.title} | Lvl {user.level}</div>
            </div>
          </div>
          <div className="pointer-events-auto bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-lg p-1 flex shadow-2xl">
            {(Object.keys(UserRole) as Array<keyof typeof UserRole>).map((r) => (
              <button
                key={r}
                onClick={() => onRoleChange(UserRole[r])}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  role === UserRole[r] ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {r.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
        <button onClick={onLogout} className="pointer-events-auto bg-slate-900/80 hover:bg-red-900/80 backdrop-blur-md border border-slate-700 hover:border-red-700 rounded-lg p-3 text-slate-400 hover:text-red-200 transition-all shadow-2xl flex items-center gap-2 group"><LogOut className="w-5 h-5" /><span className="text-xs font-bold hidden group-hover:inline">LOGOUT</span></button>
      </div>

      <div className="absolute bottom-4 left-4 w-72 pointer-events-auto z-50">
        <button 
          onClick={() => onFindSkill(activeSkill)}
          className="w-full text-left bg-slate-900/90 backdrop-blur-md border-l-4 border-blue-500 rounded-r-lg p-4 shadow-2xl hover:bg-slate-800 transition-all group"
        >
          <h3 className="text-blue-400 text-[10px] font-black uppercase mb-2 flex items-center justify-between">
            <span className="flex items-center"><Zap className="w-3 h-3 mr-1" /> Active Directive</span>
            <span className="text-blue-500/50 group-hover:translate-x-1 transition-transform"><ArrowRight className="w-3 h-3" /></span>
          </h3>
          <p className="text-slate-200 text-sm leading-snug">
            Acquire <strong className="text-white underline decoration-blue-500/50 decoration-2 underline-offset-4">{activeSkill}</strong> certification to unlock project deployment.
          </p>
          <div className="mt-4 flex items-center justify-between text-[10px] text-slate-500 font-mono">
             <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> PRIORITY ALPHA</span>
             <span>CLICK TO LOCATE</span>
          </div>
        </button>
      </div>

      <div className="absolute bottom-4 right-4 w-60 pointer-events-auto z-50">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-lg p-4 shadow-2xl">
          <h3 className="text-slate-400 text-xs font-bold uppercase mb-2 flex items-center justify-between">
            <span>Capability Matrix</span>
            <LayoutDashboard className="w-3 h-3" />
          </h3>
          <div className="h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dummyStats}>
                <XAxis dataKey="name" tick={{fontSize: 9, fill: '#64748b'}} interval={0} stroke="none" />
                <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px'}} itemStyle={{color: '#fff'}} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                <Bar dataKey="val" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
};

export default HUD;
