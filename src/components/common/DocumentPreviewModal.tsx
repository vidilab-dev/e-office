import React from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Download, ShieldCheck, CheckCircle2, Lock } from 'lucide-react';
import { useOffice } from '../../context/OfficeContext';
import { formatTanggalSurat } from '../../utils/formatDate';
import { parseContent, stripInline, ContentSegment } from '../../utils/contentBlocks';
import { generateLetterPdf, letterPdfFileName, downloadPdf } from '../../services/pdf/letterPdf';
import { base64ToBytes } from '../../utils/bytes';
import { makeQrDataUrl } from '../../utils/qr';
import { renderRich } from './RichText';

const MM = 96 / 25.4;
const PAGE_W = Math.round(210 * MM);
const PAGE_H = Math.round(297 * MM);
const PAGE_PAD = Math.round(15 * MM);
const CONTENT_W = PAGE_W - PAGE_PAD * 2;
const CONTENT_H = PAGE_H - PAGE_PAD * 2;
const FIT_BUFFER = 6;

// Font dokumen resmi: Tahoma 11px hitam — berlaku dari blok tanggal sampai tembusan
const DOC_FONT = 'Tahoma, Verdana, Geneva, sans-serif';
const DOC_STYLE: React.CSSProperties = { fontFamily: DOC_FONT, color: '#000000', tabSize: 13 };

const BODY_CLASS = 'my-8 text-[11px] leading-relaxed text-black whitespace-pre-wrap text-justify font-normal';

type Block = { key: string; node: React.ReactNode; text?: string };
type PageItem = { key: string; text?: string };

const getPortal = (): HTMLElement => {
  let el = document.getElementById('preview-portal');
  if (!el) {
    el = document.createElement('div');
    el.id = 'preview-portal';
    document.body.appendChild(el);
  }
  return el;
};

