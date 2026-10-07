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
