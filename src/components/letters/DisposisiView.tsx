import React, { useState } from 'react';
import {
  GitBranch,
  Search,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  FileText,
  User,
  Send,
  CornerDownRight,
  X,
  Upload,
} from 'lucide-react';
import { useOffice } from '../../context/OfficeContext';
import { DispositionChainStep } from '../../types';

export const DisposisiView: React.FC = () => {
  const {
    dispositions,
    inboundLetters,
    currentUser,
    users,
    createDisposition,
    reportDispositionFollowUp,
    setSelectedDocumentForPreview,
  } = useOffice();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [cascadingModalParent, setCascadingModalParent] = useState<DispositionChainStep | null>(null);
  const [followUpModalStep, setFollowUpModalStep] = useState<DispositionChainStep | null>(null);

  // Cascading form state
  const [cascadeToUserId, setCascadeToUserId] = useState('usr-4');
  const [cascadeInstruction, setCascadeInstruction] = useState('Tindak lanjuti & siapkan laporan');
  const [cascadeNotes, setCascadeNotes] = useState('');
  const [cascadeDeadline, setCascadeDeadline] = useState(
    new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]
  );

  // Follow-up form state
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [followUpAttachment, setFollowUpAttachment] = useState('Laporan_Hasil_Tindak_Lanjut.pdf');

  const handleCascadeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cascadingModalParent) return;

    createDisposition({
      documentId: cascadingModalParent.documentId,
      documentType: cascadingModalParent.documentType,
      toUserId: cascadeToUserId,
      instruction: cascadeInstruction,
      notes: cascadeNotes,
      deadline: cascadeDeadline,
      parentDispositionId: cascadingModalParent.id,
    });

    setCascadingModalParent(null);
    setCascadeNotes('');
  };

  const handleFollowUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpModalStep || !followUpNotes) return;

    reportDispositionFollowUp(followUpModalStep.id, followUpNotes, followUpAttachment);
    setFollowUpModalStep(null);
    setFollowUpNotes('');
  };

  const renderDispositionStepCard = (step: DispositionChainStep, isChild = false) => {
    const parentLetter = inboundLetters.find((l) => l.id === step.documentId);
    const isTargetingMe = step.toUserId === currentUser.id;

    return (
      <div
        key={step.id}
        className={`p-4 rounded-xl border transition-all ${
          isChild
            ? 'bg-slate-50/80 border-slate-200 ml-6 sm:ml-10 relative before:absolute before:-left-5 before:top-6 before:w-4 before:h-0.5 before:bg-slate-300'
            : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-900">{step.dispositionId}</span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-mono">{step.createdAt}</span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded ${
                step.status === 'Selesai'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : step.status === 'Diteruskan'
                  ? 'bg-purple-50 text-purple-800 border border-purple-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              {step.status}
            </span>
            <span className="text-[11px] text-slate-500">
              Deadline: <span className="font-mono font-semibold text-slate-800">{step.deadline}</span>
            </span>
          </div>
        </div>

        {/* Sender -> Receiver Flow */}
        <div className="py-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-2.5 bg-slate-50 rounded-lg">
            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Dari:</span>
            <p className="font-bold text-slate-900">{step.fromUserName}</p>
            <p className="text-[11px] text-slate-500">{step.fromUserTitle}</p>
          </div>

          <div className="p-2.5 bg-blue-50/60 border border-blue-100 rounded-lg">
            <span className="text-[10px] text-blue-800 uppercase font-bold block mb-0.5">Diteruskan Kepada:</span>
            <p className="font-bold text-blue-950">{step.toUserName}</p>
            <p className="text-[11px] text-blue-800">{step.toUserTitle}</p>
          </div>
        </div>

        {/* Instruction & Notes */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-slate-700 shrink-0">Instruksi:</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-900">
              {step.instruction}
            </span>
          </div>

          {step.notes && (
            <div className="p-2.5 bg-amber-50/60 border border-amber-200/60 rounded-md text-amber-950 text-xs">
              <span className="font-semibold block text-[10px] text-amber-800">Catatan Pimpinan:</span>
              <p className="mt-0.5 leading-relaxed">{step.notes}</p>
            </div>
          )}
        </div>

        {/* Linked Document Reference */}
        {parentLetter && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-600 truncate max-w-[400px]">
              <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">
                Surat: <strong className="font-mono text-slate-900">{parentLetter.agendaNumber}</strong> ({parentLetter.subject})
              </span>
            </div>
            <button
              onClick={() => setSelectedDocumentForPreview(parentLetter)}
              className="text-xs text-blue-700 hover:text-blue-900 font-medium shrink-0"
            >
              Lihat Surat Asli →
            </button>
          </div>
        )}

        {/* Completed Follow-Up Report if any */}
        {step.followUpReport && (
          <div className="mt-3 p-3 bg-emerald-50/80 border border-emerald-200 rounded-lg text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-900 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Laporan Hasil Tindak Lanjut: Selesai</span>
              <span className="text-[10px] text-emerald-700 font-mono">({step.followUpReport.reportedAt})</span>
            </div>
            <p className="text-emerald-900 text-xs">{step.followUpReport.notes}</p>
            <p className="text-[11px] text-emerald-700">Dilaporkan oleh: {step.followUpReport.completedBy}</p>
          </div>
        )}

        {/* Action Buttons: Teruskan (Cascading) / Lapor Tindak Lanjut */}
        {step.status !== 'Selesai' && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            {/* Cascading delegation allowed if user is receiver or supervisor */}
            <button
              onClick={() => setCascadingModalParent(step)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <CornerDownRight className="w-3.5 h-3.5 text-indigo-600" /> Teruskan Disposisi (Berjenjang)
            </button>

            {/* Submit follow-up report */}
            <button
              onClick={() => setFollowUpModalStep(step)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Laporkan Hasil Selesai
            </button>
          </div>
        )}

        {/* Render Children (Cascading steps) */}
        {step.children && step.children.length > 0 && (
          <div className="mt-4 space-y-3 pt-3 border-t border-dashed border-slate-200">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <CornerDownRight className="w-3 h-3 text-slate-400" /> Disposisi Berjenjang (Turunan):
            </div>
            {step.children.map((child) => renderDispositionStepCard(child, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Disposisi Surat & Pelacakan Tindak Lanjut
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pemberian instruksi pimpinan, penerusan disposisi berjenjang, dan pelaporan tindak lanjut terpadu.
          </p>
        </div>
      </div>

      {/* Dispositions List */}
      <div className="space-y-4">
        {dispositions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            Belum ada data lembar disposisi. Buka menu Surat Masuk untuk membuat disposisi baru.
          </div>
        ) : (
          dispositions.map((step) => renderDispositionStepCard(step, false))
        )}
      </div>

      {/* MODAL: Teruskan Disposisi Berjenjang */}
      {cascadingModalParent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Teruskan Disposisi Berjenjang</h3>
                <p className="text-xs text-slate-500">Ref: {cascadingModalParent.dispositionId}</p>
              </div>
              <button onClick={() => setCascadingModalParent(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCascadeSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                <span className="font-semibold text-slate-700">Instruksi Awal dari {cascadingModalParent.fromUserName}:</span>
                <p className="text-slate-900 font-medium">{cascadingModalParent.instruction}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Diteruskan Kepada (Staf/PIC Bawahan)</label>
                <select
                  value={cascadeToUserId}
                  onChange={(e) => setCascadeToUserId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.title} ({u.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Instruksi Turunan</label>
                <select
                  value={cascadeInstruction}
                  onChange={(e) => setCascadeInstruction(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Tindak lanjuti & siapkan bahan">Tindak lanjuti & siapkan bahan</option>
                  <option value="Siapkan draft jawaban/balasan">Siapkan draft jawaban/balasan</option>
                  <option value="Koordinasikan teknis segera">Koordinasikan teknis segera</option>
                  <option value="Pelajari regulasi terkait">Pelajari regulasi terkait</option>
                  <option value="Hadiri mewakili">Hadiri mewakili</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Tambahan untuk PIC</label>
                <textarea
                  rows={3}
                  required
                  value={cascadeNotes}
                  onChange={(e) => setCascadeNotes(e.target.value)}
                  placeholder="Detail penugasan spesifik kepada staf..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Batas Waktu Selesai</label>
                <input
                  type="date"
                  required
                  value={cascadeDeadline}
                  onChange={(e) => setCascadeDeadline(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCascadingModalParent(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Teruskan Disposisi (Auto-Task PIC)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Laporan Hasil Tindak Lanjut Disposisi */}
      {followUpModalStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Laporkan Hasil Tindak Lanjut Disposisi</h3>
                <p className="text-xs text-slate-500">{followUpModalStep.dispositionId}</p>
              </div>
              <button onClick={() => setFollowUpModalStep(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFollowUpSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                <p className="font-semibold text-slate-900">Instruksi: {followUpModalStep.instruction}</p>
                <p className="text-slate-600">{followUpModalStep.notes}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Uraian Hasil Tindak Lanjut
                </label>
                <textarea
                  rows={4}
                  required
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  placeholder="Jelaskan secara ringkas hasil pelaksanaan instruksi disposisi..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
                ></textarea>
              </div>

              <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center space-y-1">
                <Upload className="w-5 h-5 text-slate-400 mx-auto" />
                <span className="text-xs font-medium text-slate-700 block">Lampiran Bukti Selesai (PDF/DOC)</span>
                <span className="text-[10px] text-slate-400 font-mono">{followUpAttachment} (Tersimulasi)</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setFollowUpModalStep(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Submit & Selesaikan Disposisi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
