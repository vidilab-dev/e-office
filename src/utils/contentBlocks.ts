export type ContentSegment =
  | { type: 'paragraph'; text: string }
  | { type: 'image'; src: string; alt: string }
  | { type: 'table'; rows: string[][]; widths?: number[] };

const IMAGE_RE = /^\s*!\[([^\]]*)\]\(([^()]+)\)\s*$/;
const PERCENT_RE = /^\d+(\.\d+)?%$/;

export const equalWidths = (cols: number): number[] =>
  Array.from({ length: cols }, () => Math.round((100 / cols) * 100) / 100);

const splitTableRow = (line: string): string[] => {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  return s.split('|').map((c) => c.trim());
};

const isSeparatorRow = (cells: string[]) => cells.length > 0 && cells.every((c) => /^:?-{3,}:?$/.test(c));

export const parseContent = (raw: string): ContentSegment[] => {
  const segs: ContentSegment[] = [];
  const lines = (raw || '').split('\n');
  let textBuf: string[] = [];

  const flushText = () => {
    const joined = textBuf.join('\n').replace(/^\n+/, '').replace(/\n+$/, '');
    if (joined.trim()) segs.push({ type: 'paragraph', text: joined });
    textBuf = [];
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    const img = line.match(IMAGE_RE);
    if (img) {
      flushText();
      segs.push({ type: 'image', alt: img[1].trim(), src: img[2].trim() });
      i++;
      continue;
    }

    if (line.trim().startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      const rows = tableLines.map(splitTableRow);
      let widths: number[] | undefined;
      if (rows.length >= 2 && rows[1].every((c) => PERCENT_RE.test(c))) {
        widths = rows[1].map((c) => parseFloat(c));
        rows.splice(1, 1);
      } else if (rows.length >= 2 && isSeparatorRow(rows[1])) {
        rows.splice(1, 1);
      }
      if (rows.length > 0) {
        flushText();
        segs.push({ type: 'table', rows, ...(widths ? { widths } : {}) });
      }
      continue;
    }

    textBuf.push(line);
    i++;
  }

  flushText();
  return segs;
};

export const buildTableSegment = (cols: number, rows: number): ContentSegment => {
  const c = Math.min(Math.max(Math.round(cols) || 0, 1), 12);
  const r = Math.min(Math.max(Math.round(rows) || 0, 2), 20);
  const header = Array.from({ length: c }, (_, i) => `Kolom ${i + 1}`);
  const body = Array.from({ length: r - 1 }, () => Array.from({ length: c }, () => ''));
  return { type: 'table', rows: [header, ...body] };
};

export type InlineRun = { text: string; bold?: boolean; italic?: boolean; underline?: boolean };

export type LineKind =
  | { type: 'text'; rest: string }
  | { type: 'bullet'; rest: string }
  | { type: 'number'; rest: string; n: number };

const NUMBER_LINE_RE = /^\s*(\d+)\.\s+(.*)$/;
const BULLET_LINE_RE = /^\s*[-•]\s+(.*)$/;

export const classifyLine = (line: string): LineKind => {
  const b = line.match(BULLET_LINE_RE);
  if (b) return { type: 'bullet', rest: b[1] };
  const n = line.match(NUMBER_LINE_RE);
  if (n) return { type: 'number', rest: n[2], n: parseInt(n[1], 10) };
  return { type: 'text', rest: line };
};

/**
 * Parser inline: **Tebal**, *Miring*, __Garis Bawah__.
 * Pasangan marker yang tidak tertutup akan tampil literal (aman untuk konten lama).
 */
const parseRange = (src: string, end: number): InlineRun[] => {
  const runs: InlineRun[] = [];
  const closers = new Map<number, string>();
  let bold = false;
  let italic = false;
  let underline = false;
  let buf = '';

  const flush = () => {
    if (!buf) return;
    const run: InlineRun = { text: buf };
    if (bold) run.bold = true;
    if (italic) run.italic = true;
    if (underline) run.underline = true;
    runs.push(run);
    buf = '';
  };

  const toggle = (marker: string) => {
    flush();
    if (marker === '**') bold = !bold;
    else if (marker === '__') underline = !underline;
    else italic = !italic;
  };

  let i = 0;
  while (i < end) {
    const closeMarker = closers.get(i);
    if (closeMarker !== undefined) {
      toggle(closeMarker);
      i += closeMarker.length;
      continue;
    }
    if (src.startsWith('**', i)) {
      const j = src.indexOf('**', i + 2);
      if (j === -1 || j + 2 > end) {
        buf += '**';
        i += 2;
        continue;
      }
      closers.set(j, '**');
      toggle('**');
      i += 2;
      continue;
    }
    if (src.startsWith('__', i)) {
      const j = src.indexOf('__', i + 2);
      if (j === -1 || j + 2 > end) {
        buf += '__';
        i += 2;
        continue;
      }
      closers.set(j, '__');
      toggle('__');
      i += 2;
      continue;
    }
    if (src[i] === '*') {
      let p = i + 1;
      let close = -1;
      while (p < end) {
        if (src.startsWith('**', p)) {
          p += 2;
          continue;
        }
        if (src[p] === '*') {
          close = p;
          break;
        }
        p++;
      }
      if (close === -1) {
        buf += '*';
        i++;
        continue;
      }
      closers.set(close, '*');
      toggle('*');
      i++;
      continue;
    }
    buf += src[i];
    i++;
  }
  flush();
  return runs;
};

export const parseInline = (src: string): InlineRun[] => {
  const s = src || '';
  return parseRange(s, s.length);
};

export const stripInline = (src: string): string =>
  parseInline(src)
    .map((r) => r.text)
    .join('');

/** Teks polos (tanpa marker format & tanpa prefix daftar) — untuk pratinjau mini. */
export const toPlainText = (text: string): string =>
  (text || '')
    .split('\n')
    .map((line) => stripInline(classifyLine(line).rest))
    .join('\n');

export const serializeContent = (segs: ContentSegment[]): string =>
  segs
    .map((seg) => {
      if (seg.type === 'paragraph') return seg.text;
      if (seg.type === 'image') return `![${seg.alt}](${seg.src})`;
      const lines = seg.rows.map((row) => `| ${row.join(' | ')} |`);
      if (seg.widths && seg.widths.length === seg.rows[0].length) {
        lines.splice(1, 0, `| ${seg.widths.map((w) => `${Math.round(w * 10) / 10}%`).join(' | ')} |`);
      }
      return lines.join('\n');
    })
    .join('\n\n');
