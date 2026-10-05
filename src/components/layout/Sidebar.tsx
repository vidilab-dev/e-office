import React from 'react';
import {
  LayoutDashboard,
  Inbox,
  Send,
  GitBranch,
  Hash,
  CheckCircle,
  Archive,
  FileCode,
  CalendarCheck,
  Plane,
  Calendar,
  CheckSquare,
  BarChart3,
  Settings,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';
import { useOffice } from '../../context/OfficeContext';

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const { activeModule, setActiveModule, currentUser, inboundLetters, outgoingLetters, dispositions, tasks } = useOffice();

  // Dynamic badges
  const pendingInbound = inboundLetters.filter((l) => l.status === 'Menunggu Disposisi' || l.status === 'Registrasi').length;
  const pendingApprovals = outgoingLetters.filter((l) => l.status === 'Menunggu Approval').length;
  const myPendingTasks = tasks.filter((t) => t.status !== 'Selesai' && t.assigneeId === currentUser.id).length;
  const pendingDispositions = dispositions.filter((d) => d.status === 'Diproses').length;

  const navGroups = [
    {
      group: 'Utama',
      items: [
        { id: 'dashboard', label: 'Dashboard Eksekutif', icon: LayoutDashboard },
      ],
    },
    {
      group: 'Persuratan',
      items: [
        { id: 'surat-masuk', label: 'Surat Masuk', icon: Inbox, badge: pendingInbound },
        { id: 'surat-keluar', label: 'Surat Keluar & Internal', icon: Send },
        { id: 'disposisi', label: 'Disposisi Surat', icon: GitBranch, badge: pendingDispositions },
        { id: 'approval', label: 'Approval Workflow', icon: CheckCircle, badge: pendingApprovals },
        { id: 'penomoran', label: 'Penomoran Surat (Register)', icon: Hash },
      ],
    },
    {
      group: 'Dokumen & Kearsipan',
      items: [
        { id: 'arsip', label: 'Arsip Digital', icon: Archive },
        { id: 'template', label: 'Template Dokumen', icon: FileCode },
      ],
    },
    {
      group: 'Kepegawaian & Operasional',
      items: [
        { id: 'cuti', label: 'Cuti & Izin Pegawai', icon: CalendarCheck },
        { id: 'perjalanan-dinas', label: 'Perjalanan Dinas (SPD/LPJ)', icon: Plane },
        { id: 'agenda-rapat', label: 'Agenda & Notulen Rapat', icon: Calendar },
        { id: 'tasks', label: 'Manajemen Task', icon: CheckSquare, badge: myPendingTasks },
      ],
    },
    {
      group: 'Analitik & Tata Kelola',
      items: [
        { id: 'laporan', label: 'Laporan & SLA Monitoring', icon: BarChart3 },
        { id: 'admin', label: 'Pengaturan & Admin Data', icon: Settings },
        { id: 'audit-trail', label: 'Audit Trail (SPI)', icon: ShieldAlert },
      ],
    },
  ];

  const handleSelect = (id: string) => {
    setActiveModule(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <aside
      className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Brand Header Mobile */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-800">
        <span className="font-bold text-white text-sm">Menu Navigasi e-Office</span>
        <button onClick={onCloseMobile} className="text-slate-400 hover:text-white p-1">
          ✕
        </button>
      </div>

      {/* Nav Content */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navGroups.map((group) => (
          <div key={group.group}>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {group.group}
            </div>
            <nav className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors group ${
                      isActive
                        ? 'bg-blue-800 text-white font-semibold shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge !== undefined && item.badge > 0 ? (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                          isActive ? 'bg-white text-blue-900' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Current User Snapshot Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">{currentUser.name}</p>
            <p className="text-[10px] text-slate-400 truncate">{currentUser.title}</p>
          </div>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
            {currentUser.unit}
          </span>
        </div>
      </div>
    </aside>
  );
};
