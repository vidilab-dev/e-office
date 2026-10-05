import React, { useState } from 'react';
import {
  Inbox,
  Plus,
  Search,
  Filter,
  Lock,
  GitBranch,
  Eye,
  FileText,
  Clock,
  CheckCircle2,
  Calendar,
  X,
  ShieldAlert,
} from 'lucide-react';
import { useOffice } from '../../context/OfficeContext';
import { InboundLetter, LetterUrgency } from '../../types';

export const SuratMasukView: React.FC = () => {
  const {
    inboundLetters,
    currentUser,
    registerInboundLetter,
    setSelectedDocumentForPreview,
    setActiveModule,
    createDisposition,
  } = useOffice();

  const [search, setSearch] = useState('');
  const [filterUrgency, setFilterUrgency] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedLetterForTracking, setSelectedLetterForTracking] = useState<InboundLetter | null>(null);
  const [quickDispositionLetter, setQuickDispositionLetter] = useState<InboundLetter | null>(null);

  // Quick Disposition form state
  const [dispToUserId, setDispToUserId] = useState('usr-3');
  const [dispInstruction, setDispInstruction] = useState('Pelajari & Laporkan');
  const [dispNotes, setDispNotes] = useState('');
  const [dispDeadline, setDispDeadline] = useState(new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]);

  // New Inbound Letter Form State
  const [formData, setFormData] = useState({
    referenceNumber: '',
    receivedDate: new Date().toISOString().split('T')[0],
    letterDate: new Date().toISOString().split('T')[0],
    sender: '',
    organization: '',
    subject: '',
    urgency: 'Biasa' as LetterUrgency,
    category: 'Undangan Kedinasan',
    targetUnit: 'Direksi',
    targetPerson: 'Direktur Utama',
    attachmentsCount: 1,
    fileName: 'Surat_Masuk_Resmi.pdf',
    slaDeadline: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
    isConfidential: false,
    ocrSummary: '',
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.sender) return;

    registerInboundLetter(formData);
    setIsNewModalOpen(false);
    // Reset form
    setFormData({
      referenceNumber: '',
      receivedDate: new Date().toISOString().split('T')[0],
      letterDate: new Date().toISOString().split('T')[0],
      sender: '',
      organization: '',
      subject: '',
      urgency: 'Biasa',
      category: 'Undangan Kedinasan',
      targetUnit: 'Direksi',
      targetPerson: 'Direktur Utama',
      attachmentsCount: 1,
      fileName: 'Surat_Masuk_Resmi.pdf',
      slaDeadline: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
      isConfidential: false,
      ocrSummary: '',
    });
  };

  const handleQuickDispositionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickDispositionLetter) return;

    createDisposition({
      documentId: quickDispositionLetter.id,
      toUserId: dispToUserId,
      instruction: dispInstruction,
      notes: dispNotes || 'Mohon segera ditindaklanjuti sesuai kewenangan.',
      deadline: dispDeadline,
    });

    setQuickDispositionLetter(null);
    setDispNotes('');
  };

  // Filter letters
  const filteredLetters = inboundLetters.filter((letter) => {
    const matchSearch =
      letter.agendaNumber.toLowerCase().includes(search.toLowerCase()) ||
      letter.referenceNumber.toLowerCase().includes(search.toLowerCase()) ||
      letter.subject.toLowerCase().includes(search.toLowerCase()) ||
      letter.sender.toLowerCase().includes(search.toLowerCase()) ||
      letter.organization.toLowerCase().includes(search.toLowerCase());

    const matchUrgency = filterUrgency === 'all' || letter.urgency === filterUrgency;
    const matchStatus = filterStatus === 'all' || letter.status === filterStatus;

    return matchSearch && matchUrgency && matchStatus;
  });

  // Access check for confidential letters
  const canAccessConfidential =
    currentUser.role === 'Direksi' ||
    currentUser.role === 'Super Admin' ||
    currentUser.role === 'Admin Sekretariat' ||
    currentUser.role === 'Auditor / SPI';

  return (
    <div className="space-y-5">
      {/* Title & Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Registrasi & Pengelolaan Surat Masuk</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan nomor agenda otomatis, tracking disposisi berjenjang, dan perlindungan dokumen rahasia.
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" /> Registrasi Surat Baru
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nomor agenda, nomor surat asal, instansi, atau perihal..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Segmented urgency filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
            {['all', 'Biasa', 'Segera', 'Rahasia'].map((urg) => (
              <button
                key={urg}
                onClick={() => setFilterUrgency(urg)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  filterUrgency === urg ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {urg === 'all' ? 'Semua Sifat' : urg}
              </button>
            ))}
          </div>

          {/* Status select */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="Registrasi">Registrasi</option>
            <option value="Menunggu Disposisi">Menunggu Disposisi</option>
            <option value="Didisposisikan">Didisposisikan</option>
            <option value="Tindak Lanjut">Tindak Lanjut</option>
            <option value="Selesai">Selesai</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">No. Agenda & Tanggal</th>
                <th className="px-4 py-3">Asal Surat / Pengirim</th>
                <th className="px-4 py-3">Perihal & Lampiran</th>
                <th className="px-4 py-3">Sifat & Klasifikasi</th>
                <th className="px-4 py-3">Tenggat SLA</th>
                <th className="px-4 py-3">Status Rantai</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLetters.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada surat masuk yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredLetters.map((letter) => {
                  const isBlockedConfidential = letter.isConfidential && !canAccessConfidential;

                  return (
                    <tr key={letter.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* No Agenda */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900">{letter.agendaNumber}</div>
                        <div className="text-[11px] text-slate-500">Terima: {letter.receivedDate}</div>
                      </td>

                      {/* Sender */}
                      <td className="px-4 py-3 max-w-[200px]">
                        <div className="font-semibold text-slate-900 truncate">{letter.sender}</div>
                        <div className="text-[11px] text-slate-500 truncate">{letter.organization}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                          No. Asal: {letter.referenceNumber}
                        </div>
                      </td>

                      {/* Subject */}
                      <td className="px-4 py-3 max-w-[280px]">
                        {isBlockedConfidential ? (
                          <div className="flex items-center gap-1.5 text-rose-700 font-medium">
                            <Lock className="w-3.5 h-3.5" />
                            <span>Konten Terbatas (Hanya Direksi/SPI)</span>
                          </div>
                        ) : (
                          <>
                            <div className="font-medium text-slate-900 line-clamp-2">{letter.subject}</div>
                            <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-2">
                              <span>File: {letter.fileName} ({letter.fileSize})</span>
                              {letter.ocrSummary && (
                                <span className="text-emerald-700 font-medium">· OCR Siap</span>
                              )}
                            </div>
                          </>
                        )}
                      </td>

                      {/* Urgency */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="space-y-1">
                          {letter.urgency === 'Rahasia' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-200 rounded">
                              <Lock className="w-3 h-3" /> RAHASIA
                            </span>
                          ) : letter.urgency === 'Segera' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded">
                              <Clock className="w-3 h-3" /> SEGERA
                            </span>
                          ) : letter.urgency === 'Penting' ? (
                            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold text-blue-800 bg-blue-50 border border-blue-200 rounded">
                              PENTING
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium text-slate-600 bg-slate-100 rounded">
                              BIASA
                            </span>
                          )}
                          <div className="text-[10px] text-slate-400">{letter.category}</div>
                        </div>
                      </td>

                      {/* SLA Deadline */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono text-slate-800 font-medium">{letter.slaDeadline}</span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded ${
                            letter.status === 'Selesai'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : letter.status === 'Didisposisikan'
                              ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {letter.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedDocumentForPreview(letter)}
                            disabled={isBlockedConfidential}
                            className={`p-1.5 rounded transition-colors ${
                              isBlockedConfidential
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                            title="Pratinjau Dokumen"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setSelectedLetterForTracking(letter)}
                            className="p-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded transition-colors"
                            title="Lihat Alur Disposisi"
                          >
                            <GitBranch className="w-4 h-4" />
                          </button>

                          {(currentUser.role === 'Direksi' || currentUser.role === 'Atasan') && (
                            <button
                              onClick={() => {
                                setQuickDispositionLetter(letter);
                              }}
                              className="px-2 py-1 text-[11px] font-medium text-white bg-blue-900 hover:bg-blue-950 rounded transition-colors"
                            >
                              Disposisi
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

      {/* MODAL 1: Registrasi Surat Masuk Baru */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Registrasi Surat Masuk Baru</h3>
                <p className="text-xs text-slate-500">Nomor agenda dibuat otomatis secara atomik oleh sistem</p>
              </div>
              <button onClick={() => setIsNewModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Surat Pengirim</label>
                  <input
                    type="text"
                    required
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                    placeholder="Contoh: B-120/KEMEN-BUMN/10/2026"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Terima Surat</label>
                  <input
                    type="date"
                    required
                    value={formData.receivedDate}
                    onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Instansi / Perusahaan</label>
                  <input
                    type="text"
                    required
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    placeholder="Contoh: Kementerian BUMN RI"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pejabat / Nama Pengirim</label>
                  <input
                    type="text"
                    required
                    value={formData.sender}
                    onChange={(e) => setFormData({ ...formData, sender: e.target.value })}
                    placeholder="Contoh: Sekretaris Jenderal"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Perihal Surat</label>
                <textarea
                  rows={2}
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Ringkasan pokok isi surat masuk..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sifat Dokumen</label>
                  <select
                    value={formData.urgency}
                    onChange={(e) => {
                      const val = e.target.value as LetterUrgency;
                      setFormData({ ...formData, urgency: val, isConfidential: val === 'Rahasia' });
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Biasa">Biasa</option>
                    <option value="Penting">Penting</option>
                    <option value="Segera">Segera</option>
                    <option value="Rahasia">Rahasia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori Surat</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Undangan Kedinasan">Undangan Kedinasan</option>
                    <option value="Laporan Audit">Laporan Audit</option>
                    <option value="Korespondensi Vendor">Korespondensi Vendor</option>
                    <option value="Surat Permohonan">Surat Permohonan</option>
                    <option value="Surat Perintah">Surat Perintah</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Batas SLA Tindak Lanjut</label>
                  <input
                    type="date"
                    required
                    value={formData.slaDeadline}
                    onChange={(e) => setFormData({ ...formData, slaDeadline: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Upload Simulation */}
              <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center space-y-1">
                <FileText className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-xs font-medium text-slate-700">Lampiran Surat Digital (PDF / Scan)</p>
                <p className="text-[10px] text-slate-400">File: {formData.fileName} (Tersimulasi siap OCR)</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Simpan & Terbitkan No. Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Tracking Posisi Surat & Rantai Disposisi */}
      {selectedLetterForTracking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Tracking Posisi Surat & Rantai Disposisi
                </h3>
                <p className="text-xs text-slate-500 font-mono">{selectedLetterForTracking.agendaNumber}</p>
              </div>
              <button
                onClick={() => setSelectedLetterForTracking(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                <p className="font-semibold text-slate-900">{selectedLetterForTracking.subject}</p>
                <p className="text-slate-500">Pengirim: {selectedLetterForTracking.sender} ({selectedLetterForTracking.organization})</p>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Rantai Aliran Dokumen:
                </h4>

                {/* Timeline chain */}
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {/* Step 1: Registrasi */}
                  <div className="relative">
                    <div className="absolute -left-6 top-0 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                      ✓
                    </div>
                    <div className="text-xs">
                      <p className="font-bold text-slate-900">1. Registrasi Sekretariat Perusahaan</p>
                      <p className="text-[11px] text-slate-500">
                        {selectedLetterForTracking.receivedDate} · Petugas Sekper meregistrasi dan memindai dokumen.
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Diteruskan ke Direktur Utama */}
                  <div className="relative">
                    <div className="absolute -left-6 top-0 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                      ✓
                    </div>
                    <div className="text-xs">
                      <p className="font-bold text-slate-900">2. Disposisi Direktur Utama</p>
                      <p className="text-[11px] text-slate-500">
                        Pimpinan menelaah surat dan memberikan instruksi disposisi resmi.
                      </p>
                    </div>
                  </div>

                  {/* Step 3: Tindak Lanjut Unit Kerja */}
                  <div className="relative">
                    <div className="absolute -left-6 top-0 w-5 h-5 rounded-full bg-blue-900 text-white flex items-center justify-center text-[10px]">
                      3
                    </div>
                    <div className="text-xs">
                      <p className="font-bold text-blue-950">3. Pelaksanaan Tindak Lanjut oleh Unit Terkait</p>
                      <p className="text-[11px] text-slate-600">
                        Status saat ini: {selectedLetterForTracking.status}. Menunggu laporan hasil tindak lanjut sebelum diarsipkan.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 text-right">
              <button
                onClick={() => setSelectedLetterForTracking(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium rounded-lg"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Quick Disposisi Form */}
      {quickDispositionLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Buat Lembar Disposisi Elektronik</h3>
                <p className="text-xs text-slate-500">{quickDispositionLetter.agendaNumber}</p>
              </div>
              <button onClick={() => setQuickDispositionLetter(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickDispositionSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs space-y-1">
                <span className="font-semibold text-blue-950">Perihal Surat:</span>
                <p className="text-blue-900 line-clamp-2">{quickDispositionLetter.subject}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Diteruskan Kepada (Penerima Disposisi)</label>
                <select
                  value={dispToUserId}
                  onChange={(e) => setDispToUserId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="usr-3">Arif Wicaksono, S.T. (Kadiv Teknologi Informasi)</option>
                  <option value="usr-6">Budi Santoso, S.E. (Kadiv Keuangan)</option>
                  <option value="usr-5">Rina Wulandari, S.Psi. (Kabag SDM)</option>
                  <option value="usr-2">Dra. Ratna Indrayani (Sekretaris Perusahaan)</option>
                  <option value="usr-7">Drs. Suryo Broto (Ketua SPI)</option>
                  <option value="usr-4">Dimas Pratama, S.Kom. (Staf Senior TI)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pilihan Instruksi Standar</label>
                <select
                  value={dispInstruction}
                  onChange={(e) => setDispInstruction(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium text-slate-900"
                >
                  <option value="Pelajari & Laporkan">Pelajari & Laporkan</option>
                  <option value="Tindak lanjuti segera">Tindak lanjuti segera</option>
                  <option value="Siapkan draft jawaban/balasan">Siapkan draft jawaban/balasan</option>
                  <option value="Koordinasikan dengan unit terkait">Koordinasikan dengan unit terkait</option>
                  <option value="Hadiri mewakili Direksi">Hadiri mewakili Direksi</option>
                  <option value="Arsipkan / Untuk Diketahui">Arsipkan / Untuk Diketahui</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Khusus Pimpinan</label>
                <textarea
                  rows={3}
                  value={dispNotes}
                  onChange={(e) => setDispNotes(e.target.value)}
                  placeholder="Instruksi tambahan, arahan khusus, atau materi yang perlu disiapkan..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Batas Waktu Tindak Lanjut (Deadline)</label>
                <input
                  type="date"
                  required
                  value={dispDeadline}
                  onChange={(e) => setDispDeadline(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setQuickDispositionLetter(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Kirim Disposisi (Auto-Task)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
