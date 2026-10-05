import React, { useState } from 'react';
import { X, ShieldCheck, AlertTriangle, CheckCircle2, Lock, Search, FileText } from 'lucide-react';
import { useOffice } from '../../context/OfficeContext';

export const QRVerifyModal: React.FC = () => {
  const { qrVerificationModalData, setQrVerificationModalData, verifyDocumentByCode } = useOffice();
  const [inputCode, setInputCode] = useState(qrVerificationModalData?.code || '');
  const [result, setResult] = useState<any>(() => {
    if (qrVerificationModalData?.code) {
      return verifyDocumentByCode(qrVerificationModalData.code);
    }
    return null;
  });

  if (!qrVerificationModalData) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    const res = verifyDocumentByCode(inputCode.trim());
    setResult(res);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Verifikasi Dokumen & TTE Resmi</h3>
              <p className="text-xs text-slate-500">Pusat Validasi Keaslian Dokumen PT BIN</p>
            </div>
          </div>
          <button
            onClick={() => setQrVerificationModalData(null)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <form onSubmit={handleVerify} className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Kode Verifikasi QR / Nomor Surat / Hash SHA-256
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="Contoh: BIN-TTE-20261004-98842 atau nomor surat..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-mono"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
              >
                Validasi
              </button>
            </div>
          </form>

          {/* Result Display */}
          {result && (
            <div
              className={`p-4 rounded-lg border ${
                result.valid ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {result.valid ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-2 w-full text-xs">
                  <div>
                    <h4 className={`font-semibold ${result.valid ? 'text-emerald-900' : 'text-rose-900'}`}>
                      {result.valid ? 'DOKUMEN ASLI & TERVERIFIKASI' : 'DOKUMEN TIDAK TERDAFTAR'}
                    </h4>
                    <p className={`mt-0.5 text-[11px] ${result.valid ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {result.message}
                    </p>
                  </div>

                  {result.valid && result.doc && (
                    <div className="pt-2 border-t border-emerald-200/60 space-y-1.5 text-slate-700">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Nomor Dokumen:</span>
                        <span className="font-semibold text-slate-900 font-mono">{result.doc.number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Perihal:</span>
                        <span className="font-medium text-slate-900 text-right max-w-[260px] truncate">
                          {result.doc.subject}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Penandatangan:</span>
                        <span className="text-slate-900">{result.doc.issuer}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Waktu Terbit / TTE:</span>
                        <span className="text-slate-900 font-mono">{result.doc.date}</span>
                      </div>
                      {result.doc.hash && (
                        <div className="pt-1">
                          <span className="text-[10px] text-slate-500 block">Digital Signature Hash:</span>
                          <span className="text-[10px] font-mono text-slate-600 break-all bg-emerald-100/60 p-1 rounded block">
                            {result.doc.hash}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Trust Seal Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Sertifikasi BSrE Badan Siber dan Sandi Negara</span>
            </div>
            <span className="font-semibold text-slate-700">PT BIN Trust Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
};
