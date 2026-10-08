import { PDFDocument, PDFPage, StandardFonts, rgb, PDFFont, RGB } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { parseContent, parseInline, classifyLine, ContentSegment, InlineRun } from '../../utils/contentBlocks';
import { formatTanggalSurat } from '../../utils/formatDate';
import { base64ToBytes } from '../../utils/bytes';
import { makeQrDataUrl } from '../../utils/qr';

const A4_W = 595.28;
const A4_H = 841.89;
const MARGIN = 42.52; // 15mm
const CONTENT_W = A4_W - MARGIN * 2;
const BOTTOM = MARGIN;

const LABEL_W = 72; // lebar kolom label meta (≈ w-24)
// Teks dokumen (tanggal → tembusan): Tahoma 11px @96dpi = 8.25pt — identik dengan preview
const DOC_SIZE = 11 * (72 / 96);
const DOC_LEAD = 12;

export interface LetterPdfDoc {
  letterNumber?: string;
  draftNumber?: string;
  agendaNumber?: string;
  documentNumber?: string;
  date?: string;
  receivedDate?: string;
  dateCreated?: string;
  urgency?: string;
  confidentiality?: string;
  lampiranText?: string;
  attachmentsCount?: number;
  subject?: string;
  title?: string;
  recipient?: string;
  sender?: string;
  recipientOrg?: string;
  organization?: string;
  content?: string;
  ocrSummary?: string;
  tembusanText?: string;
  tteStatus?: string;
  tteSigner?: string;
  tteDate?: string;
  tteProvider?: string;
  creatorName?: string;
  qrDataUrl?: string;
  qrVerifyCode?: string;
}

