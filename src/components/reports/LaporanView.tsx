import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Clock,
  CheckCircle2,
  TrendingUp,
  FileText,
  Plane,
  CalendarCheck,
} from 'lucide-react';
import { useOffice } from '../../context/OfficeContext';

export const LaporanView: React.FC = () => {
  const { inboundLetters, outgoingLetters, travelRequests, leaveRequests } = useOffice();
  const [reportPeriod, setReportPeriod] = useState('2026-Q3');

  const exportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Kategori,Total Dokumen,Selesai Sesuai SLA,Persentase SLA,Status\n' +
      `Surat Masuk,${inboundLetters.length},${inboundLetters.length},98.5%,Optimal\n` +
      `Surat Keluar,${outgoingLetters.length},${outgoingLetters.length},99.1%,Optimal\n` +
      `Perjalanan Dinas (SPD),${travelRequests.length},${travelRequests.length},100%,Tepat Waktu\n` +
      `Pengajuan Cuti,${leaveRequests.length},${leaveRequests.length},100%,Tepat Waktu\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Kinerja_eOffice_BIN_${reportPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Title & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Laporan Kinerja & Monitoring SLA Korporat
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluasi kecepatan siklus dokumen, rasio overdue, realisasi biaya SPD, dan kepatuhan administrasi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={reportPeriod}
            onChange={(e) => setReportPeriod(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700"
          >
            <option value="2026-Q3">Kuartal III 2026</option>
            <option value="2026-Q2">Kuartal II 2026</option>
            <option value="2026-Tahun">Tahun Berjalan 2026</option>
          </select>

          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" /> Ekspor Data (CSV)
          </button>
        </div>
      </div>

      {/* Target Metrik vs Realisasi */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Rata-Rata Waktu Siklus (SLA)</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-slate-900">2,1</span>
            <span className="text-xs text-slate-500">Hari Kerja</span>
          </div>
          <p className="text-[11px] text-emerald-700 font-medium">
            ✓ Target ≤ 2,5 Hari Terpenuhi (Efisiensi 16%)
          </p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Tingkat Keterlambatan (Overdue)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-slate-900">1,2%</span>
            <span className="text-xs text-slate-500">dari total dokumen</span>
          </div>
          <p className="text-[11px] text-emerald-700 font-medium">
            ✓ Target Batas Maks ≤ 2,0% Terjaga
          </p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Penomoran Manual Tanpa Sistem</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-slate-900">0%</span>
            <span className="text-xs text-slate-500">Nir-Manual</span>
          </div>
          <p className="text-[11px] text-blue-700 font-medium">
            ✓ Target 0% Nomor Manual Tercapai Penuh
          </p>
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Distribusi Dokumen & Beban Kerja Per Modul
          </h3>
          <span className="text-xs text-slate-400">Periode: {reportPeriod}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Modul Alur Kerja</th>
                <th className="px-4 py-3">Volume Dokumen</th>
                <th className="px-4 py-3">Rata-rata Penyelesaian</th>
                <th className="px-4 py-3">Kepatuhan SLA</th>
                <th className="px-4 py-3">Status Evaluasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr className="hover:bg-slate-50/70">
                <td className="px-4 py-3 font-semibold text-slate-900">Surat Masuk & Disposisi</td>
                <td className="px-4 py-3 font-mono">{inboundLetters.length} berkas</td>
                <td className="px-4 py-3 font-mono">1,8 Hari</td>
                <td className="px-4 py-3 font-mono text-emerald-700 font-bold">98,8%</td>
                <td className="px-4 py-3">
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    Sangat Baik
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/70">
                <td className="px-4 py-3 font-semibold text-slate-900">Surat Keluar & TTE</td>
                <td className="px-4 py-3 font-mono">{outgoingLetters.length} berkas</td>
                <td className="px-4 py-3 font-mono">2,3 Hari</td>
                <td className="px-4 py-3 font-mono text-emerald-700 font-bold">99,2%</td>
                <td className="px-4 py-3">
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    Sangat Baik
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/70">
                <td className="px-4 py-3 font-semibold text-slate-900">Perjalanan Dinas (SPD & LPJ)</td>
                <td className="px-4 py-3 font-mono">{travelRequests.length} pengajuan</td>
                <td className="px-4 py-3 font-mono">1,2 Hari</td>
                <td className="px-4 py-3 font-mono text-emerald-700 font-bold">100%</td>
                <td className="px-4 py-3">
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    Optimal (Tanpa Duplikasi)
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/70">
                <td className="px-4 py-3 font-semibold text-slate-900">Pengajuan Cuti & Izin</td>
                <td className="px-4 py-3 font-mono">{leaveRequests.length} permohonan</td>
                <td className="px-4 py-3 font-mono">0,8 Hari</td>
                <td className="px-4 py-3 font-mono text-emerald-700 font-bold">100%</td>
                <td className="px-4 py-3">
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    Optimal
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
