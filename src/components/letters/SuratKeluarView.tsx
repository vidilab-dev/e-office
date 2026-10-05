import React, { useState } from 'react';
import {
  Send,
  Plus,
  Search,
  Eye,
  FileCheck,
  CheckCircle,
  Hash,
  ShieldCheck,
  Clock,
  QrCode,
  X,
  FileText,
} from 'lucide-react';
import { useOffice } from '../../context/OfficeContext';
import { OutgoingLetter, OutgoingLetterType, LetterUrgency } from '../../types';

export const SuratKeluarView: React.FC = () => {
  const {
    outgoingLetters,
    currentUser,
    templates,
    createOutgoingDraft,
    issueLetterNumber,
    applyTteSignature,
    setSelectedDocumentForPreview,
    setQrVerificationModalData,
    setActiveModule,
  } = useOffice();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);

  // Form State
  const [draftType, setDraftType] = useState<OutgoingLetterType>('Surat Dinas');
  const [recipient, setRecipient] = useState('');
  const [recipientOrg, setRecipientOrg] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [subject, setSubject] = useState('');
  const [urgency, setUrgency] = useState<LetterUrgency>('Biasa');
  const [content, setContent] = useState('');
  const [lampiranText, setLampiranText] = useState('1 (satu) Berkas');
  const [tembusanText, setTembusanText] = useState('1. Direktur Utama\n2. Arsip Perusahaan');

  // Load from template handler
  const handleTemplateSelect = (templateId: string) => {
    const tpl = templates.find((t) => t.id === templateId);
    if (tpl) {
      setDraftType(tpl.type);
      setSubject(tpl.defaultSubject);
      setContent(tpl.defaultContent);
      setLampiranText(tpl.defaultLampiran);
      setTembusanText(tpl.defaultTembusan);
    }
  };

  const handleCreateDraftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !recipient) return;

    createOutgoingDraft({
      type: draftType,
      recipient,
      recipientOrg,
      isInternal,
      subject,
      urgency,
      content,
      lampiranText,
      tembusanText,
    });

    setIsDraftModalOpen(false);
    // Reset
    setRecipient('');
    setRecipientOrg('');
    setSubject('');
    setContent('');
  };

  const filteredLetters = outgoingLetters.filter((l) => {
    const matchSearch =
      (l.letterNumber && l.letterNumber.toLowerCase().includes(search.toLowerCase())) ||
      l.draftNumber.toLowerCase().includes(search.toLowerCase()) ||
      l.subject.toLowerCase().includes(search.toLowerCase()) ||
      l.recipient.toLowerCase().includes(search.toLowerCase());

    const matchType = filterType === 'all' || l.type === filterType;

    return matchSearch && matchType;
  });

  return (
    <div className="space-y-5">
      {/* Title & Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Surat Keluar, Internal & Eksternal
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Penyusunan draft dari template, review berjenjang, penomoran terpadu, dan TTE tersertifikasi.
          </p>
        </div>

        <button
          onClick={() => setIsDraftModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" /> Buat Draft Surat Baru
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nomor surat resmi, no draft, penerima, atau perihal..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none w-full md:w-auto"
        >
          <option value="all">Semua Jenis Surat</option>
          <option value="Surat Dinas">Surat Dinas</option>
          <option value="Nota Dinas">Nota Dinas Internal</option>
          <option value="Surat Keputusan">Surat Keputusan (SK)</option>
          <option value="Surat Tugas">Surat Tugas</option>
          <option value="Memo Internal">Memo Internal</option>
          <option value="Undangan">Undangan Rapat</option>
        </select>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">No. Surat / No. Draft</th>
                <th className="px-4 py-3">Jenis & Tanggal</th>
                <th className="px-4 py-3">Tujuan / Penerima</th>
                <th className="px-4 py-3">Perihal Dokumen</th>
                <th className="px-4 py-3">Status Dokumen</th>
                <th className="px-4 py-3">TTE & Keabsahan</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLetters.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada draft atau surat keluar yang sesuai kriteria.
                  </td>
                </tr>
              ) : (
                filteredLetters.map((letter) => {
                  return (
                    <tr key={letter.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Letter Number or Draft */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {letter.letterNumber ? (
                          <div>
                            <span className="font-mono font-bold text-slate-900 block">{letter.letterNumber}</span>
                            <span className="text-[10px] text-slate-400 font-mono">Ref Draft: {letter.draftNumber}</span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-mono font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                              {letter.draftNumber}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Belum bernomor resmi</span>
                          </div>
                        )}
                      </td>

                      {/* Type & Date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 block">{letter.type}</span>
                        <span className="text-[11px] text-slate-500">{letter.date} · {letter.unit}</span>
                      </td>

                      {/* Recipient */}
                      <td className="px-4 py-3 max-w-[200px]">
                        <div className="font-medium text-slate-900 truncate">{letter.recipient}</div>
                        <div className="text-[11px] text-slate-500 truncate">{letter.recipientOrg}</div>
                        <span className="text-[10px] text-slate-400">
                          {letter.isInternal ? 'Internal PT BIN' : 'Eksternal'}
                        </span>
                      </td>

                      {/* Subject */}
                      <td className="px-4 py-3 max-w-[280px]">
                        <div className="font-medium text-slate-900 line-clamp-2">{letter.subject}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Konseptor: {letter.creatorName}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded ${
                            letter.status === 'TTE Diterbitkan' || letter.status === 'Terkirim'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : letter.status === 'Disetujui' || letter.status === 'Nomor Diterbitkan'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : letter.status === 'Ditolak'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {letter.status}
                        </span>
                      </td>

                      {/* TTE Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {letter.tteStatus === 'Sudah TTE' ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" /> BSrE VALID
                            </span>
                            <p className="text-[10px] font-mono text-slate-500">{letter.qrVerifyCode}</p>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            {letter.tteStatus}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedDocumentForPreview(letter)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                            title="Pratinjau Surat Resmi"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {letter.qrVerifyCode && (
                            <button
                              onClick={() =>
                                setQrVerificationModalData({
                                  code: letter.qrVerifyCode,
                                  title: letter.subject,
                                })
                              }
                              className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                              title="Cek Validitas QR Code"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                          )}

                          {/* Action button: Terbitkan Nomor if Disetujui */}
                          {letter.status === 'Disetujui' && (
                            <button
                              onClick={() => issueLetterNumber(letter.id)}
                              className="px-2 py-1 text-[11px] font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded transition-colors flex items-center gap-1"
                            >
                              <Hash className="w-3 h-3" /> Terbitkan Nomor
                            </button>
                          )}

                          {/* Action button: TTE if Nomor Diterbitkan */}
                          {letter.status === 'Nomor Diterbitkan' &&
                            (currentUser.role === 'Direksi' || currentUser.role === 'Atasan') && (
                              <button
                                onClick={() => applyTteSignature(letter.id)}
                                className="px-2 py-1 text-[11px] font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded transition-colors flex items-center gap-1"
                              >
                                <ShieldCheck className="w-3 h-3" /> Bubuhkan TTE
                              </button>
                            )}

                          {letter.status === 'Menunggu Approval' && (
                            <button
                              onClick={() => setActiveModule('approval')}
                              className="px-2 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                            >
                              Alur Approval
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Buat Draft Surat Keluar Baru */}
      {isDraftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Penyusunan Draft Surat Keluar Baru</h3>
                <p className="text-xs text-slate-500">
                  Gunakan template standar korporat PT BIN untuk keseragaman format
                </p>
              </div>
              <button onClick={() => setIsDraftModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDraftSubmit} className="p-6 space-y-4">
              {/* Template quick loader */}
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg">
                <label className="block text-xs font-bold text-blue-950 mb-1">
                  Pilih Template Dokumen Korporat (Opsional):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {templates.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleTemplateSelect(tpl.id)}
                      className="px-2.5 py-1.5 text-xs text-left bg-white border border-blue-200 hover:border-blue-500 rounded font-medium text-slate-800 transition-colors shadow-2xs"
                    >
                      <span className="block truncate font-semibold">{tpl.name}</span>
                      <span className="text-[10px] text-slate-400">{tpl.version}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Surat</label>
                  <select
                    value={draftType}
                    onChange={(e) => setDraftType(e.target.value as OutgoingLetterType)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Surat Dinas">Surat Dinas</option>
                    <option value="Nota Dinas">Nota Dinas</option>
                    <option value="Surat Keputusan">Surat Keputusan</option>
                    <option value="Surat Edaran">Surat Edaran</option>
                    <option value="Surat Tugas">Surat Tugas</option>
                    <option value="Memo Internal">Memo Internal</option>
                    <option value="Undangan">Undangan Rapat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sifat Surat</label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as LetterUrgency)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Biasa">Biasa</option>
                    <option value="Penting">Penting</option>
                    <option value="Segera">Segera</option>
                    <option value="Rahasia">Rahasia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jalur Distribusi</label>
                  <select
                    value={isInternal ? 'internal' : 'eksternal'}
                    onChange={(e) => setIsInternal(e.target.value === 'internal')}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="eksternal">Eksternal (Mitra/Kementerian)</option>
                    <option value="internal">Internal PT BIN</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Penerima / Jabatan</label>
                  <input
                    type="text"
                    required
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Contoh: Sekretaris Jenderal atau Seluruh Kepala Divisi"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Instansi / Unit Penerima</label>
                  <input
                    type="text"
                    required
                    value={recipientOrg}
                    onChange={(e) => setRecipientOrg(e.target.value)}
                    placeholder="Contoh: Kementerian BUMN RI atau Internal PT BIN"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Perihal Dokumen</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ringkasan pokok perihal surat resmi..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Isi Surat / Konten Resmi</label>
                <textarea
                  rows={6}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Ketik narasi resmi isi surat di sini..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 font-sans leading-relaxed"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan Lampiran</label>
                  <input
                    type="text"
                    value={lampiranText}
                    onChange={(e) => setLampiranText(e.target.value)}
                    placeholder="Contoh: 1 (satu) Berkas Proposal"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tembusan Dokumen</label>
                  <input
                    type="text"
                    value={tembusanText}
                    onChange={(e) => setTembusanText(e.target.value)}
                    placeholder="1. Direktur Utama\n2. Arsip"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsDraftModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Ajukan Draft ke Approval Workflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
