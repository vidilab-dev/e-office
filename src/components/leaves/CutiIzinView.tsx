import React, { useState } from 'react';
import {
  CalendarCheck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  X,
  FileCheck,
} from 'lucide-react';
import { useOffice } from '../../context/OfficeContext';
import { LeaveType } from '../../types';

export const CutiIzinView: React.FC = () => {
  const {
    currentUser,
    users,
    leaveRequests,
    leaveBalances,
    submitLeaveRequest,
    actOnLeaveRequest,
  } = useOffice();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  const myBalance = leaveBalances[currentUser.id] || {
    employeeId: currentUser.id,
    annualTotal: 12,
    annualUsed: 2,
    annualRemaining: 10,
    grandTotal: 30,
    grandUsed: 0,
    grandRemaining: 30,
    sickUsed: 0,
    specialUsed: 0,
  };

  // Form State
  const [leaveType, setLeaveType] = useState<LeaveType>('Cuti Tahunan');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 9 * 86400000).toISOString().split('T')[0]
  );
  const [daysCount, setDaysCount] = useState(3);
  const [reason, setReason] = useState('');
  const [substituteId, setSubstituteId] = useState('usr-3');

  const handleDaysChange = (start: string, end: string) => {
    const d1 = new Date(start);
    const d2 = new Date(end);
    const diff = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24)) + 1);
    setDaysCount(diff);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;

    const substitute = users.find((u) => u.id === substituteId) || users[2];

    submitLeaveRequest({
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      employeeTitle: currentUser.title,
      unit: currentUser.unit,
      type: leaveType,
      startDate,
      endDate,
      daysCount,
      reason,
      substituteEmployeeId: substitute.id,
      substituteEmployeeName: substitute.name,
    });

    setIsModalOpen(false);
    setReason('');
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Administrasi Cuti & Izin Pegawai PT BIN
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Perhitungan saldo otomatis, validasi hari kerja, pendelegasian tugas (handover), dan verifikasi SDM.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" /> Ajukan Cuti / Izin
        </button>
      </div>

      {/* Saldo Cuti Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cuti Tahunan */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Sisa Cuti Tahunan 2026</span>
            <CalendarCheck className="w-4 h-4 text-blue-900" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-slate-900 tabular-nums">
              {myBalance.annualRemaining}
            </span>
            <span className="text-xs text-slate-500">hari (dari {myBalance.annualTotal} hari)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Terpakai: {myBalance.annualUsed} hari</p>
        </div>

        {/* Cuti Besar */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Sisa Cuti Besar (5 Tahunan)</span>
            <Calendar className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-slate-900 tabular-nums">
              {myBalance.grandRemaining}
            </span>
            <span className="text-xs text-slate-500">hari (dari {myBalance.grandTotal} hari)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Masa kerja memenuhi syarat</p>
        </div>

        {/* Cuti Sakit */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Cuti Sakit Terpakai</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-slate-900 tabular-nums">
              {myBalance.sickUsed}
            </span>
            <span className="text-xs text-slate-500">hari (Tahun 2026)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Wajib lampiran surat dokter</p>
        </div>

        {/* Izin Khusus */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Izin Alasan Penting</span>
            <User className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-slate-900 tabular-nums">
              {myBalance.specialUsed}
            </span>
            <span className="text-xs text-slate-500">hari terpakai</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Pernikahan, duka cita, melahirkan</p>
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Riwayat & Status Pengajuan Cuti / Izin
          </h3>
          <span className="text-xs text-slate-500">
            Total {leaveRequests.length} pengajuan terdata
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Nama Pegawai & NIP</th>
                <th className="px-4 py-3">Jenis & Alasan</th>
                <th className="px-4 py-3">Tanggal Pelaksanaan</th>
                <th className="px-4 py-3">Durasi</th>
                <th className="px-4 py-3">Pegawai Pengganti (Handover)</th>
                <th className="px-4 py-3">Status Pengajuan</th>
                <th className="px-4 py-3 text-right">Aksi Approval</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {leaveRequests.map((req) => {
                const canApproveAtasan =
                  (currentUser.role === 'Atasan' || currentUser.role === 'Direksi') &&
                  req.status === 'Diajukan';

                const canVerifyHR =
                  (currentUser.role === 'HR' || currentUser.role === 'Super Admin') &&
                  req.status === 'Disetujui Atasan';

                return (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{req.employeeName}</div>
                      <div className="text-[11px] text-slate-500">{req.employeeTitle}</div>
                    </td>

                    <td className="px-4 py-3 max-w-[240px]">
                      <span className="font-semibold text-slate-800 block">{req.type}</span>
                      <p className="text-[11px] text-slate-600 line-clamp-1">{req.reason}</p>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-700">
                      {req.startDate} s/d {req.endDate}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-bold text-slate-900">{req.daysCount}</span> hari kerja
                      <span className="text-[10px] text-slate-400 block">
                        (Sisa setelahnya: {req.balanceAfter})
                      </span>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                      {req.substituteEmployeeName}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded ${
                          req.status === 'Diverifikasi HR'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : req.status === 'Disetujui Atasan'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : req.status === 'Ditolak'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {canApproveAtasan && (
                          <>
                            <button
                              onClick={() => actOnLeaveRequest(req.id, 'reject', 'Ditolak')}
                              className="px-2 py-1 text-[11px] text-rose-700 hover:bg-rose-50 rounded"
                            >
                              Tolak
                            </button>
                            <button
                              onClick={() => actOnLeaveRequest(req.id, 'approve_atasan')}
                              className="px-2.5 py-1 text-[11px] font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded shadow-xs"
                            >
                              Setujui Atasan
                            </button>
                          </>
                        )}

                        {canVerifyHR && (
                          <button
                            onClick={() => actOnLeaveRequest(req.id, 'verify_hr')}
                            className="px-2.5 py-1 text-[11px] font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded shadow-xs"
                          >
                            Verifikasi Saldo HR
                          </button>
                        )}

                        {!canApproveAtasan && !canVerifyHR && (
                          <span className="text-[11px] text-slate-400 italic">Terproses</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Pengajuan Cuti / Izin */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Form Pengajuan Cuti / Izin Pegawai</h3>
                <p className="text-xs text-slate-500">Pemohon: {currentUser.name} ({currentUser.title})</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Cuti / Izin</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Cuti Tahunan">Cuti Tahunan (Sisa: {myBalance.annualRemaining} hari)</option>
                  <option value="Cuti Besar">Cuti Besar (Sisa: {myBalance.grandRemaining} hari)</option>
                  <option value="Cuti Sakit">Cuti Sakit</option>
                  <option value="Izin Alasan Penting">Izin Alasan Penting (Keluarga/Menikah)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      handleDaysChange(e.target.value, endDate);
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Selesai</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      handleDaysChange(startDate, e.target.value);
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Saldo Calculation Preview Box */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Jumlah Hari yang Diajukan:</span>
                  <span className="font-bold text-slate-900">{daysCount} Hari Kerja</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Saldo Cuti Saat Ini:</span>
                  <span className="text-slate-900 font-semibold">{myBalance.annualRemaining} Hari</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-blue-200">
                  <span className="font-semibold text-blue-950">Sisa Saldo Setelah Disetujui:</span>
                  <span className="font-bold text-blue-900">
                    {Math.max(0, myBalance.annualRemaining - daysCount)} Hari
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pegawai Pengganti (Handover Tugas)
                </label>
                <select
                  value={substituteId}
                  onChange={(e) => setSubstituteId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  {users
                    .filter((u) => u.id !== currentUser.id)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} — {u.title} ({u.unit})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alasan Pengajuan</label>
                <textarea
                  rows={3}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Keterangan keperluan cuti..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Kirim Pengajuan ke Atasan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
