import React, { useState } from 'react';
import {
  Hash,
  Search,
  Lock,
  QrCode,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Clock,
  Settings,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useOffice } from '../../context/OfficeContext';

export const PenomoranSuratView: React.FC = () => {
  const { letterNumbers, numberingRules, setQrVerificationModalData } = useOffice();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const filteredNumbers = letterNumbers.filter((item) => {
    const matchSearch =
      item.formattedNumber.toLowerCase().includes(search.toLowerCase()) ||
      item.documentSubject.toLowerCase().includes(search.toLowerCase()) ||
      item.issuedBy.toLowerCase().includes(search.toLowerCase());

    const matchStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Buku Register Penomoran Surat Otomatis
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Penerbitan nomor surat atomik sistemik, anti-duplikasi, sequence generator, dan verifikasi QR Code.
          </p>
        </div>

        <button
          onClick={() => setIsConfigModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg transition-colors shadow-xs"
        >
          <Settings className="w-4 h-4 text-slate-500" /> Konfigurasi Format Nomor
        </button>
      </div>

      {/* Rules Snapshot Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {numberingRules.map((rule) => (
          <div key={rule.unitCode + rule.typeCode} className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{rule.unitCode} ({rule.typeCode})</span>
              <Lock className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="mt-2">
              <span className="font-mono text-xs text-blue-900 font-bold block">{rule.pattern}</span>
              <p className="text-[11px] text-slate-500 mt-1">
                Sequence Terakhir: <strong className="font-mono text-slate-900">{rule.currentSequence}</strong> ({rule.year})
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nomor surat resmi terbit, perihal, atau pejabat penerbit..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none w-full md:w-auto"
        >
          <option value="all">Semua Status Nomor</option>
          <option value="Aktif">Aktif (Terpakai)</option>
          <option value="Dibatalkan / Void">Dibatalkan / Void</option>
        </select>
      </div>

      {/* Register Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">No. Urut</th>
                <th className="px-4 py-3">Format Nomor Resmi</th>
                <th className="px-4 py-3">Perihal Dokumen Terkait</th>
                <th className="px-4 py-3">Waktu Penerbitan</th>
                <th className="px-4 py-3">Diterbitkan Oleh</th>
                <th className="px-4 py-3">Status Nomor</th>
                <th className="px-4 py-3 text-right">Verifikasi QR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredNumbers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada nomor surat yang cocok.
                  </td>
                </tr>
              ) : (
                filteredNumbers.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Seq */}
                    <td className="px-4 py-3 whitespace-nowrap font-mono font-bold text-slate-500">
                      #{String(record.sequence).padStart(3, '0')}
                    </td>

                    {/* Formatted Number */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        {record.formattedNumber}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        Unit: {record.unitCode} · Jenis: {record.typeCode}
                      </span>
                    </td>

                    {/* Subject */}
                    <td className="px-4 py-3 max-w-[280px]">
                      <div className="font-medium text-slate-900 line-clamp-2">
                        {record.documentSubject}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Hash: {record.hash.slice(0, 16)}...
                      </span>
                    </td>

                    {/* Issued At */}
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-600">
                      {record.issuedAt}
                    </td>

                    {/* Issued By */}
                    <td className="px-4 py-3 whitespace-nowrap text-slate-900 font-medium">
                      {record.issuedBy}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {record.status === 'Aktif' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Terkunci & Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-600" /> Void / Batal
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <button
                        onClick={() =>
                          setQrVerificationModalData({
                            code: record.formattedNumber,
                            title: record.documentSubject,
                          })
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors font-medium"
                      >
                        <QrCode className="w-3.5 h-3.5" /> Validasi QR
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Konfigurasi Format Nomor Surat */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Konfigurasi Format Penomoran Surat</h3>
                <p className="text-xs text-slate-500">Aturan pembentukan nomor otomatis standar korporat PT BIN</p>
              </div>
              <button onClick={() => setIsConfigModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-slate-800 space-y-1 leading-relaxed">
                <span className="font-bold text-blue-950 block">Variabel Pola Format:</span>
                <p className="font-mono text-[11px] text-blue-900">
                  {'{SEQ}'} = Urutan Nomor (3 Digit, misal: 048)<br />
                  {'{UNIT}'} = Kode Unit Kerja (misal: BIN-SEK, BIN-DTI)<br />
                  {'{TYPE}'} = Kode Jenis Surat (misal: SK, ND, ST, SPD)<br />
                  {'{ROMAN_MONTH}'} = Angka Bulan Romawi (misal: X)<br />
                  {'{YEAR}'} = Tahun Anggaran Berjalan (misal: 2026)
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900">Aturan Aktif Unit:</h4>
                {numberingRules.map((rule, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <div className="flex justify-between font-semibold text-slate-800">
                      <span>{rule.unitCode} ({rule.typeCode})</span>
                      <span className="font-mono text-blue-900">{rule.pattern}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>Reset Otomatis Awal Tahun: Ya (1 Jan {rule.year + 1})</span>
                      <span>Next Serial: {rule.currentSequence + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 text-right">
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium rounded-lg"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
