import React, { useState } from 'react';
import {
  Search,
  Bell,
  UserCheck,
  ChevronDown,
  ShieldAlert,
  LogOut,
  RefreshCw,
  QrCode,
} from 'lucide-react';
import { useOffice } from '../../context/OfficeContext';

interface HeaderProps {
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch }) => {
  const {
    currentUser,
    users,
    switchUser,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    activeModule,
    setActiveModule,
    setQrVerificationModalData,
    resetAllToInitial,
  } = useOffice();

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="flex items-center justify-between px-4 sm:px-6 h-14">
        {/* Zone 1: Single text element Brand Zone */}
        <div className="flex items-center gap-3">
          <a
            href="#dashboard"
            onClick={(e) => {
              e.preventDefault();
              setActiveModule('dashboard');
            }}
            className="text-base sm:text-lg font-bold tracking-tight text-slate-900 hover:text-blue-900 transition-colors flex items-center gap-2"
          >
            <span className="w-7 h-7 bg-blue-900 text-white rounded flex items-center justify-center text-xs font-black shadow-xs">
              BIN
            </span>
            <span>e-Office PT BIN</span>
          </a>
        </div>

        {/* Zone 2: Navigation links / Quick Context Buttons */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-600">
          <button
            onClick={() => setActiveModule('dashboard')}
            className={`transition-colors hover:text-slate-900 ${
              activeModule === 'dashboard' ? 'text-blue-900 font-semibold border-b-2 border-blue-900 py-4 -mb-[1px]' : ''
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveModule('surat-masuk')}
            className={`transition-colors hover:text-slate-900 ${
              activeModule === 'surat-masuk' ? 'text-blue-900 font-semibold border-b-2 border-blue-900 py-4 -mb-[1px]' : ''
            }`}
          >
            Persuratan
          </button>
          <button
            onClick={() => setActiveModule('approval')}
            className={`transition-colors hover:text-slate-900 ${
              activeModule === 'approval' ? 'text-blue-900 font-semibold border-b-2 border-blue-900 py-4 -mb-[1px]' : ''
            }`}
          >
            Approval
          </button>
          <button
            onClick={() => setActiveModule('perjalanan-dinas')}
            className={`transition-colors hover:text-slate-900 ${
              activeModule === 'perjalanan-dinas' ? 'text-blue-900 font-semibold border-b-2 border-blue-900 py-4 -mb-[1px]' : ''
            }`}
          >
            Perjalanan Dinas
          </button>
          <button
            onClick={() => setActiveModule('tasks')}
            className={`transition-colors hover:text-slate-900 ${
              activeModule === 'tasks' ? 'text-blue-900 font-semibold border-b-2 border-blue-900 py-4 -mb-[1px]' : ''
            }`}
          >
            Task Saya
          </button>
          <button
            onClick={() => setActiveModule('admin')}
            className={`transition-colors hover:text-slate-900 ${
              activeModule === 'admin' ? 'text-blue-900 font-semibold border-b-2 border-blue-900 py-4 -mb-[1px]' : ''
            }`}
          >
            Admin & Pengaturan
          </button>
        </nav>

        {/* Zone 3: Primary Actions (Search, QR Verify, Notifications, Role Switcher) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Search Button */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-500 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Cari Dokumen (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Cari dokumen...</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono text-slate-400 bg-white border border-slate-200 rounded">
              ⌘K
            </kbd>
          </button>

          {/* Quick QR Verifier Button */}
          <button
            onClick={() => setQrVerificationModalData({ code: '' })}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Verifikasi Dokumen & TTE"
          >
            <QrCode className="w-4 h-4" />
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setIsNotifDropdownOpen(!isNotifDropdownOpen);
                setIsUserDropdownOpen(false);
              }}
              className="relative p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="Notifikasi"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-600 rounded-full ring-2 ring-white"></span>
              )}
            </button>

            {isNotifDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">Notifikasi</span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-1.5 py-0.2 rounded">
                      {unreadCount} baru
                    </span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[11px] text-blue-600 hover:underline"
                    >
                      Tandai terbaca semua
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-xs text-center text-slate-400">Tidak ada notifikasi baru.</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markNotificationRead(n.id);
                          if (n.targetModule) setActiveModule(n.targetModule);
                          setIsNotifDropdownOpen(false);
                        }}
                        className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition-colors ${
                          !n.read ? 'bg-blue-50/40' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <p className="font-semibold text-slate-900 text-xs">{n.title}</p>
                          <span className="text-[10px] text-slate-400 shrink-0">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 leading-snug">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-4 w-[1px] bg-slate-200"></div>

          {/* User Profile & Role Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                setIsUserDropdownOpen(!isUserDropdownOpen);
                setIsNotifDropdownOpen(false);
              }}
              className="flex items-center gap-2 p-1 pl-2 text-left hover:bg-slate-100 rounded-lg transition-colors border border-slate-200/80"
            >
              <div className="hidden sm:block text-right">
                <p className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[140px]">
                  {currentUser.name}
                </p>
                <div className="flex items-center justify-end gap-1">
                  <span className="text-[10px] font-medium text-blue-800 bg-blue-50 px-1 rounded">
                    {currentUser.role}
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold ring-2 ring-slate-100">
                {currentUser.name.charAt(0)}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isUserDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50">
                  <p className="text-xs text-slate-500 font-medium">Masuk Sebagai:</p>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">{currentUser.name}</p>
                  <p className="text-[11px] text-slate-600">{currentUser.title}</p>
                  <p className="text-[10px] font-mono text-slate-400">{currentUser.nip}</p>
                </div>

                {/* Role Switcher List */}
                <div className="py-1">
                  <div className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Ganti Peran Pengguna (RBAC Simulation):
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {users.map((u) => {
                      const isSelected = u.id === currentUser.id;
                      return (
                        <button
                          key={u.id}
                          onClick={() => {
                            switchUser(u.id);
                            setIsUserDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-2 text-xs text-left transition-colors ${
                            isSelected ? 'bg-blue-50 text-blue-950 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div>
                            <p className="text-xs">{u.name}</p>
                            <span className="text-[10px] text-slate-500">
                              {u.role} · {u.unit}
                            </span>
                          </div>
                          {isSelected && <UserCheck className="w-4 h-4 text-blue-700 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 px-3">
                  <button
                    onClick={() => {
                      if (confirm('Reset seluruh data simulasi ke kondisi bawaan?')) {
                        resetAllToInitial();
                        setIsUserDropdownOpen(false);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset Data Simulasi</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
