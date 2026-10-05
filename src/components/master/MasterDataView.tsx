import React, { useState } from 'react';
import {
  Settings,
  Users,
  Building2,
  FileCode,
  Shield,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { useOffice } from '../../context/OfficeContext';

export const MasterDataView: React.FC = () => {
  const { users, numberingRules } = useOffice();
  const [activeTab, setActiveTab] = useState<'employees' | 'units' | 'letterCodes'>('employees');
  const [search, setSearch] = useState('');

  const units = [
    { code: 'DIR', name: 'Direksi & Dewan Komisaris', head: 'Ir. H. Hendrawan Suprayogi, M.M.', members: 4 },
    { code: 'SEKPER', name: 'Sekretariat Perusahaan', head: 'Dra. Ratna Indrayani, M.Si.', members: 12 },
    { code: 'DTI', name: 'Divisi Teknologi Informasi', head: 'Arif Wicaksono, S.T., M.Kom.', members: 28 },
    { code: 'DSDM', name: 'Divisi SDM & Organisasi', head: 'Rina Wulandari, S.Psi., M.M.', members: 18 },
    { code: 'DKEU', name: 'Divisi Keuangan & Akuntansi', head: 'Budi Santoso, S.E., Ak., CA', members: 22 },
    { code: 'SPI', name: 'Satuan Pengawasan Intern', head: 'Drs. Suryo Broto, CFrA', members: 8 },
  ];

  const letterCodes = [
    { code: 'SK', name: 'Surat Keputusan', authority: 'Direktur Utama', retention: '30 Tahun' },
    { code: 'SE', name: 'Surat Edaran', authority: 'Direksi / Sekper', retention: '5 Tahun' },
    { code: 'ND', name: 'Nota Dinas Internal', authority: 'Kepala Divisi', retention: '3 Tahun' },
    { code: 'ST', name: 'Surat Tugas Kedinasan', authority: 'Direktur / Kadiv', retention: '5 Tahun' },
    { code: 'SPD', name: 'Surat Perintah Perjalanan Dinas', authority: 'Direksi / Keuangan', retention: '10 Tahun' },
    { code: 'UND', name: 'Undangan Rapat Kedinasan', authority: 'Sekper / Kadiv', retention: '2 Tahun' },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Master Data & Pengaturan Organisasi PT BIN
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Struktur organisasi, hierarki pejabat dan atasan langsung, klasifikasi kode surat, serta kontrol RBAC.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              activeTab === 'employees' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Data Pegawai ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('units')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              activeTab === 'units' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Unit Kerja ({units.length})
          </button>
          <button
            onClick={() => setActiveTab('letterCodes')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              activeTab === 'letterCodes' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kode Dokumen ({letterCodes.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Pegawai */}
      {activeTab === 'employees' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Nama Pegawai & NIP</th>
                  <th className="px-4 py-3">Jabatan Struktural</th>
                  <th className="px-4 py-3">Unit & Divisi</th>
                  <th className="px-4 py-3">Peran Akses (RBAC)</th>
                  <th className="px-4 py-3">Email & Kontak</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <span className="font-mono text-[10px] text-slate-400">{u.nip}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-800">
                      {u.title}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-semibold text-slate-800">{u.unit}</span>
                      <span className="text-[11px] text-slate-500 block">{u.department}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold text-blue-900 bg-blue-50 border border-blue-200 rounded">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px] text-slate-600">
                      {u.email}
                      <span className="block text-slate-400">{u.phone}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Aktif
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Unit Kerja */}
      {activeTab === 'units' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {units.map((unit) => (
            <div key={unit.code} className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {unit.code}
                </span>
                <span className="text-[11px] text-slate-500">{unit.members} Pegawai</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{unit.name}</h3>
                <p className="text-xs text-slate-500 mt-1">Pimpinan: <strong className="text-slate-800">{unit.head}</strong></p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Kode Dokumen */}
      {activeTab === 'letterCodes' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Kode Dokumen</th>
                  <th className="px-4 py-3">Nama Jenis Dokumen</th>
                  <th className="px-4 py-3">Kewenangan Penandatanganan</th>
                  <th className="px-4 py-3">Masa Retensi Arsip</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {letterCodes.map((item) => (
                  <tr key={item.code} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap font-mono font-bold text-blue-900">
                      {item.code}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-semibold text-slate-900">
                      {item.name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                      {item.authority}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-800">
                      {item.retention}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Baku
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
