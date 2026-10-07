import { PDFDocument, PDFPage, StandardFonts, rgb, PDFFont } from 'pdf-lib';
import { parseContent, ContentSegment } from '../../utils/contentBlocks';
import { formatTanggalSurat } from '../../utils/formatDate';
import { base64ToBytes } from '../../utils/bytes';
import { makeQrDataUrl } from '../../utils/qr';

const A4_W = 595.28;
const A4_H = 841.89;
const MARGIN = 42.52; // 15mm
const CONTENT_W = A4_W - MARGIN * 2;
const BOTTOM = MARGIN;

const LABEL_W = 72; // lebar kolom label meta (≈ w-24)
const BODY_SIZE = 10;
const BODY_LEAD = 14.5;
const SMALL = 8.5;

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

const enc = (s: string) => s.replace(/[^\u0020-\u00FF\n]/g, '?');

export const generateLetterPdf = async (doc: LetterPdfDoc): Promise<Uint8Array> => {
  const pdf = await PDFDocument.create();
  pdf.setTitle(letterPdfFileName(doc).replace(/\.pdf$/, ''));
  pdf.setProducer('e-Office PT BIN');

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);

  let page: PDFPage = pdf.addPage([A4_W, A4_H]);
  let y = A4_H - MARGIN; // jarak dari atas

  const black = rgb(0.06, 0.09, 0.15);
  const slate6 = rgb(0.28, 0.33, 0.41);
  const slate5 = rgb(0.39, 0.45, 0.55);
  const blue9 = rgb(0.08, 0.2, 0.45);

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

  const drawLines = (lines: string[], x: number, size: number, f: PDFFont, color = black, leading = size * 1.45) => {
    for (const l of lines) {
      page.drawText(l, { x, y: y - size, size, font: f, color });
      y -= leading;
    }
  };

  // ---------- KOP SURAT ----------
  const drawKop = () => {
    const logoSize = 34;
    page.drawRectangle({
      x: MARGIN,
      y: y - logoSize,
      width: logoSize,
      height: logoSize,
      color: rgb(0.06, 0.24, 0.45),
    });
    page.drawText('BIN', { x: MARGIN + 7, y: y - 23, size: 15, font: bold, color: rgb(1, 1, 1) });

    const tx = MARGIN + logoSize + 14;
    page.drawText('PT BADAN INDUSTRI NUSANTARA (PERSERO)', {
      x: tx,
      y: y - 12,
      size: 13,
      font: bold,
      color: black,
    });
    const addr = wrap(
      'Kantor Pusat: Gedung Sentra Graha Lt. 8-12, Jl. Jend. Sudirman Kav. 52-53, Jakarta 12190',
      font,
      8,
      CONTENT_W - logoSize - 14 - 90
    );
    let ky = y - 24;
    for (const l of addr) {
      page.drawText(l, { x: tx, y: ky - 6, size: 8, font, color: slate6 });
      ky -= 11;
    }
    page.drawText('Telepon: (021) 5299-8800 | Faksimili: (021) 5299-8801 | Surel: sekretariat@bin.co.id | www.bin.co.id', {
      x: tx,
      y: ky - 6,
      size: 7.5,
      font,
      color: slate5,
    });
    page.drawText('ISO 9001:2015', { x: A4_W - MARGIN - 62, y: y - 12, size: 8, font: bold, color: slate6 });
    page.drawText('Cert No. ID-90827', { x: A4_W - MARGIN - 68, y: ky - 6, size: 7.5, font, color: slate5 });

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
  const metaRow = (label: string, value: string, f: PDFFont = font) => {
    page.drawText(label, { x: MARGIN, y: y - 9, size: 9.5, font, color: slate5 });
    const lines = wrap(`: ${value}`, f, 9.5, CONTENT_W - LABEL_W);
    drawLines(lines, MARGIN + LABEL_W, 9.5, f, black, 13);
    y -= 2;
  };

  const drawMeta = () => {
    const dateLine = wrap(
      `Jakarta, ${formatTanggalSurat(doc.date || doc.receivedDate || doc.dateCreated || '4 Oktober 2026')}`,
      font,
      9.5,
      CONTENT_W
    );
    for (const l of dateLine) {
      page.drawText(l, { x: A4_W - MARGIN - font.widthOfTextAtSize(l, 9.5), y: y - 9, size: 9.5, font, color: black });
      y -= 13;
    }
    y -= 10;
    metaRow('Nomor', doc.letterNumber || doc.draftNumber || doc.agendaNumber || doc.documentNumber || '-', bold);
    metaRow('Sifat', doc.urgency || doc.confidentiality || 'Biasa');
    metaRow('Lampiran', doc.lampiranText || `${doc.attachmentsCount || 1} berkas`);
    metaRow('Perihal', doc.subject || doc.title || '-');
    y -= 14;

    const toLines = wrap(doc.recipient || doc.sender || 'Pimpinan Unit Kerja Terkait', bold, 9.5, CONTENT_W);
    const orgLines = wrap(doc.recipientOrg || doc.organization || 'PT Badan Industri Nusantara', font, 9.5, CONTENT_W);
    ensure(toLines.length * 13 + orgLines.length * 13 + 44);
    page.drawText('Kepada Yth:', { x: MARGIN, y: y - 9, size: 9, font, color: slate5 });
    y -= 15;
    drawLines(toLines, MARGIN, 9.5, bold, black, 13);
    drawLines(orgLines, MARGIN, 9.5, font, slate6, 13);
    y -= 6;
    page.drawText('Di tempat', { x: MARGIN, y: y - 9, size: 9.5, font, color: slate6 });
    y -= 26;
  };

  // ---------- BODY ----------
  const drawParagraph = (text: string) => {
    const lines = wrap(text, font, BODY_SIZE, CONTENT_W);
    for (const l of lines) {
      ensure(BODY_LEAD);
      page.drawText(l, { x: MARGIN, y: y - BODY_SIZE, size: BODY_SIZE, font, color: black });
      y -= BODY_LEAD;
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
      cells.map((c, i) => wrap(c || '', f, BODY_SIZE, (widths[i] ?? CONTENT_W) - padX * 2));
    const rowHeight = (lines: string[][]) => Math.max(...lines.map((l) => Math.max(l.length, 1))) * (BODY_SIZE + 2) + padY * 2;

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
          page.drawText(l, { x: x + padX, y: ty - BODY_SIZE + 2, size: BODY_SIZE, font: f, color: black });
          ty -= BODY_SIZE + 2;
        }
        x += widths[i];
      }
      y -= h;
    };

    drawRow(header, bold, true);
    bodyRows.forEach((r) => {
      // baris harus tetap utuh; bila tak muat → halaman baru
      const lines = rowLines(r, font);
      if (y - rowHeight(lines) < BOTTOM) addPage();
      drawRow(r, font, false);
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
            : 'Dokumen ini telah ditandatangani secara elektronik melalui sistem e-Office PT BIN (provider: Lokal) — menunggu integrasi BSrE, BSSN.',
          font,
          7.5,
          CONTENT_W - 70
        )
      : [];

    const leftLines = signed
      ? ['PT BADAN INDUSTRI NUSANTARA (PERSERO)']
      : ['PT BADAN INDUSTRI NUSANTARA (PERSERO)'];
    const blockH = signed ? 165 : 95;
    ensure(blockH);

    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: MARGIN + 250, y },
      thickness: 0.7,
      color: rgb(0.85, 0.87, 0.9),
    });
    y -= 16;
    page.drawText(leftLines[0], { x: MARGIN, y: y - 8, size: SMALL, font, color: slate6 });
    y -= signed ? 34 : 26;

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
        size: 7.5,
        font: bold,
        color: blue9,
      });
      y -= 26;
    } else {
      y -= 6;
    }

    page.drawText(enc(signerName), { x: MARGIN, y: y - 10, size: 9.5, font: bold, color: black });
    y -= 14;
    page.drawText(enc(signerTitle), { x: MARGIN, y: y - 10, size: 9, font: bold, color: black });
    y -= 13;
    if (signed) {
      page.drawText(`Timestamp: ${doc.tteDate || ''}`, { x: MARGIN, y: y - 8, size: 7.5, font, color: slate5 });
      y -= 15;
    } else {
      page.drawText('NIP. BIN-19750812-001', { x: MARGIN, y: y - 8, size: 8, font, color: slate5 });
      y -= 15;
    }
    for (const l of complianceLines) {
      page.drawText(l, { x: MARGIN, y: y - 7, size: 7.5, font: italic, color: slate5 });
      y -= 10;
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
        const caption = wrap('Terverifikasi Elektronik', font, 7.5, size + 8);
        let cy = qy - 12;
        for (const l of caption) {
          page.drawText(l, { x: qx - 4, y: cy, size: 7.5, font: bold, color: slate6 });
          cy -= 9;
        }
        if (doc.qrVerifyCode) {
          page.drawText(enc(doc.qrVerifyCode).slice(0, 26), { x: qx - 4, y: cy - 1, size: 6.5, font, color: slate5 });
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
    page.drawText('Tembusan:', { x: MARGIN, y: y - 8, size: SMALL, font: bold, color: slate6 });
    y -= 13;
    for (const l of wrap(doc.tembusanText, font, SMALL, CONTENT_W)) {
      page.drawText(l, { x: MARGIN, y: y - 8, size: SMALL, font, color: slate6 });
      y -= 11;
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
