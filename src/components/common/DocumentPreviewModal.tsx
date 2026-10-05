import React from 'react';
import { X, Printer, Download, ShieldCheck, CheckCircle2, Lock } from 'lucide-react';
import { useOffice } from '../../context/OfficeContext';

export const DocumentPreviewModal: React.FC = () => {
  const { selectedDocumentForPreview, setSelectedDocumentForPreview, setQrVerificationModalData } = useOffice();

  if (!selectedDocumentForPreview) return null;

  const doc = selectedDocumentForPreview;
  const isConfidential = doc.urgency === 'Rahasia' || doc.isConfidential || doc.confidentiality === 'Rahasia';

  const handlePrint = () => {
    window.print();
  };

  const handleVerifyQR = () => {
    setQrVerificationModalData({
      code: doc.qrVerifyCode || doc.letterNumber || doc.agendaNumber,
      title: doc.subject || doc.title,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50 no-print">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Pratinjau Dokumen Resmi
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-sm font-medium text-slate-800">
                {doc.letterNumber || doc.draftNumber || doc.agendaNumber || doc.documentNumber || 'Dokumen'}
              </span>
            </div>
            {isConfidential && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded">
                <Lock className="w-3 h-3" /> RAHASIA
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> Cetak
            </button>
            <button
              onClick={() => alert(`Mengunduh file resmi ${doc.fileName || 'dokumen.pdf'}...`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Unduh PDF
            </button>
            <button
              onClick={() => setSelectedDocumentForPreview(null)}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Sheet Viewport (A4 simulation) */}
        <div className="p-8 sm:p-12 overflow-y-auto bg-slate-100/60 flex justify-center">
          <div className="relative w-full max-w-[760px] bg-white p-10 sm:p-14 shadow-sm border border-slate-200 rounded-sm text-slate-900 min-h-[900px] flex flex-col justify-between select-text">
            {/* Watermark for Rahasia */}
            {isConfidential && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 select-none overflow-hidden">
                <span className="text-8xl font-black tracking-widest text-red-600 -rotate-45 transform">
                  RAHASIA
                </span>
              </div>
            )}

            <div>
              {/* Kop Surat PT BIN */}
              <div className="border-b-2 border-slate-900 pb-4 mb-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-900 to-slate-900 text-white rounded flex items-center justify-center font-bold text-xl tracking-tight border border-blue-950 shadow-sm">
                      BIN
                    </div>
                    <div>
                      <h1 className="text-lg font-bold tracking-tight text-slate-950 uppercase leading-snug">
                        PT BADAN INDUSTRI NUSANTARA (PERSERO)
                      </h1>
                      <p className="text-xs font-medium text-slate-600 tracking-wide">
                        Kantor Pusat: Gedung Sentra Graha Lt. 8-12, Jl. Jend. Sudirman Kav. 52-53, Jakarta 12190
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Telepon: (021) 5299-8800 | Faksimili: (021) 5299-8801 | Surel: sekretariat@bin.co.id | www.bin.co.id
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-slate-500">
                    <span className="block font-semibold text-slate-700">ISO 9001:2015</span>
                    <span className="block">Cert No. ID-90827</span>
                  </div>
                </div>
              </div>

              {/* Letter Metadata Header */}
              <div className="grid grid-cols-2 gap-4 text-xs mb-6">
                <div className="space-y-1">
                  <div className="flex">
                    <span className="w-24 text-slate-500">Nomor</span>
                    <span className="text-slate-900 font-semibold">
                      : {doc.letterNumber || doc.draftNumber || doc.agendaNumber || doc.documentNumber || '-'}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-slate-500">Sifat</span>
                    <span className="text-slate-900 font-medium">: {doc.urgency || doc.confidentiality || 'Biasa'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-slate-500">Lampiran</span>
                    <span className="text-slate-900">: {doc.lampiranText || `${doc.attachmentsCount || 1} berkas`}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-slate-500">Perihal</span>
                    <span className="text-slate-900 font-semibold">: {doc.subject || doc.title}</span>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <p className="text-slate-700">Jakarta, {doc.date || doc.receivedDate || doc.dateCreated || '04 Oktober 2026'}</p>
                  <div className="pt-2 text-left sm:text-right">
                    <p className="text-slate-500 text-[11px]">Kepada Yth:</p>
                    <p className="font-semibold text-slate-900">{doc.recipient || doc.sender || 'Pimpinan Unit Kerja Terkait'}</p>
                    <p className="text-slate-600">{doc.recipientOrg || doc.organization || 'PT Badan Industri Nusantara'}</p>
                  </div>
                </div>
              </div>

              {/* Content Body */}
              <div className="my-8 text-[13px] leading-relaxed text-slate-800 whitespace-pre-line text-justify font-normal">
                {doc.content ||
                  doc.ocrSummary ||
                  `Sehubungan dengan pelaksanaan agenda kedinasan dan koordinasi tata kelola operasional perusahaan, bersama ini disampaikan berkas resmi ${doc.subject || doc.title}.\n\nSeluruh ketentuan yang tercantum dalam dokumen ini mengikat dan memiliki kekuatan hukum serta keabsahan administrasi korporat sesuai dengan anggaran dasar PT BIN (Persero).\n\nDemikian surat ini kami sampaikan untuk menjadi pedoman dan dapat dilaksanakan dengan penuh tanggung jawab.`}
              </div>

              {/* Tembusan */}
              {doc.tembusanText && (
                <div className="mt-6 pt-4 border-t border-slate-100 text-xs">
                  <p className="font-semibold text-slate-700 mb-1">Tembusan:</p>
                  <p className="text-slate-600 whitespace-pre-line">{doc.tembusanText}</p>
                </div>
              )}
            </div>

            {/* Signature & TTE Block */}
            <div className="mt-12 pt-4 flex items-end justify-between border-t border-slate-200">
              {/* QR Verification Box */}
              <div className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-200 rounded text-left">
                <div 
                  onClick={handleVerifyQR}
                  className="w-16 h-16 bg-white border border-slate-300 p-1 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors shadow-xs"
                  title="Klik untuk memverifikasi QR Code"
                >
                  {/* Stylized QR Code matrix icon */}
                  <div className="w-full h-full bg-slate-900 rounded-[2px] flex items-center justify-center p-1 text-[8px] font-mono text-white text-center leading-tight">
                    QR TTE BSrE
                  </div>
                </div>
                <div className="text-[11px] space-y-0.5">
                  <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Terverifikasi Elektronik</span>
                  </div>
                  <p className="text-slate-500 font-mono text-[10px]">
                    {doc.qrVerifyCode || 'BIN-TTE-OFFICIAL-2026'}
                  </p>
                  <button
                    onClick={handleVerifyQR}
                    className="text-blue-600 hover:text-blue-800 text-[10px] underline font-medium"
                  >
                    Cek Validitas TTE
                  </button>
                </div>
              </div>

              {/* Signer Title */}
              <div className="text-right">
                <p className="text-xs text-slate-600">PT BADAN INDUSTRI NUSANTARA (PERSERO)</p>
                <p className="text-xs font-semibold text-slate-900 mb-8">
                  {doc.tteSigner ? doc.tteSigner.split('(')[1]?.replace(')', '') || 'Direktur Utama' : 'Direktur Utama'}
                </p>

                {doc.tteStatus === 'Sudah TTE' ? (
                  <div className="inline-block text-right">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-900 bg-blue-50 px-2 py-1 rounded border border-blue-200 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Ditandatangani secara Elektronik</span>
                    </div>
                    <p className="text-xs font-bold text-slate-900">
                      {doc.tteSigner ? doc.tteSigner.split('(')[0].trim() : 'Ir. H. Hendrawan Suprayogi, M.M.'}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Timestamp: {doc.tteDate || '2026-10-04 15:45 WIB'}
                    </p>
                  </div>
                ) : (
                  <div className="text-right">
                    <div className="h-10"></div>
                    <p className="text-xs font-bold text-slate-900">
                      {doc.creatorName || 'Ir. H. Hendrawan Suprayogi, M.M.'}
                    </p>
                    <p className="text-[10px] text-slate-500">NIP. BIN-19750812-001</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
