import React from 'react';
import {
  Inbox,
  Send,
  GitBranch,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Plane,
  CalendarCheck,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Plus,
  Flame,
} from 'lucide-react';
import { useOffice } from '../../context/OfficeContext';

export const DashboardView: React.FC = () => {
  const {
    currentUser,
    inboundLetters,
    outgoingLetters,
    dispositions,
    tasks,
    travelRequests,
    leaveRequests,
    setActiveModule,
    setSelectedDocumentForPreview,
  } = useOffice();

  // Metrics
  const pendingInbound = inboundLetters.filter((l) => l.status === 'Menunggu Disposisi' || l.status === 'Registrasi').length;
  const pendingApprovals = outgoingLetters.filter((l) => l.status === 'Menunggu Approval').length;
  const activeDispositions = dispositions.filter((d) => d.status === 'Diproses').length;
  const activeTravel = travelRequests.filter((t) => t.status === 'SPD Diterbitkan' || t.status === 'Sedang Berlangsung').length;
  const pendingLpj = travelRequests.filter((t) => t.status === 'LPJ Diajukan').length;
  const pendingLeaves = leaveRequests.filter((l) => l.status === 'Diajukan' || l.status === 'Disetujui Atasan').length;

  // Action Required Items
  const urgentTasks = tasks.filter((t) => t.status !== 'Selesai' && (t.priority === 'Urgent' || t.priority === 'Tinggi'));

  return (
    <div className="space-y-6">
      {/* Top Banner & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            {currentUser.role === 'Direksi'
              ? 'Dashboard Eksekutif Direksi'
              : currentUser.role === 'Admin Sekretariat'
              ? 'Dashboard Administrasi & Persuratan'
              : currentUser.role === 'Finance'
              ? 'Dashboard Keuangan & Anggaran Perjalanan'
              : currentUser.role === 'HR'
              ? 'Dashboard Kepegawaian & Cuti'
              : currentUser.role === 'Auditor / SPI'
              ? 'Dashboard Pengawasan Intern (SPI)'
              : `Selamat Datang, ${currentUser.name}`}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Unit: {currentUser.department} · NIP: <span className="font-mono">{currentUser.nip}</span> · Tahun Anggaran 2026
          </p>
        </div>

        {/* Quick Launch Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {(currentUser.role === 'Super Admin' || currentUser.role === 'Admin Sekretariat') && (
            <button
              onClick={() => setActiveModule('surat-masuk')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-medium rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Registrasi Surat Masuk
            </button>
          )}
          <button
            onClick={() => setActiveModule('surat-keluar')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium rounded-lg transition-colors shadow-xs"
          >
            <Send className="w-3.5 h-3.5" /> Buat Draft Surat
          </button>
          <button
            onClick={() => setActiveModule('perjalanan-dinas')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium rounded-lg transition-colors shadow-xs"
          >
            <Plane className="w-3.5 h-3.5" /> Pengajuan Dinas
          </button>
        </div>
      </div>

      {/* Corporate SLA Target & Executive KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: SLA Target */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Rata-rata Waktu Siklus Dokumen</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">2,1</span>
            <span className="text-xs text-slate-500">hari (Target: ≤ 2,5 hari)</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
            <TrendingUp className="w-3 h-3" /> Memenuhi Target SLA Korporat
          </div>
        </div>

        {/* Metric 2: Overdue Rate */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Tingkat Dokumen Overdue</span>
            <AlertCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">1,2%</span>
            <span className="text-xs text-slate-500">(Batas Maks: ≤ 2,0%)</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
            <ShieldCheck className="w-3 h-3" /> 0 Dokumen Terlambat Kritis
          </div>
        </div>

        {/* Metric 3: Penomoran Manual */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Surat Bernomor Manual</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">0%</span>
            <span className="text-xs text-slate-500">(100% Terverifikasi Sistem)</span>
          </div>
          <div className="mt-2 text-[11px] text-blue-700 font-medium">
            Atomic Serializer Terjamin
          </div>
        </div>

        {/* Metric 4: Arsip Digital */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Dokumen Terarsip Metadata</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">99,4%</span>
            <span className="text-xs text-slate-500">(Target: ≥ 98%)</span>
          </div>
          <div className="mt-2 text-[11px] text-indigo-700 font-medium">
            Arsip Statis & Dinamis Lengkap
          </div>
        </div>
      </div>

      {/* Main Grid: Action Required Panel & Realtime Work Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Action Required + Live Letter Queues */}
        <div className="lg:col-span-2 space-y-6">
          {/* Panel Action Required Berkromatik */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900">Tindakan Memerlukan Perhatian (Action Required)</h3>
              </div>
              <span className="text-[11px] text-slate-500">Prioritas Tingkat Tinggi</span>
            </div>

            <div className="p-5 space-y-3">
              {/* Item Merah - Deadline H-1 / Mendesak */}
              <div className="flex items-start gap-3 p-3.5 bg-rose-50/60 border border-rose-200 rounded-lg">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-600 mt-1 shrink-0"></div>
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-rose-950">
                      Disposisi: Bahan Paparan Rakor Kementerian BUMN
                    </span>
                    <span className="font-mono text-[11px] font-bold text-rose-700">Deadline: Besok</span>
                  </div>
                  <p className="text-rose-800 text-[11px] mt-0.5">
                    Harap selesaikan slide arsitektur e-Office & kesiapan integrasi SAP untuk Direktur Utama.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => setActiveModule('tasks')}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-medium transition-colors"
                    >
                      Buka Task Sekarang
                    </button>
                  </div>
                </div>
              </div>

              {/* Item Kuning - Approval Menunggu */}
              {pendingApprovals > 0 && (
                <div className="flex items-start gap-3 p-3.5 bg-amber-50/60 border border-amber-200 rounded-lg">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 shrink-0"></div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-amber-950">
                        {pendingApprovals} Surat Keluar Menunggu Approval Berjenjang
                      </span>
                      <span className="text-[11px] text-amber-800">Perlu Tindakan</span>
                    </div>
                    <p className="text-amber-800 text-[11px] mt-0.5">
                      Termasuk Nota Dinas Instruksi Migrasi e-Office dan Surat Tugas Pabrik Cilegon.
                    </p>
                    <div className="mt-2">
                      <button
                        onClick={() => setActiveModule('approval')}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-medium transition-colors"
                      >
                        Tinjau di Approval Workflow
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Item Hijau - Verifikasi LPJ & SPD */}
              <div className="flex items-start gap-3 p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-lg">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 mt-1 shrink-0"></div>
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-emerald-950">
                      Penerbitan SPD Otomatis & Posting SAP Berjalan Normal
                    </span>
                    <span className="text-[11px] text-emerald-800">100% Terintegrasi</span>
                  </div>
                  <p className="text-emerald-800 text-[11px] mt-0.5">
                    Surat Tugas dan formulir SPD terbit tanpa input ganda langsung dari modul pengajuan.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Surat Masuk Terkini */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-blue-900" />
                <h3 className="text-sm font-bold text-slate-900">Surat Masuk Hari Ini & Menunggu Tindak Lanjut</h3>
              </div>
              <button
                onClick={() => setActiveModule('surat-masuk')}
                className="text-xs text-blue-700 hover:text-blue-900 font-medium inline-flex items-center gap-1"
              >
                Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {inboundLetters.slice(0, 3).map((letter) => (
                <div key={letter.id} className="p-4 hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {letter.agendaNumber}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="text-xs text-slate-600">{letter.sender}</span>
                        {letter.urgency === 'Rahasia' && (
                          <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                            RAHASIA
                          </span>
                        )}
                        {letter.urgency === 'Segera' && (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            SEGERA
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-slate-900">{letter.subject}</p>
                      <p className="text-[11px] text-slate-500">
                        Diterima: {letter.receivedDate} · Batas Tindak Lanjut: <span className="font-mono">{letter.slaDeadline}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setSelectedDocumentForPreview(letter)}
                        className="px-2.5 py-1 text-xs text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
                      >
                        Pratinjau
                      </button>
                      <button
                        onClick={() => setActiveModule('disposisi')}
                        className="px-2.5 py-1 text-xs text-white bg-blue-900 hover:bg-blue-950 rounded transition-colors"
                      >
                        Disposisi
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Module Status Cards & Personal Stats */}
        <div className="space-y-6">
          {/* Quick Counter Grid */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Ringkasan Antrean Kerja
            </h3>
            <div className="space-y-3">
              <div
                onClick={() => setActiveModule('surat-masuk')}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-blue-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Inbox className="w-4 h-4 text-blue-900" />
                  <span className="text-xs font-medium text-slate-700">Surat Masuk Belum Selesai</span>
                </div>
                <span className="font-mono text-xs font-bold text-slate-900">{pendingInbound}</span>
              </div>

              <div
                onClick={() => setActiveModule('approval')}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-blue-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-medium text-slate-700">Menunggu Approval Saya</span>
                </div>
                <span className="font-mono text-xs font-bold text-amber-700">{pendingApprovals}</span>
              </div>

              <div
                onClick={() => setActiveModule('disposisi')}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-blue-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <GitBranch className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-medium text-slate-700">Disposisi Sedang Diproses</span>
                </div>
                <span className="font-mono text-xs font-bold text-slate-900">{activeDispositions}</span>
              </div>

              <div
                onClick={() => setActiveModule('perjalanan-dinas')}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-blue-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Plane className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-medium text-slate-700">Perjalanan Dinas Aktif</span>
                </div>
                <span className="font-mono text-xs font-bold text-slate-900">{activeTravel}</span>
              </div>

              <div
                onClick={() => setActiveModule('cuti')}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-blue-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <CalendarCheck className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-medium text-slate-700">Pengajuan Cuti / Izin</span>
                </div>
                <span className="font-mono text-xs font-bold text-slate-900">{pendingLeaves}</span>
              </div>
            </div>
          </div>

          {/* Quick Info PT BIN Integrity Box */}
          <div className="p-4 bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-xl shadow-xs space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-bold">Integritas & Keamanan Dokumen</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Seluruh penerbitan surat dan SPD menggunakan penomoran atomik otomatis, tanda tangan elektronik terenkripsi SHA-256, serta tercatat di audit trail SPI yang tidak dapat diubah (append-only).
            </p>
            <div className="pt-2">
              <button
                onClick={() => setActiveModule('audit-trail')}
                className="text-xs text-blue-300 hover:text-white underline font-medium"
              >
                Buka Log Audit Pengawasan Intern →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