export const DocumentPreviewModal: React.FC = () => {
  const { selectedDocumentForPreview, setSelectedDocumentForPreview, setQrVerificationModalData } = useOffice();
  const [pages, setPages] = React.useState<PageItem[][]>([]);
  const measureRef = React.useRef<HTMLDivElement>(null);
  const repaginateRef = React.useRef<(() => void) | null>(null);
  const [portalEl] = React.useState<HTMLElement | null>(() =>
    typeof document === 'undefined' ? null : getPortal()
  );

  const doc = selectedDocumentForPreview;

  const handlePrint = () => {
    const cls = 'printing-preview';
    document.body.classList.add(cls);
    const cleanup = () => document.body.classList.remove(cls);
    window.addEventListener('afterprint', cleanup, { once: true });
    window.print();
    window.setTimeout(cleanup, 1500);
  };

  const handleVerifyQR = () => {
    setQrVerificationModalData({
      code: doc.qrVerifyCode || doc.letterNumber || doc.agendaNumber,
      title: doc.subject || doc.title,
    });
  };

  const [downloading, setDownloading] = React.useState(false);
  // Surat lama sudah TTE tapi belum punya qrDataUrl → generate fallback agar bisa dipindai
  const [fallbackQr, setFallbackQr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    if (doc?.tteStatus === 'Sudah TTE' && !doc.qrDataUrl && doc.qrVerifyCode) {
      makeQrDataUrl(doc.qrVerifyCode)
        .then((url) => {
          if (alive) setFallbackQr(url);
        })
        .catch(() => undefined);
    } else {
      setFallbackQr(null);
    }
    return () => {
      alive = false;
    };
  }, [doc?.tteStatus, doc?.qrDataUrl, doc?.qrVerifyCode]);

  const qrSrc = doc?.qrDataUrl || fallbackQr;

  const handleDownload = async () => {
    if (!doc || downloading) return;
    setDownloading(true);
    try {
      if (doc.signedPdfBase64) {
        // Dokumen sudah ditandatangani — unduh PDF final hasil signing
        const bytes = base64ToBytes(doc.signedPdfBase64);
        downloadPdf(bytes, letterPdfFileName(doc));
      } else {
        // Belum TTE — render PDF dari data surat saat ini
        const bytes = await generateLetterPdf(doc);
        downloadPdf(bytes, letterPdfFileName(doc));
      }
    } catch (err) {
      console.error('Gagal membuat PDF', err);
      alert('Gagal membuat PDF. Silakan coba lagi.');
    } finally {
      setDownloading(false);
    }
  };

  const isConfidential = doc
    ? doc.urgency === 'Rahasia' || doc.isConfidential || doc.confidentiality === 'Rahasia'
    : false;

  const bodyText = doc
    ? doc.content ||
      doc.ocrSummary ||
      `Sehubungan dengan pelaksanaan agenda kedinasan dan koordinasi tata kelola operasional perusahaan, bersama ini disampaikan berkas resmi ${doc.subject || doc.title}.\n\nSeluruh ketentuan yang tercantum dalam dokumen ini mengikat dan memiliki kekuatan hukum serta keabsahan administrasi korporat sesuai dengan anggaran dasar PT BIN (Persero).\n\nDemikian surat ini kami sampaikan untuk menjadi pedoman dan dapat dilaksanakan dengan penuh tanggung jawab.`
    : '';

  const bodySegs: ContentSegment[] = doc ? parseContent(bodyText) : [];

  const renderSegment = (seg: ContentSegment, idx: number): Block => {
    const key = `body-${idx}`;

    if (seg.type === 'paragraph') {
      return {
        key,
        text: seg.text,
        node: <div className={BODY_CLASS} style={DOC_STYLE}>{renderRich(seg.text)}</div>,
      };
    }

    if (seg.type === 'image') {
      return {
        key,
        node: (
          <div className="my-6 text-center">
            <img
              src={seg.src}
              alt={seg.alt}
              className="inline-block max-w-full h-auto border border-slate-200 rounded-sm"
              onLoad={() => repaginateRef.current?.()}
            />
          </div>
        ),
      };
    }

    const hasWidths = !!seg.widths && seg.widths.length === seg.rows[0].length;

    return {
      key,
      node: (
        <div className="my-6 overflow-x-auto" style={DOC_STYLE}>
          <table className={`w-full border-collapse text-[11px] ${hasWidths ? 'table-fixed' : ''}`}>
            {hasWidths && (
              <colgroup>
                {seg.widths!.map((w, ci) => (
                  <col key={ci} style={{ width: `${w}%` }} />
                ))}
              </colgroup>
            )}
            <thead>
              <tr>
                {seg.rows[0].map((cell, ci) => (
                  <th
                    key={ci}
                    className="border border-slate-300 bg-slate-50 px-2 py-1.5 text-left font-semibold text-black"
                  >
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {seg.rows.slice(1).map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="border border-slate-300 px-2 py-1.5 text-black">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    };
  };

  const blocks: Block[] = doc
    ? [
        {
          key: 'kop',
          node: (
            <div className="border-b-2 border-slate-900 pb-4 mb-6">
              <div className="flex items-center justify-center gap-4">
                <div className="w-14 h-14 shrink-0 bg-gradient-to-br from-blue-900 to-slate-900 text-white rounded flex items-center justify-center font-bold text-xl tracking-tight border border-blue-950 shadow-sm">
                  BIN
                </div>
                <div className="text-center">
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
            </div>
          ),
        },
        {
          key: 'meta',
          node: (
            <div className="text-[11px] text-black mb-6" style={DOC_STYLE}>
              <p className="text-black text-right">
                Jakarta, {formatTanggalSurat(doc.date || doc.receivedDate || doc.dateCreated || '4 Oktober 2026')}
              </p>

              <div className="space-y-1 mt-4">
                <div className="flex">
                  <span className="w-24 shrink-0 text-black">Nomor</span>
                  <span className="text-black font-semibold">
                    : {doc.letterNumber || doc.draftNumber || doc.agendaNumber || doc.documentNumber || '-'}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-24 shrink-0 text-black">Sifat</span>
                  <span className="text-black font-medium">: {doc.urgency || doc.confidentiality || 'Biasa'}</span>
                </div>
                <div className="flex">
                  <span className="w-24 shrink-0 text-black">Lampiran</span>
                  <span className="text-black">: {doc.lampiranText || `${doc.attachmentsCount || 1} berkas`}</span>
                </div>
                <div className="flex">
                  <span className="w-24 shrink-0 text-black">Perihal</span>
                  <span className="text-black font-semibold">: {doc.subject || doc.title}</span>
                </div>

                <div className="mt-4">
                  <p className="text-black">Kepada Yth:</p>
                  <p className="font-semibold text-black">{doc.recipient || doc.sender || 'Pimpinan Unit Kerja Terkait'}</p>
                  <p className="text-black">{doc.recipientOrg || doc.organization || 'PT Badan Industri Nusantara'}</p>
                  <p className="text-black mt-1">Di tempat</p>
                </div>
              </div>
            </div>
          ),
        },
        ...bodySegs.map(renderSegment),
        {
          key: 'sign',
          node: (
            <div className="mt-12 pt-4 flex items-end justify-between" style={DOC_STYLE}>
              {/* Signer Title */}
              <div className="text-left">
                <p className="text-[11px] text-black">PT BADAN INDUSTRI NUSANTARA (PERSERO)</p>
                <p className="text-[11px] leading-6">&nbsp;</p>
                <p className="text-[11px] leading-6">&nbsp;</p>

                {doc.tteStatus === 'Sudah TTE' ? (
                  <div className="text-left">
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-black bg-blue-50 px-2 py-1 rounded border border-blue-200 mt-8 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Ditandatangani secara Elektronik</span>
                    </div>
                    <p className="text-[11px] font-bold text-black">
                      {doc.tteSigner ? doc.tteSigner.split('(')[0].trim() : 'Ir. H. Hendrawan Suprayogi, M.M.'}
                    </p>
                    <p className="text-[11px] font-semibold text-black">
                      {doc.tteSigner ? doc.tteSigner.split('(')[1]?.replace(')', '') || 'Direktur Utama' : 'Direktur Utama'}
                    </p>
                    <p className="text-[11px] text-black">
                      Timestamp: {doc.tteDate || '2026-10-04 15:45 WIB'}
                    </p>
                    <p className="text-[11px] text-black max-w-[340px] mt-2 leading-snug">
                      {doc.tteProvider === 'bsre'
                        ? 'Dokumen ini telah ditandatangani secara elektronik menggunakan sertifikat elektronik yang diterbitkan oleh Balai Sertifikasi Elektronik (BSrE), BSSN.'
                        : 'Dokumen ini telah ditandatangani secara elektronik melalui sistem e-Office PT BIN (provider: Lokal) - menunggu integrasi BSrE, BSSN.'}
                    </p>
                  </div>
                ) : (
                  <div className="text-left">
                    <div className="h-10"></div>
                    <p className="text-[11px] font-bold text-black">
                      {doc.creatorName || 'Ir. H. Hendrawan Suprayogi, M.M.'}
                    </p>
                    <p className="text-[11px] font-semibold text-black">
                      {doc.tteSigner ? doc.tteSigner.split('(')[1]?.replace(')', '') || 'Direktur Utama' : 'Direktur Utama'}
                    </p>
                  </div>
                )}
              </div>

              {/* QR Verification Box — hanya tampil bila sudah TTE */}
              {doc.tteStatus === 'Sudah TTE' && (
                <div className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-200 rounded text-left">
                  <div
                    onClick={handleVerifyQR}
                    className="w-16 h-16 bg-white border border-slate-300 p-1 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors shadow-xs"
                    title="Klik untuk memverifikasi QR Code"
                  >
                    {qrSrc ? (
                      <img src={qrSrc} alt="QR TTE" className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full bg-slate-900 rounded-[2px] flex items-center justify-center p-1 text-[8px] font-mono text-white text-center leading-tight animate-pulse">
                        QR TTE
                      </div>
                    )}
                  </div>
                  <div className="text-[11px] space-y-0.5 text-black">
                    <div className="flex items-center gap-1 text-black font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Terverifikasi Elektronik</span>
                    </div>
                    <p className="text-black">
                      {doc.qrVerifyCode || '-'}
                    </p>
                    <button
                      onClick={handleVerifyQR}
                      className="text-black underline font-medium text-[11px]"
                    >
                      Cek Validitas TTE
                    </button>
                  </div>
                </div>
              )}
            </div>
          ),
        },
        ...(doc.tembusanText
          ? [
              {
                key: 'tembusan',
                node: (
                  <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-black" style={DOC_STYLE}>
                    <p className="font-semibold text-black mb-1">Tembusan:</p>
                    <p className="text-black whitespace-pre-line">{doc.tembusanText}</p>
                  </div>
                ),
              } as Block,
            ]
          : []),
      ]
    : [];

  React.useLayoutEffect(() => {
    if (!doc) {
      setPages([]);
      return;
    }

    const run = () => {
      const host = measureRef.current;
      if (!host) return;

      const kids = Array.from(host.children) as HTMLElement[];
      const next: PageItem[][] = [[]];
      const used: number[] = [0];
      let p = 0;
      const maxH = CONTENT_H - FIT_BUFFER;

      const newPage = () => {
        next.push([]);
        used.push(0);
        p++;
      };

      const marginsOf = (el: HTMLElement) => {
        const cs = getComputedStyle(el);
        return (parseFloat(cs.marginTop) || 0) + (parseFloat(cs.marginBottom) || 0);
      };

      kids.forEach((kid, i) => {
        const block = blocks[i];
        if (!block) return;

        const margins = marginsOf(kid);
        const totalH = kid.getBoundingClientRect().height + margins;

        if (block.text === undefined) {
          if (used[p] > 0 && used[p] + totalH > maxH) newPage();
          next[p].push({ key: block.key });
          used[p] += totalH;
          return;
        }

        const tokens = block.text.split(/(\s+)/);
        let buf = '';
        let bufH = margins;
        let t = 0;

        while (t < tokens.length) {
          kid.textContent = stripInline(buf + tokens[t]);
          const h = kid.getBoundingClientRect().height + margins;

          if (h <= maxH - used[p]) {
            buf += tokens[t];
            bufH = h;
            t++;
          } else if (buf !== '') {
            next[p].push({ key: block.key, text: buf.trimEnd() });
            used[p] += bufH;
            newPage();
            buf = '';
            bufH = margins;
          } else if (used[p] > 0) {
            newPage();
          } else {
            next[p].push({ key: block.key, text: (buf + tokens[t]).trimEnd() });
            used[p] += h;
            buf = '';
            bufH = margins;
            t++;
            newPage();
          }
        }

        if (buf.trim()) {
          next[p].push({ key: block.key, text: buf.trimEnd() });
          used[p] += bufH;
        }
      });

      setPages(next);
    };

    repaginateRef.current = run;
    run();
    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready.then(run).catch(() => undefined);
    }
  }, [doc]);

  if (!doc || !portalEl) return null;

  const nodeByKey: Record<string, React.ReactNode> = {};
  blocks.forEach((b) => {
    nodeByKey[b.key] = b.node;
  });

  const watermark = isConfidential ? (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 select-none overflow-hidden">
      <span className="text-8xl font-black tracking-widest text-red-600 -rotate-45 transform">RAHASIA</span>
    </div>
  ) : null;

  const sheetList =
    pages.length > 0 ? (
      pages.map((items, pageIdx) => (
        <div
          key={pageIdx}
          className="a4-page relative bg-white shadow-sm border border-slate-200 rounded-sm text-slate-900 select-text overflow-hidden shrink-0"
          style={{ width: PAGE_W, height: PAGE_H, padding: PAGE_PAD }}
        >
          {watermark}
          {items.map((it, j) =>
            it.text !== undefined ? (
              <div key={`${it.key}-${j}`} className={BODY_CLASS} style={DOC_STYLE}>
                {renderRich(it.text)}
              </div>
            ) : (
              <React.Fragment key={it.key}>{nodeByKey[it.key]}</React.Fragment>
            )
          )}
        </div>
      ))
    ) : (
      <div
        className="a4-page relative bg-white shadow-sm border border-slate-200 rounded-sm text-slate-900 select-text overflow-hidden shrink-0"
        style={{ width: PAGE_W, height: PAGE_H, padding: PAGE_PAD, overflowY: 'auto' }}
      >
        {watermark}
        {blocks.map((b) => (
          <React.Fragment key={b.key}>{b.node}</React.Fragment>
        ))}
      </div>
    );

  return createPortal(
    <div className="preview-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="preview-modal relative w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
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
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-60 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> {downloading ? 'Membuat PDF…' : 'Unduh PDF'}
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

        {/* Document Sheet Viewport (A4 pages) */}
        <div className="preview-viewport p-8 sm:p-12 overflow-y-auto overflow-x-auto bg-slate-100/60 flex justify-center">
          <div className="flex flex-col items-center gap-8">{sheetList}</div>
        </div>

        {/* Hidden measurement host for pagination */}
        <div
          ref={measureRef}
          aria-hidden
          className="invisible fixed top-0 text-slate-900"
          style={{ left: -10000, width: CONTENT_W }}
        >
          {blocks.map((b) => (
            <React.Fragment key={b.key}>{b.node}</React.Fragment>
          ))}
        </div>
      </div>
    </div>,
    portalEl
  );
};
