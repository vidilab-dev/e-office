import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, Key, ArrowRight, UserCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useOffice } from '../../context/OfficeContext';

interface LoginViewProps {
  onSuccessLogin?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccessLogin }) => {
  const { users, switchUser } = useOffice();

  const [identifier, setIdentifier] = useState('hendrawan.suprayogi@bin.co.id');
  const [password, setPassword] = useState('password123');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmed = identifier.trim().toLowerCase();
    const user = users.find(
      (u) => u.email.toLowerCase() === trimmed || u.nip.toLowerCase() === trimmed
    );

    if (!user) {
      setErrorMsg('NIP atau Surel Dinas tidak terdaftar dalam sistem PT BIN.');
      return;
    }

    if (!password) {
      setErrorMsg('Kata sandi harus diisi.');
      return;
    }

    // Login success
    switchUser(user.id);
    if (onSuccessLogin) onSuccessLogin();
  };

  const handleQuickLogin = (userId: string) => {
    switchUser(userId);
    if (onSuccessLogin) onSuccessLogin();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-blue-600 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="inline-flex w-14 h-14 bg-gradient-to-br from-blue-700 to-blue-950 text-white rounded-2xl items-center justify-center font-bold text-2xl tracking-tight border border-blue-600 shadow-xl mb-2">
          BIN
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white uppercase">
          PT BADAN INDUSTRI NUSANTARA (PERSERO)
        </h1>
        <p className="text-xs text-slate-400">
          Platform Workflow Perkantoran Terpadu & Persuratan Elektronik (e-Office)
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800/90 py-8 px-6 shadow-2xl border border-slate-700/80 rounded-2xl sm:px-10 space-y-6 backdrop-blur-md">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                NIP atau Alamat Surel Dinas (@bin.co.id)
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Contoh: hendrawan.suprayogi@bin.co.id atau NIP"
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-900/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono placeholder:text-slate-500"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Kata Sandi (Password)
                </label>
                <span className="text-[11px] text-blue-400 font-mono">
                  Default: password123
                </span>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-900/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono placeholder:text-slate-500"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2 mt-2"
            >
              <span>Masuk Ke Sistem e-Office</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Login Picker */}
          <div className="pt-4 border-t border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Pilih Akun Demo (1-Click Login):
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Password: password123</span>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickLogin(u.id)}
                  className="p-2 bg-slate-900/60 hover:bg-slate-700/80 border border-slate-700/70 hover:border-blue-500 rounded-lg text-left transition-all group"
                >
                  <p className="font-bold text-slate-200 text-[11px] truncate group-hover:text-blue-400">
                    {u.name.split(',')[0]}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {u.role} · {u.unit}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Security Seal */}
          <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Terhubung dengan SSO PT BIN & Sertifikasi BSrE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