export const letterPdfFileName = (doc: LetterPdfDoc): string => {
  const base = doc.letterNumber || doc.draftNumber || doc.agendaNumber || doc.documentNumber || doc.subject || 'dokumen';
  return `${base}.pdf`.replace(/[\\/:*?"<>|]+/g, '-');
};

const enc = (s: string) =>
  s
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/[^\u0020-\u00FF\n]/g, '?');

/** Muat Tahoma dari /public/fonts; gagal → fallback Helvetica. */
const loadTahoma = async (pdf: PDFDocument): Promise<{ reg: PDFFont; bold: PDFFont } | null> => {
  try {
    pdf.registerFontkit(fontkit);
    const [regRes, boldRes] = await Promise.all([fetch('/fonts/tahoma.ttf'), fetch('/fonts/tahomabd.ttf')]);
    if (!regRes.ok || !boldRes.ok) return null;
    const [regBuf, boldBuf] = await Promise.all([regRes.arrayBuffer(), boldRes.arrayBuffer()]);
    const reg = await pdf.embedFont(new Uint8Array(regBuf), { subset: true });
    const bold = await pdf.embedFont(new Uint8Array(boldBuf), { subset: true });
    return { reg, bold };
  } catch {
    return null;
  }
};

export const generateLetterPdf = async (doc: LetterPdfDoc): Promise<Uint8Array> => {
  const pdf = await PDFDocument.create();
  pdf.setTitle(letterPdfFileName(doc).replace(/\.pdf$/, ''));
  pdf.setProducer('e-Office PT BIN');

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // Tahoma untuk teks dokumen (tanggal → tembusan); kop surat tetap Helvetica
  const tahoma = await loadTahoma(pdf);
  const docFont = tahoma?.reg ?? font;
  const docBold = tahoma?.bold ?? bold;
  // Tahoma tidak punya varian italic — pakai Helvetica-Oblique (font standar PDF)
  const docItalic = await pdf.embedFont(StandardFonts.HelveticaOblique);

  let page: PDFPage = pdf.addPage([A4_W, A4_H]);
  let y = A4_H - MARGIN; // jarak dari atas

  const black = rgb(0.06, 0.09, 0.15);
  const ink = rgb(0, 0, 0); // hitam murni — teks dokumen
  const slate6 = rgb(0.28, 0.33, 0.41);
  const slate5 = rgb(0.39, 0.45, 0.55);

  const addPage = () => {
    page = pdf.addPage([A4_W, A4_H]);
    y = A4_H - MARGIN;
  };

  const ensure = (h: number) => {
    if (y - h < BOTTOM) addPage();
  };

  const wrap = (text: string, f: PDFFont, size: number, width: number): string[] => {
    const out: string[] = [];
    for (const raw of enc(text).split('\n')) {
      if (raw === '') {
        out.push('');
        continue;
      }
      const words = raw.split(/\s+/);
      let line = '';
      for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (f.widthOfTextAtSize(test, size) <= width) {
          line = test;
        } else {
          if (line) out.push(line);
          line = w;
          while (f.widthOfTextAtSize(line, size) > width && line.length > 1) {
            let cut = line.length - 1;
            while (cut > 1 && f.widthOfTextAtSize(line.slice(0, cut), size) > width) cut--;
            out.push(line.slice(0, cut));
            line = line.slice(cut);
          }
        }
      }
      out.push(line);
    }
    return out;
  };

  const drawLines = (lines: string[], x: number, size: number, f: PDFFont, color = ink, leading = size * 1.45) => {
    for (const l of lines) {
      page.drawText(l, { x, y: y - size, size, font: f, color });
      y -= leading;
    }
  };

  // ---------- KOP SURAT ----------
  const drawKop = () => {
    const logoSize = 34;
    const gap = 14;
    const title = 'PT BADAN INDUSTRI NUSANTARA (PERSERO)';
    const phone =
      'Telepon: (021) 5299-8800 | Faksimili: (021) 5299-8801 | Surel: sekretariat@bin.co.id | www.bin.co.id';
    const addr = wrap(
      'Kantor Pusat: Gedung Sentra Graha Lt. 8-12, Jl. Jend. Sudirman Kav. 52-53, Jakarta 12190',
      font,
      8,
      CONTENT_W - logoSize - gap
    );

    // Grup [logo + blok teks] dipusatkan; teks rata tengah di dalam bloknya
    const titleW = bold.widthOfTextAtSize(title, 13);
    const phoneW = font.widthOfTextAtSize(phone, 7.5);
    const textW = Math.max(titleW, phoneW, ...addr.map((l) => font.widthOfTextAtSize(l, 8)));
    const groupX = MARGIN + Math.max(0, (CONTENT_W - (logoSize + gap + textW)) / 2);
    const textX = groupX + logoSize + gap;

    page.drawRectangle({
      x: groupX,
      y: y - logoSize,
      width: logoSize,
      height: logoSize,
      color: rgb(0.06, 0.24, 0.45),
    });
    const binW = bold.widthOfTextAtSize('BIN', 15);
    page.drawText('BIN', { x: groupX + (logoSize - binW) / 2, y: y - 23, size: 15, font: bold, color: rgb(1, 1, 1) });

    const drawIn = (text: string, f: PDFFont, size: number, yPos: number, color: RGB) => {
      const w = f.widthOfTextAtSize(text, size);
      page.drawText(text, { x: textX + (textW - w) / 2, y: yPos, size, font: f, color });
    };

    drawIn(title, bold, 13, y - 12, black);
    let ky = y - 24;
    for (const l of addr) {
      drawIn(l, font, 8, ky - 6, slate6);
      ky -= 11;
    }
    drawIn(phone, font, 7.5, ky - 6, slate5);

    y = Math.min(ky - 6, y - logoSize) - 8;
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: A4_W - MARGIN, y },
      thickness: 1.6,
      color: black,
    });
    y -= 24;
  };

  // ---------- BLOK META ----------
  const metaRow = (label: string, value: string, f: PDFFont = docFont) => {
    page.drawText(label, { x: MARGIN, y: y - 8, size: DOC_SIZE, font: docFont, color: ink });
    const lines = wrap(`: ${value}`, f, DOC_SIZE, CONTENT_W - LABEL_W);
    drawLines(lines, MARGIN + LABEL_W, DOC_SIZE, f, ink, DOC_LEAD);
    y -= 2;
  };

  const drawMeta = () => {
    const dateLine = wrap(
      `Jakarta, ${formatTanggalSurat(doc.date || doc.receivedDate || doc.dateCreated || '4 Oktober 2026')}`,
      docFont,
      DOC_SIZE,
      CONTENT_W
    );
    for (const l of dateLine) {
      page.drawText(l, {
        x: A4_W - MARGIN - docFont.widthOfTextAtSize(l, DOC_SIZE),
        y: y - 8,
        size: DOC_SIZE,
        font: docFont,
        color: ink,
      });
      y -= DOC_LEAD;
    }
    y -= 10;
    metaRow('Nomor', doc.letterNumber || doc.draftNumber || doc.agendaNumber || doc.documentNumber || '-', docBold);
    metaRow('Sifat', doc.urgency || doc.confidentiality || 'Biasa');
    metaRow('Lampiran', doc.lampiranText || `${doc.attachmentsCount || 1} berkas`);
    metaRow('Perihal', doc.subject || doc.title || '-');
    y -= 14;

    const toLines = wrap(doc.recipient || doc.sender || 'Pimpinan Unit Kerja Terkait', docBold, DOC_SIZE, CONTENT_W);
    const orgLines = wrap(doc.recipientOrg || doc.organization || 'PT Badan Industri Nusantara', docFont, DOC_SIZE, CONTENT_W);
    ensure(toLines.length * DOC_LEAD + orgLines.length * DOC_LEAD + 44);
    page.drawText('Kepada Yth:', { x: MARGIN, y: y - 8, size: DOC_SIZE, font: docFont, color: ink });
    y -= 15;
    drawLines(toLines, MARGIN, DOC_SIZE, docBold, ink, DOC_LEAD);
    drawLines(orgLines, MARGIN, DOC_SIZE, docFont, ink, DOC_LEAD);
    y -= 6;
    page.drawText('Di tempat', { x: MARGIN, y: y - 8, size: DOC_SIZE, font: docFont, color: ink });
    y -= 26;
  };

  // ---------- BODY ----------
  type PdfRun = InlineRun;

  const runFont = (r: PdfRun): PDFFont => (r.bold ? docBold : r.italic ? docItalic : docFont);

  const toPdfRuns = (text: string): PdfRun[] =>
    parseInline(text).map((r) => ({ ...r, text: enc(r.text) }));

  /** Gulung kumpulan run (dengan font masing-masing) ke baris-baris selebar `width`. */
  const wrapRuns = (runs: PdfRun[], width: number): PdfRun[][] => {
    const lines: PdfRun[][] = [];
    let line: PdfRun[] = [];
    let lineW = 0;

    const pushText = (r: PdfRun, t: string) => {
      if (!t) return;
      const last = line[line.length - 1];
      if (
        last &&
        !!last.bold === !!r.bold &&
        !!last.italic === !!r.italic &&
        !!last.underline === !!r.underline
      ) {
        last.text += t;
      } else {
        line.push({ ...r, text: t });
      }
    };

    const flush = () => {
      if (line.length) {
        const last = line[line.length - 1];
        last.text = last.text.replace(/\s+$/, '');
        if (!last.text) line.pop();
      }
      lines.push(line);
      line = [];
      lineW = 0;
    };

    for (const run of runs) {
      const f = runFont(run);
      const parts = run.text.split('\n');
      parts.forEach((part, pi) => {
        if (pi > 0) flush();
        for (const token of part.split(/(\s+)/)) {
          if (!token) continue;
          if (/^\s+$/.test(token)) {
            if (line.length && lineW + f.widthOfTextAtSize(token, DOC_SIZE) <= width) {
              pushText(run, token);
              lineW += f.widthOfTextAtSize(token, DOC_SIZE);
            }
            continue;
          }
          let word = token;
          let w = f.widthOfTextAtSize(word, DOC_SIZE);
          if (lineW + w > width && line.length) flush();
          while (w > width && word.length > 1) {
            let cut = word.length - 1;
            while (cut > 1 && f.widthOfTextAtSize(word.slice(0, cut), DOC_SIZE) > width) cut--;
            pushText(run, word.slice(0, cut));
            flush();
            word = word.slice(cut);
            w = f.widthOfTextAtSize(word, DOC_SIZE);
          }
          pushText(run, word);
          lineW += f.widthOfTextAtSize(word, DOC_SIZE);
        }
      });
    }
    if (line.length) lines.push(line);
    return lines;
  };

  const drawRunLine = (line: PdfRun[], x0: number) => {
    let x = x0;
    for (const r of line) {
      if (!r.text) continue;
      const f = runFont(r);
      page.drawText(r.text, { x, y: y - DOC_SIZE, size: DOC_SIZE, font: f, color: ink });
      const w = f.widthOfTextAtSize(r.text, DOC_SIZE);
      if (r.underline) {
        page.drawLine({
          start: { x, y: y - DOC_SIZE - 1.5 },
          end: { x: x + w, y: y - DOC_SIZE - 1.5 },
          thickness: 0.6,
          color: ink,
        });
      }
      x += w;
    }
  };

  const LIST_INDENT = 16;

  const drawParagraph = (text: string) => {
    for (const line of text.split('\n')) {
      const kind = classifyLine(line);
      if (kind.type === 'bullet' || kind.type === 'number') {
        const marker = kind.type === 'bullet' ? '•' : `${kind.n}.`;
        const wrapped = wrapRuns(toPdfRuns(kind.rest), CONTENT_W - LIST_INDENT);
        if (wrapped.length === 0) wrapped.push([]);
        wrapped.forEach((ln, i) => {
          ensure(DOC_LEAD);
          if (i === 0) {
            page.drawText(marker, { x: MARGIN, y: y - DOC_SIZE, size: DOC_SIZE, font: docFont, color: ink });
          }
          drawRunLine(ln, MARGIN + LIST_INDENT);
          y -= DOC_LEAD;
        });
      } else {
        const wrapped = wrapRuns(toPdfRuns(line), CONTENT_W);
        if (wrapped.length === 0) wrapped.push([]);
        wrapped.forEach((ln) => {
          ensure(DOC_LEAD);
          drawRunLine(ln, MARGIN);
          y -= DOC_LEAD;
        });
      }
    }
    y -= 8;
  };

  const renderImage = async (src: string) => {
    try {
      const isJpg = src.startsWith('data:image/jpeg') || src.startsWith('data:image/jpg');
      const isPng = src.startsWith('data:image/png');
      if (!isJpg && !isPng) return;
      const bytes = base64ToBytes(src.slice(src.indexOf(',') + 1));
      const image = isJpg ? await pdf.embedJpg(bytes) : await pdf.embedPng(bytes);
      const maxW = CONTENT_W;
      const maxH = 320;
      const scale = Math.min(maxW / image.width, maxH / image.height, 1);
      const w = image.width * scale;
      const h = image.height * scale;
      ensure(h + 10);
      page.drawImage(image, { x: MARGIN, y: y - h, width: w, height: h });
      y -= h + 14;
    } catch {
      /* lewati gambar gagal */
    }
  };

  const drawTable = (seg: Extract<ContentSegment, { type: 'table' }>) => {
    const allRows = seg.rows;
    if (allRows.length === 0) return;
    const header = allRows[0];
    const bodyRows = allRows.slice(1);
    const cols = header.length;
    const widths = (seg.widths && seg.widths.length === cols ? seg.widths : new Array(cols).fill(100 / cols)).map(
      (w) => (CONTENT_W * w) / 100
    );
    const padX = 5;
    const padY = 4;

    const rowLines = (cells: string[], f: PDFFont) =>
      cells.map((c, i) => wrap(c || '', f, DOC_SIZE, (widths[i] ?? CONTENT_W) - padX * 2));
    const rowHeight = (lines: string[][]) => Math.max(...lines.map((l) => Math.max(l.length, 1))) * (DOC_SIZE + 2) + padY * 2;

    const drawRow = (cells: string[], f: PDFFont, isHeader: boolean) => {
      const lines = rowLines(cells, f);
      const h = rowHeight(lines);
      ensure(h + 4);
      let x = MARGIN;
      for (let i = 0; i < cols; i++) {
        page.drawRectangle({
          x,
          y: y - h,
          width: widths[i],
          height: h,
          borderColor: rgb(0.8, 0.83, 0.88),
          borderWidth: 0.7,
          color: isHeader ? rgb(0.93, 0.95, 0.97) : undefined,
        });
        let ty = y - padY;
        for (const l of lines[i] || []) {
          page.drawText(l, { x: x + padX, y: ty - DOC_SIZE + 2, size: DOC_SIZE, font: f, color: ink });
          ty -= DOC_SIZE + 2;
        }
        x += widths[i];
      }
      y -= h;
    };

    drawRow(header, docBold, true);
    bodyRows.forEach((r) => {
      // baris harus tetap utuh; bila tak muat → halaman baru
      const lines = rowLines(r, docFont);
      if (y - rowHeight(lines) < BOTTOM) addPage();
      drawRow(r, docFont, false);
    });
    y -= 10;
  };

  // ---------- BLOK TANDA TANGAN ----------
  const drawSignature = async () => {
    const signed = doc.tteStatus === 'Sudah TTE';
    const signerName = signed
      ? (doc.tteSigner ? doc.tteSigner.split('(')[0].trim() : 'Ir. H. Hendrawan Suprayogi, M.M.')
      : doc.creatorName || 'Ir. H. Hendrawan Suprayogi, M.M.';
    const signerTitle = doc.tteSigner
      ? doc.tteSigner.split('(')[1]?.replace(')', '') || 'Direktur Utama'
      : 'Direktur Utama';

    const complianceLines = signed
      ? wrap(
          doc.tteProvider === 'bsre'
            ? 'Dokumen ini telah ditandatangani secara elektronik menggunakan sertifikat elektronik yang diterbitkan oleh Balai Sertifikasi Elektronik (BSrE), BSSN.'
            : 'Dokumen ini telah ditandatangani secara elektronik melalui sistem e-Office PT BIN (provider: Lokal) - menunggu integrasi BSrE, BSSN.',
          docFont,
          DOC_SIZE,
          CONTENT_W - 70
        )
      : [];

    const leftLines = signed
      ? ['PT BADAN INDUSTRI NUSANTARA (PERSERO)']
      : ['PT BADAN INDUSTRI NUSANTARA (PERSERO)'];
    const blockH = signed ? 200 : 120;
    ensure(blockH);

    y -= 16;
    page.drawText(leftLines[0], { x: MARGIN, y: y - 8, size: DOC_SIZE, font: docFont, color: ink });
    // 2 baris kosong antara nama perusahaan dan nama penandatangan
    y -= (signed ? 34 : 26) + 26;

    if (signed) {
      page.drawRectangle({
        x: MARGIN,
        y: y - 14,
        width: 168,
        height: 14,
        color: rgb(0.93, 0.96, 1),
        borderColor: rgb(0.78, 0.85, 0.95),
        borderWidth: 0.6,
      });
      page.drawText('Ditandatangani secara Elektronik', {
        x: MARGIN + 6,
        y: y - 10,
        size: DOC_SIZE,
        font: docBold,
        color: ink,
      });
      y -= 26;
    } else {
      y -= 6;
    }

    page.drawText(enc(signerName), { x: MARGIN, y: y - 8, size: DOC_SIZE, font: docBold, color: ink });
    y -= 14;
    page.drawText(enc(signerTitle), { x: MARGIN, y: y - 8, size: DOC_SIZE, font: docBold, color: ink });
    y -= 13;
    if (signed) {
      page.drawText(`Timestamp: ${doc.tteDate || ''}`, { x: MARGIN, y: y - 8, size: DOC_SIZE, font: docFont, color: ink });
      y -= DOC_LEAD;
    }
    for (const l of complianceLines) {
      page.drawText(l, { x: MARGIN, y: y - 7, size: DOC_SIZE, font: docFont, color: ink });
      y -= DOC_LEAD;
    }

    // QR — hanya bila sudah TTE (dataQR lama tanpa qrDataUrl → generate fallback)
    if (signed && doc.qrVerifyCode) {
      try {
        const qrDataUrl = doc.qrDataUrl || (await makeQrDataUrl(doc.qrVerifyCode));
        const bytes = base64ToBytes(qrDataUrl.slice(qrDataUrl.indexOf(',') + 1));
        const qr = await pdf.embedPng(bytes);
        const size = 56;
        const qx = A4_W - MARGIN - size;
        const qy = y - size + 10;
        page.drawRectangle({ x: qx - 4, y: qy - 4, width: size + 8, height: size + 8, borderColor: rgb(0.8, 0.83, 0.88), borderWidth: 0.7 });
        page.drawImage(qr, { x: qx, y: qy, width: size, height: size });
        const caption = wrap('Terverifikasi Elektronik', docFont, DOC_SIZE, size + 8);
        let cy = qy - 12;
        for (const l of caption) {
          page.drawText(l, { x: qx - 4, y: cy, size: DOC_SIZE, font: docBold, color: ink });
          cy -= DOC_LEAD;
        }
        const codeLines = wrap(doc.qrVerifyCode, docFont, DOC_SIZE, size + 8);
        for (const l of codeLines) {
          page.drawText(enc(l), { x: qx - 4, y: cy - 1, size: DOC_SIZE, font: docFont, color: ink });
          cy -= DOC_LEAD;
        }
      } catch {
        /* QR gagal embed — abaikan */
      }
    }
    y -= 16;
  };

  const drawTembusan = () => {
    if (!doc.tembusanText) return;
    ensure(40);
    y -= 6;
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: A4_W - MARGIN, y },
      thickness: 0.5,
      color: rgb(0.9, 0.92, 0.94),
    });
    y -= 14;
    page.drawText('Tembusan:', { x: MARGIN, y: y - 8, size: DOC_SIZE, font: docBold, color: ink });
    y -= DOC_LEAD;
    for (const l of wrap(doc.tembusanText, docFont, DOC_SIZE, CONTENT_W)) {
      page.drawText(l, { x: MARGIN, y: y - 8, size: DOC_SIZE, font: docFont, color: ink });
      y -= DOC_LEAD;
    }
  };

  // ---------- ALUR ----------
  const bodyText =
    doc.content ||
    doc.ocrSummary ||
    `Sehubungan dengan pelaksanaan agenda kedinasan dan koordinasi tata kelola operasional perusahaan, bersama ini disampaikan berkas resmi ${doc.subject || doc.title || ''}.\n\nSeluruh ketentuan yang tercantum dalam dokumen ini mengikat dan memiliki kekuatan hukum serta keabsahan administrasi korporat sesuai dengan anggaran dasar PT BIN (Persero).\n\nDemikian surat ini kami sampaikan untuk menjadi pedoman dan dapat dilaksanakan dengan penuh tanggung jawab.`;

  drawKop();
  drawMeta();

  for (const seg of parseContent(bodyText)) {
    if (seg.type === 'paragraph') drawParagraph(seg.text);
    else if (seg.type === 'image') await renderImage(seg.src);
    else if (seg.type === 'table') drawTable(seg);
  }

  await drawSignature();
  drawTembusan();

  return pdf.save();
};

export const downloadPdf = (bytes: Uint8Array, fileName: string): void => {
  const copy = new Uint8Array(bytes);
  const blob = new Blob([copy.buffer as ArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
};
