import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Download,
  Lock,
  Clock,
  User,
  CheckCircle2,
  FileText,
  Filter,
} from 'lucide-react';
import { useOffice } from '../../context/OfficeContext';

export const AuditTrailView: React.FC = () => {
  const { auditLogs, currentUser } = useOffice();
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterObject, setFilterObject] = useState<string>('all');

  const filteredLogs = auditLogs.filter((log) => {
    const matchSearch =
      log.userName.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.objectReference.toLowerCase().includes(search.toLowerCase()) ||
      log.userIp.toLowerCase().includes(search.toLowerCase());

    const matchAction = filterAction === 'all' || log.action === filterAction;
    const matchObj = filterObject === 'all' || log.objectType === filterObject;

    return matchSearch && matchAction && matchObj;
  });

  const exportAuditCSV = () => {
    const headers = 'ID,Waktu,User,Peran,IP,Aksi,Tipe Objek,Ref Objek,Rincian\n';
    const rows = filteredLogs
      .map(
        (l) =>
          `"${l.id}","${l.timestamp}","${l.userName}","${l.userRole}","${l.userIp}","${l.action}","${l.objectType}","${l.objectReference}","${l.details.replace(/"/g, '""')}"`
      )
      .join('\n');

    const csvContent = 'data:text/csv;charset=utf-8,' + headers + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Audit_Trail_SPI_PT_BIN_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Title & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Audit Trail & Log Pengawasan Intern (SPI)
            </h2>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
              <Lock className="w-3 h-3" /> APPEND-ONLY
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Rekaman aktivitas tidak dapat diubah atau dihapus, mencakup IP, timestamp atomik, dan diff perubahan data.
          </p>
        </div>

        <button
          onClick={exportAuditCSV}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
        >
          <Download className="w-3.5 h-3.5" /> Ekspor Log SPI (CSV)
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari user, aksi, nomor referensi surat, IP address..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
        </div>

        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none w-full md:w-auto"
        >
          <option value="all">Semua Jenis Aksi</option>
          <option value="LOGIN">LOGIN</option>
          <option value="CREATE_DOCUMENT">CREATE_DOCUMENT</option>
          <option value="DISPOSITION">DISPOSITION</option>
          <option value="APPROVE">APPROVE</option>
          <option value="ISSUE_NUMBER">ISSUE_NUMBER</option>
          <option value="SIGN_TTE">SIGN_TTE</option>
          <option value="GENERATE_SPD">GENERATE_SPD</option>
          <option value="VERIFY_LPJ">VERIFY_LPJ</option>
          <option value="ARCHIVE">ARCHIVE</option>
        </select>

        <select
          value={filterObject}
          onChange={(e) => setFilterObject(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none w-full md:w-auto"
        >
          <option value="all">Semua Objek</option>
          <option value="Surat Masuk">Surat Masuk</option>
          <option value="Surat Keluar">Surat Keluar</option>
          <option value="Disposisi">Disposisi</option>
          <option value="Perjalanan Dinas">Perjalanan Dinas</option>
          <option value="Cuti">Cuti</option>
          <option value="Rapat">Rapat</option>
          <option value="Arsip">Arsip</option>
        </select>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Waktu (ISO / WIB)</th>
                <th className="px-4 py-3">Pengguna & Peran</th>
                <th className="px-4 py-3">Aksi & Objek</th>
                <th className="px-4 py-3">Referensi Objek</th>
                <th className="px-4 py-3">Rincian Aktivitas</th>
                <th className="px-4 py-3">IP / Perangkat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px] text-slate-900">
                    {log.timestamp}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-bold text-slate-900 block">{log.userName}</span>
                    <span className="text-[10px] text-slate-500 font-medium">{log.userRole}</span>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                        log.action === 'SIGN_TTE' || log.action === 'APPROVE'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : log.action === 'ISSUE_NUMBER' || log.action === 'GENERATE_SPD'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : log.action === 'REJECT' || log.action === 'REVISION'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {log.action}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{log.objectType}</span>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-800 font-semibold text-xs">
                    {log.objectReference}
                  </td>

                  <td className="px-4 py-3 max-w-[340px]">
                    <p className="text-slate-800 text-xs leading-snug">{log.details}</p>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap font-mono text-[10px] text-slate-500">
                    <div>{log.userIp}</div>
                    <div className="text-[9px] text-slate-400">{log.device}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
