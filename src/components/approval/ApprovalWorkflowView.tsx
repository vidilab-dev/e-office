import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  UserCheck,
  Eye,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileText,
  AlertCircle,
  X,
} from 'lucide-react';
import { useOffice } from '../../context/OfficeContext';
import { OutgoingLetter } from '../../types';
import { ContentEditor } from '../common/ContentEditor';
import { renderRich } from '../common/RichText';

export const ApprovalWorkflowView: React.FC = () => {
  const {
    outgoingLetters,
    currentUser,
    users,
    actOnApproval,
    setSelectedDocumentForPreview,
  } = useOffice();

  const [selectedLetter, setSelectedLetter] = useState<OutgoingLetter | null>(null);
  const [approvalActionModal, setApprovalActionModal] = useState<{
    letter: OutgoingLetter;
    action: 'Approved' | 'Rejected' | 'Revision';
  } | null>(null);

  const [actionComments, setActionComments] = useState('');
  const [delegateUserId, setDelegateUserId] = useState('');

  // Letters that are waiting for approval
  const pendingLetters = outgoingLetters.filter(
    (l) => l.status === 'Menunggu Approval' || l.status === 'Review'
  );

  const approvedLetters = outgoingLetters.filter(
    (l) => l.status === 'Disetujui' || l.status === 'Nomor Diterbitkan' || l.status === 'TTE Diterbitkan'
  );

  const handleActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvalActionModal) return;

    actOnApproval(
      approvalActionModal.letter.id,
      approvalActionModal.action,
      actionComments,
      delegateUserId || undefined
    );

    setApprovalActionModal(null);
    setActionComments('');
    setDelegateUserId('');
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Approval Workflow Engine & Kotak Masuk Persetujuan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Alur verifikasi bertingkat: Konseptor → Reviewer Unit → Sekretaris Perusahaan → Direktur Utama.
          </p>
        </div>
      </div>

      {/* Main Grid: Pending Approval Queue & Step Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Pending Letters List (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Antrean Menunggu Tindakan ({pendingLetters.length})
            </h3>
            <span className="text-[11px] text-slate-500">Pilih dokumen untuk review</span>
          </div>

          <div className="space-y-3">
            {pendingLetters.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs">
                Tidak ada dokumen yang sedang menunggu persetujuan Anda saat ini.
              </div>
            ) : (
              pendingLetters.map((letter) => {
                const isSelected = selectedLetter?.id === letter.id;
                const currentStepData = letter.approvers.find((a) => a.stepNumber === letter.currentStep);

                return (
                  <div
                    key={letter.id}
                    onClick={() => setSelectedLetter(letter)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-400 shadow-sm ring-1 ring-blue-400'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {letter.letterNumber || letter.draftNumber}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-semibold text-amber-800 bg-amber-50 rounded border border-amber-200">
                        Langkah {letter.currentStep} dari {letter.approvers.length}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-900 mt-2 line-clamp-2">
                      {letter.subject}
                    </p>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Konseptor: {letter.creatorName}</span>
                      <span className="font-medium text-slate-700">Tujuan: {letter.recipient}</span>
                    </div>

                    {currentStepData && (
                      <div className="mt-2 text-[10px] text-blue-900 bg-blue-100/50 px-2 py-1 rounded flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3 text-blue-700" />
                        <span>Menunggu: {currentStepData.approverName} ({currentStepData.approverTitle})</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Step-by-Step Interactive Workflow Visualizer (7 Cols) */}
        <div className="lg:col-span-7">
          {selectedLetter ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
              {/* Document Overview Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                      {selectedLetter.type}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="font-mono text-xs font-semibold text-slate-600">
                      {selectedLetter.letterNumber || selectedLetter.draftNumber}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{selectedLetter.subject}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kepada: {selectedLetter.recipient} ({selectedLetter.recipientOrg}) · Konseptor: {selectedLetter.creatorName}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedDocumentForPreview(selectedLetter)}
                  className="px-3 py-1.5 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg font-medium transition-colors shrink-0 flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> Pratinjau Naskah
                </button>
              </div>

              {/* Workflow Stepper Diagram */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                  Visualisasi Tahapan Persetujuan Berjenjang:
                </h4>

                <div className="space-y-4">
                  {selectedLetter.approvers.map((step, idx) => {
                    const isPassed = step.status === 'Approved';
                    const isCurrent = selectedLetter.currentStep === step.stepNumber && selectedLetter.status === 'Menunggu Approval';
                    const isRejected = step.status === 'Rejected';
                    const isRevision = step.status === 'Revision';

                    return (
                      <div
                        key={step.stepNumber}
                        className={`p-4 rounded-xl border transition-all ${
                          isCurrent
                            ? 'bg-blue-50/70 border-blue-300 shadow-xs'
                            : isPassed
                            ? 'bg-emerald-50/40 border-emerald-200'
                            : isRejected
                            ? 'bg-rose-50/40 border-rose-200'
                            : 'bg-slate-50 border-slate-200 opacity-80'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            {/* Step icon number */}
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                isPassed
                                  ? 'bg-emerald-600 text-white'
                                  : isCurrent
                                  ? 'bg-blue-900 text-white ring-4 ring-blue-100'
                                  : isRejected
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {isPassed ? '✓' : step.stepNumber}
                            </div>

                            <div className="text-xs">
                              <p className="font-bold text-slate-900">
                                {step.approverTitle}: {step.approverName}
                              </p>
                              <p className="text-[11px] text-slate-500">Peran: {step.approverRole}</p>

                              {step.actedAt && (
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  Tindakan: {step.actedAt}
                                </p>
                              )}

                              {step.comments && (
                                <div className="mt-2 p-2 bg-white/90 border border-slate-200 rounded text-slate-700 text-[11px] leading-relaxed">
                                  <strong className="text-slate-900 block">Catatan:</strong>
                                  {renderRich(step.comments)}
                                </div>
                              )}
                            </div>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              isPassed
                                ? 'bg-emerald-100 text-emerald-800'
                                : isCurrent
                                ? 'bg-blue-100 text-blue-900 animate-pulse'
                                : isRejected
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {isPassed
                              ? 'Disetujui'
                              : isCurrent
                              ? 'Menunggu Review'
                              : isRejected
                              ? 'Ditolak'
                              : 'Menunggu Giliran'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons for Current Reviewer */}
              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-500">
                  Keputusan persetujuan akan langsung mengupdate alur dan mencatat audit trail.
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setApprovalActionModal({ letter: selectedLetter, action: 'Revision' })
                    }
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Revisi
                  </button>

                  <button
                    onClick={() =>
                      setApprovalActionModal({ letter: selectedLetter, action: 'Rejected' })
                    }
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Tolak
                  </button>

                  <button
                    onClick={() =>
                      setApprovalActionModal({ letter: selectedLetter, action: 'Approved' })
                    }
                    className="inline-flex items-center gap-1 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Setujui (Approve)
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200 space-y-2">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-medium text-slate-600">Pilih dokumen di sebelah kiri</p>
              <p className="text-[11px] text-slate-400">
                Diagram alur berjenjang dan panel eksekusi persetujuan akan tampil di sini.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Konfirmasi Aksi Approval */}
      {approvalActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                Konfirmasi Tindakan: {approvalActionModal.action}
              </h3>
              <button
                onClick={() => setApprovalActionModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleActionSubmit} className="p-6 space-y-4">
              <div className="text-xs text-slate-700 space-y-1">
                <p className="font-semibold text-slate-900">
                  {approvalActionModal.letter.letterNumber || approvalActionModal.letter.draftNumber}
                </p>
                <p className="text-slate-500 line-clamp-2">{approvalActionModal.letter.subject}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan / Ulasan Reviewer
                </label>
                <ContentEditor
                  rows={4}
                  value={actionComments}
                  onChange={setActionComments}
                  placeholder={
                    approvalActionModal.action === 'Revision'
                      ? 'Tuliskan poin-poin klausul yang perlu direvisi...'
                      : approvalActionModal.action === 'Rejected'
                      ? 'Tuliskan alasan penolakan dokumen...'
                      : 'Catatan persetujuan (opsional)...'
                  }
                />
              </div>

              {/* Delegation option */}
              {approvalActionModal.action === 'Approved' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Delegasikan / Plt (Opsional)
                  </label>
                  <select
                    value={delegateUserId}
                    onChange={(e) => setDelegateUserId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">Tidak Didelegasikan (Tandatangani Sendiri)</option>
                    {users
                      .filter((u) => u.id !== currentUser.id)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.title})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setApprovalActionModal(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white text-xs font-semibold rounded-lg shadow-xs ${
                    approvalActionModal.action === 'Approved'
                      ? 'bg-emerald-700 hover:bg-emerald-800'
                      : approvalActionModal.action === 'Rejected'
                      ? 'bg-rose-700 hover:bg-rose-800'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  Konfirmasi {approvalActionModal.action}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
