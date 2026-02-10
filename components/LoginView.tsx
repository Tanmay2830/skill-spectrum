import React, { useState } from 'react';
import { UserRole } from '../types';
import { Shield, Users, Briefcase, Lock, User, ChevronRight, KeyRound } from 'lucide-react';

interface LoginViewProps {
  onLogin: (role: UserRole) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.EMPLOYEE);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      onLogin(role);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-black to-black text-white p-4 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>
      </div>

      <div className="text-center mb-10 animate-in fade-in zoom-in duration-1000 z-10">
        <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-purple-400 mb-4 tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
          SKILL UNIVERSE
        </h1>
        <p className="text-slate-400 text-lg font-light tracking-wide">
          ENTER THE OPERATING SYSTEM OF ENTERPRISE INTELLIGENCE
        </p>
      </div>

      <form 
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl flex flex-col gap-6 z-10 animate-in slide-in-from-bottom-10 fade-in duration-700"
      >
        <div className="space-y-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
            </div>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-500 transition-all outline-none"
              placeholder="Identity ID"
            />
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <KeyRound className="h-5 w-5 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-slate-500 transition-all outline-none"
              placeholder="Access Key"
            />
          </div>

          <div className="relative">
            <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider font-bold ml-1">Access Level</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole(UserRole.EMPLOYEE)}
                className={`p-3 rounded-lg flex flex-col items-center gap-1 border transition-all ${
                  role === UserRole.EMPLOYEE ? 'bg-blue-600/20 border-blue-500 text-blue-200' : 'bg-slate-800/30 border-slate-700 text-slate-500 hover:bg-slate-800'
                }`}
              >
                <Shield className="w-5 h-5" />
                <span className="text-[10px] font-bold">EMPLOYEE</span>
              </button>
              <button
                type="button"
                onClick={() => setRole(UserRole.MANAGER)}
                className={`p-3 rounded-lg flex flex-col items-center gap-1 border transition-all ${
                  role === UserRole.MANAGER ? 'bg-green-600/20 border-green-500 text-green-200' : 'bg-slate-800/30 border-slate-700 text-slate-500 hover:bg-slate-800'
                }`}
              >
                <Users className="w-5 h-5" />
                <span className="text-[10px] font-bold">MANAGER</span>
              </button>
              <button
                type="button"
                onClick={() => setRole(UserRole.HR_ADMIN)}
                className={`p-3 rounded-lg flex flex-col items-center gap-1 border transition-all ${
                  role === UserRole.HR_ADMIN ? 'bg-purple-600/20 border-purple-500 text-purple-200' : 'bg-slate-800/30 border-slate-700 text-slate-500 hover:bg-slate-800'
                }`}
              >
                <Briefcase className="w-5 h-5" />
                <span className="text-[10px] font-bold">ADMIN</span>
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!username || !password}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <span>INITIATE LINK</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </form>
      
      <div className="mt-12 text-slate-600 text-xs font-mono z-10">
        SECURE ENTERPRISE ACCESS • BIOMETRIC VERIFICATION ACTIVE
      </div>
    </div>
  );
};

export default LoginView;