import React, { useState } from 'react';
import {
  Archive,
  Search,
  Lock,
  Download,
  Eye,
  Clock,
  ShieldCheck,
  FileText,
  Calendar,
  Filter,
} from 'lucide-react';
import { useOffice } from '../../context/OfficeContext';

export const ArsipDigitalView: React.FC = () => {
  const { archives, currentUser, setSelectedDocumentForPreview } = useOffice();

  const [search, setSearch] = useState('');
  const [filterConfidentiality, setFilterConfidentiality] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const canAccessConfidential =
    currentUser.role === 'Direksi' ||
    currentUser.role === 'Super Admin' ||
    currentUser.role === 'Admin Sekretariat' ||
    currentUser.role === 'Auditor / SPI';

  const filteredArchives = archives.filter((item) => {
    const matchSearch =
      item.documentNumber.toLowerCase().includes(search.toLowerCase()) ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      item.unit.toLowerCase().includes(search.toLowerCase());

    const matchConf = filterConfidentiality === 'all' || item.confidentiality === filterConfidentiality;
    const matchCat = filterCategory === 'all' || item.category === filterCategory;

    return matchSearch && matchConf && matchCat;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Pusat Kearsipan Digital Korporat (Digital Archive)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Penyimpanan berkas permanen, jadwal retensi arsip, metadata audit, dan pengendalian akses klasifikasi.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nomor arsip, judul dokumen, unit kerja, atau pemilik berkas..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
        </div>

        <select
          value={filterConfidentiality}
          onChange={(e) => setFilterConfidentiality(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none w-full md:w-auto"
        >
          <option value="all">Semua Klasifikasi Keamanan</option>
          <option value="Biasa">Biasa</option>
          <option value="Terbatas">Terbatas</option>
          <option value="Rahasia">Rahasia</option>
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none w-full md:w-auto"
        >
          <option value="all">Semua Kategori Arsip</option>
          <option value="Persuratan Resmi">Persuratan Resmi</option>
          <option value="Keputusan Direksi">Keputusan Direksi</option>
          <option value="Pedoman Kebijakan">Pedoman Kebijakan</option>
        </select>
      </div>

      {/* Archives Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">No. Arsip & Tanggal</th>
                <th className="px-4 py-3">Judul Dokumen Terarsip</th>
                <th className="px-4 py-3">Klasifikasi & Unit</th>
                <th className="px-4 py-3">Jadwal Retensi</th>
                <th className="px-4 py-3">Ukuran & Versi</th>
                <th className="px-4 py-3">Pengesah</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredArchives.map((arc) => {
                const isConfidential = arc.confidentiality === 'Rahasia';
                const isBlocked = isConfidential && !canAccessConfidential;

                return (
                  <tr key={arc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-900 block">{arc.documentNumber}</span>
                      <span className="text-[10px] text-slate-500 font-mono">Dibuat: {arc.dateCreated}</span>
                    </td>

                    <td className="px-4 py-3 max-w-[300px]">
                      {isBlocked ? (
                        <div className="flex items-center gap-1.5 text-rose-700 font-medium">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Dokumen Rahasia (Akses Dibatasi)</span>
                        </div>
                      ) : (
                        <>
                          <div className="font-semibold text-slate-900 line-clamp-2">{arc.title}</div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            SHA-256: {arc.hash.slice(0, 20)}...
                          </span>
                        </>
                      )}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {arc.confidentiality === 'Rahasia' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-200 rounded">
                          <Lock className="w-3 h-3" /> RAHASIA
                        </span>
                      ) : arc.confidentiality === 'Terbatas' ? (
                        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded">
                          TERBATAS
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium text-slate-600 bg-slate-100 rounded">
                          BIASA
                        </span>
                      )}
                      <span className="text-[11px] text-slate-500 block mt-0.5">{arc.unit}</span>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-bold text-slate-800">{arc.retentionPeriodYears} Tahun</span>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        Kedaluwarsa: {arc.retentionExpiryDate}
                      </span>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-slate-800 font-medium">{arc.fileSize}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">v{arc.version}</span>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-slate-900 font-medium">
                      {arc.approvedBy}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedDocumentForPreview(arc)}
                          disabled={isBlocked}
                          className={`p-1.5 rounded transition-colors ${
                            isBlocked ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                          title="Pratinjau Arsip"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => alert(`Mengunduh berkas ${arc.fileName}...`)}
                          disabled={isBlocked}
                          className={`p-1.5 rounded transition-colors ${
                            isBlocked ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                          title="Unduh Berkas"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
