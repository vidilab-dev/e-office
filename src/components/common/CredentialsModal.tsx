import React, { useState } from 'react';
import { X, Key, UserCheck, Copy, Check, ShieldCheck, Lock, ArrowRight } from 'lucide-react';
import { useOffice } from '../../context/OfficeContext';

interface CredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CredentialsModal: React.FC<CredentialsModalProps> = ({ isOpen, onClose }) => {
  const { users, currentUser, switchUser } = useOffice();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const defaultPassword = 'password123';

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSelectUser = (userId: string) => {
    switchUser(userId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-900 rounded-lg">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Daftar Akun Pengguna & Password (Demo Credentials)</h3>
              <p className="text-xs text-slate-500">Gunakan akun di bawah ini untuk menguji hak akses per peran (RBAC)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Password Notice */}
        <div className="px-6 py-3 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-900 shrink-0" />
            <span className="text-blue-950 font-medium">
              Password default untuk semua akun demo: <strong className="font-mono bg-white px-2 py-0.5 rounded border border-blue-200 text-blue-900 font-bold">password123</strong>
            </span>
          </div>
          <button
            onClick={() => handleCopy(defaultPassword, 'default-pw')}
            className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold inline-flex items-center gap-1"
          >
            {copiedKey === 'default-pw' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Salin Password</span>
          </button>
        </div>

        {/* Users Table / Grid */}
        <div className="p-6 overflow-y-auto space-y-3">
          <div className="space-y-2.5">
            {users.map((u) => {
              const isCurrent = u.id === currentUser.id;
              const pw = u.role === 'Super Admin' ? 'admin123' : defaultPassword;

              return (
                <div
                  key={u.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                    isCurrent
                      ? 'bg-blue-50/60 border-blue-400 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{u.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-blue-100/70 text-blue-900">
                        {u.role}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                          Sedang Aktif
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600">
                      {u.title} · <span className="font-semibold text-slate-800">{u.unit}</span> ({u.department})
                    </p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 pt-1 font-mono">
                      <span>NIP: <strong className="text-slate-800">{u.nip}</strong></span>
                      <span>·</span>
                      <span>Email: <strong className="text-slate-800">{u.email}</strong></span>
                      <span>·</span>
                      <span>Pass: <strong className="text-blue-900">{pw}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => handleCopy(u.email, `email-${u.id}`)}
                      className="px-2.5 py-1 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded font-medium transition-colors flex items-center gap-1"
                      title="Salin Email"
                    >
                      {copiedKey === `email-${u.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                      <span className="hidden sm:inline">Salin Email</span>
                    </button>

                    <button
                      onClick={() => handleSelectUser(u.id)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
                        isCurrent
                          ? 'bg-emerald-600 text-white cursor-default'
                          : 'bg-blue-900 hover:bg-blue-950 text-white shadow-xs'
                      }`}
                    >
                      {isCurrent ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Aktif</span>
                        </>
                      ) : (
                        <>
                          <span>Masuk Akun</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Hak akses per peran (RBAC) otomatis menyesuaikan menu, disposisi, dan approval.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium rounded-lg"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
