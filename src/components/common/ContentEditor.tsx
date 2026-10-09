import React, { useEffect, useRef, useState } from 'react';
import { ImagePlus, Table2, Plus, Minus, Trash2, Pilcrow, Bold, Italic, Underline, List, ListOrdered } from 'lucide-react';
import {
  buildTableSegment,
  equalWidths,
  parseContent,
  serializeContent,
  ContentSegment,
} from '../../utils/contentBlocks';
import { renderRich } from './RichText';

interface ContentEditorProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  required?: boolean;
  placeholder?: string;
  textareaClassName?: string;
}

const initialSegs = (value: string): ContentSegment[] => {
  const segs = parseContent(value);
  return segs.length > 0 ? segs : [{ type: 'paragraph', text: '' }];
};

const displayOf = (segs: ContentSegment[]): (string | null)[] =>
  segs.map((s) => (s.type === 'paragraph' ? s.text : null));

// ---------- Serialisasi contentEditable DOM ke markdown ----------

const stripTrailingNl = (s: string) => s.replace(/\n+$/, '');

/** Bungkus tiap baris (markdown inline tidak boleh membentang lintas baris). */
const wrapPerLine = (t: string, f: (line: string) => string) =>
  t
    .split('\n')
    .map((line) => (line ? f(line) : ''))
    .join('\n');

const inlineMd = (node: ChildNode): string => {
  if (node.nodeType === 3) return node.textContent || '';
  if (node.nodeType !== 1) return '';
  const el = node as HTMLElement;
  const tag = el.tagName;
  const inner = () => Array.from(el.childNodes).map(inlineMd).join('');
  if (tag === 'BR') return '\n';
  if (tag === 'B' || tag === 'STRONG') {
    const t = stripTrailingNl(inner());
    return t ? wrapPerLine(t, (l) => `**${l}**`) : '';
  }
  if (tag === 'I' || tag === 'EM') {
    const t = stripTrailingNl(inner());
    return t ? wrapPerLine(t, (l) => `*${l}*`) : '';
  }
  if (tag === 'U') {
    const t = stripTrailingNl(inner());
    return t ? wrapPerLine(t, (l) => `__${l}__`) : '';
  }
  if (tag === 'SPAN') {
    let t = stripTrailingNl(inner());
    if (t) {
      const st = el.style;
      const w = st.fontWeight;
      const wNum = parseInt(w, 10);
      if (w === 'bold' || w === 'bolder' || (!Number.isNaN(wNum) && wNum >= 600))
        t = wrapPerLine(t, (l) => `**${l}**`);
      if (st.fontStyle === 'italic') t = wrapPerLine(t, (l) => `*${l}*`);
      if (st.textDecoration.includes('underline')) t = wrapPerLine(t, (l) => `__${l}__`);
    }
    return t;
  }
  if (tag === 'UL' || tag === 'OL') {
    // Daftar bersarang (Tab) - format tidak didukung penyimpanan, pipihkan agar tidak hilang
    const ordered = tag === 'OL';
    let n = 0;
    const parts: string[] = [];
    for (const li of Array.from(el.children)) {
      if (li.tagName !== 'LI') continue;
      n++;
      const t = stripTrailingNl(Array.from(li.childNodes).map(inlineMd).join(''));
      parts.push(t.trim() ? (ordered ? `${n}. ${t}` : `- ${t}`) : '');
    }
    return parts.join('\n');
  }
  if (tag === 'DIV' || tag === 'P') return `${inner()}\n`;
  return inner();
};

export const serializeCE = (root: HTMLElement): string => {
  const lines: string[] = [];
  let cur = '';
  const flush = () => {
    lines.push(cur);
    cur = '';
  };
  const appendBlock = (content: string) => {
    const parts = content.split('\n');
    cur += parts[0];
    for (let i = 1; i < parts.length; i++) {
      flush();
      cur = parts[i];
    }
  };

  for (const child of Array.from(root.childNodes)) {
    if (child.nodeType === 3) {
      cur += child.textContent || '';
      continue;
    }
    if (child.nodeType !== 1) continue;
    const el = child as HTMLElement;
    const tag = el.tagName;
    if (tag === 'BR') {
      flush();
      continue;
    }
    if (tag === 'UL' || tag === 'OL') {
      if (cur.trim()) flush();
      const ordered = tag === 'OL';
      let n = 0;
      for (const li of Array.from(el.children)) {
        if (li.tagName !== 'LI') continue;
        n++;
        const text = stripTrailingNl(Array.from(li.childNodes).map(inlineMd).join(''));
        lines.push(text.trim() ? (ordered ? `${n}. ${text}` : `- ${text}`) : '');
      }
      continue;
    }
    if (tag === 'DIV' || tag === 'P') {
      if (cur !== '') flush();
      appendBlock(stripTrailingNl(Array.from(el.childNodes).map(inlineMd).join('')));
      continue;
    }
    cur += inlineMd(child);
  }
  if (cur !== '' || lines.length === 0) flush();
  return lines.join('\n');
};

// ---------- State aktif toolbar ----------

interface FmtState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  bullet: boolean;
  number: boolean;
}

const NO_FMT: FmtState = { bold: false, italic: false, underline: false, bullet: false, number: false };

const fmtBtnCls = (active: boolean) =>
  `inline-flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-semibold rounded-md border transition-colors ${
    active
      ? 'text-blue-900 bg-blue-50 border-blue-300'
      : 'text-slate-700 bg-white border-slate-300 hover:bg-slate-50'
  }`;

export const ContentEditor: React.FC<ContentEditorProps> = ({
  value,
  onChange,
  rows = 6,
  required,
  placeholder,
  textareaClassName = 'w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 font-sans leading-relaxed',
}) => {
  const [segs, setSegs] = useState<ContentSegment[]>(() => initialSegs(value));
  // Ref "hidup" dari segs: beberapa input bisa ter-batch dalam satu task, dan closure
  // handler lama akan saling menimpa bila membaca state dari render yang sama.
  const segsRef = useRef(segs);
  segsRef.current = segs;
  // Teks yang dirender React ke dalam contentEditable - hanya di-reset saat perubahan eksternal
  // (pilih template, sisipkan/hapus blok) agar tidak menimpa hasil ketikan/penggunaan tombol format.
  const displayTextsRef = useRef<(string | null)[] | null>(null);
  if (displayTextsRef.current === null) displayTextsRef.current = displayOf(segs);
  // Naikkan epoch saat display di-reset: React tidak pernah melihat hasil ketikan/execCommand,
  // sehingga editor harus di-remount agar DOM = vdom (mencegah append ganda).
  const [renderEpoch, setRenderEpoch] = useState(0);
  const resyncDisplays = (next: ContentSegment[]) => {
    displayTextsRef.current = displayOf(next);
    setRenderEpoch((e) => e + 1);
  };
  const lastSentRef = useRef(value);
  const focusIdxRef = useRef<number | null>(null);
  const blockRefs = useRef<Array<HTMLElement | null>>([]);
  const pendingFocusRef = useRef<number | null>(null);
  const activeEdRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [fmt, setFmt] = useState<FmtState>(NO_FMT);

  const syncFmt = () => {
    const ed = activeEdRef.current;
    if (!ed || !ed.isConnected) {
      setFmt(NO_FMT);
      return;
    }
    const q = (cmd: string) => {
      try {
        return document.queryCommandState(cmd);
      } catch {
        return false;
      }
    };
    setFmt((prev) => {
      const next: FmtState = {
        bold: q('bold'),
        italic: q('italic'),
        underline: q('underline'),
        bullet: q('insertUnorderedList'),
        number: q('insertOrderedList'),
      };
      return prev.bold === next.bold &&
        prev.italic === next.italic &&
        prev.underline === next.underline &&
        prev.bullet === next.bullet &&
        prev.number === next.number
        ? prev
        : next;
    });
  };

  // Pantau status format saat kursor berpindah
  useEffect(() => {
    const onSelChange = () => {
      const ed = activeEdRef.current;
      if (!ed || !ed.isConnected) return;
      const sel = document.getSelection();
      if (!sel || !sel.anchorNode || !ed.contains(sel.anchorNode)) return;
      syncFmt();
    };
    document.addEventListener('selectionchange', onSelChange);
    return () => document.removeEventListener('selectionchange', onSelChange);
  }, []);

  // Re-init hanya saat value berubah dari luar (mis. memilih template)
  useEffect(() => {
    if (value !== lastSentRef.current) {
      const next = initialSegs(value);
      segsRef.current = next;
      resyncDisplays(next);
      setSegs(next);
      lastSentRef.current = value;
    }
  }, [value]);

  useEffect(() => {
    const idx = pendingFocusRef.current;
    if (idx === null) return;
    pendingFocusRef.current = null;
    window.requestAnimationFrame(() => {
      const el = blockRefs.current[idx]?.querySelector(
        '[contenteditable="true"], textarea, input'
      ) as HTMLElement | null;
      el?.focus();
    });
  }, [segs]);

  const push = (next: ContentSegment[]) => {
    const safe = next.length > 0 ? next : [{ type: 'paragraph' as const, text: '' }];
    segsRef.current = safe;
    setSegs(safe);
    const serialized = serializeContent(safe);
    lastSentRef.current = serialized;
    onChange(serialized);
  };

  const setParagraph = (idx: number, text: string) => {
    const next = segsRef.current.slice();
    next[idx] = { type: 'paragraph', text };
    push(next);
  };

/** Input dari contentEditable: serialisasi DOM ke markdown, tanpa me-reset tampilan. */
  const handleCEInput = (idx: number, el: HTMLDivElement) => {
    const md = serializeCE(el);
    if (!md && el.innerHTML !== '') el.innerHTML = '';
    setParagraph(idx, md);
    syncFmt();
  };

  /** Sisipkan teks literal di posisi kursor — deterministik untuk karakter \t. */
  const insertAtCaret = (el: HTMLElement, text: string): boolean => {
    const sel = document.getSelection();
    if (!sel || sel.rangeCount === 0) return false;
    const range = sel.getRangeAt(0);
    if (!el.contains(range.commonAncestorContainer)) return false;
    range.deleteContents();
    const node = document.createTextNode(text);
    range.insertNode(node);
    const after = document.createRange();
    after.setStartAfter(node);
    after.collapse(true);
    sel.removeAllRanges();
    sel.addRange(after);
    return true;
  };

  const textNodesIn = (root: HTMLElement): Text[] => {
    const out: Text[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n: Node | null;
    while ((n = walker.nextNode())) out.push(n as Text);
    return out;
  };

  /** Range dari offset global `start` sampai `end` (dihitung lintas text node). */
  const rangeAt = (root: HTMLElement, start: number, end: number): Range | null => {
    let acc = 0;
    let startNode: Text | null = null;
    let startOff = 0;
    let endNode: Text | null = null;
    let endOff = 0;
    for (const node of textNodesIn(root)) {
      const len = (node.textContent || '').length;
      if (startNode === null && start <= acc + len) {
        startNode = node;
        startOff = start - acc;
      }
      if (end <= acc + len) {
        endNode = node;
        endOff = end - acc;
        break;
      }
      acc += len;
    }
    if (!startNode || !endNode) return null;
    const r = document.createRange();
    r.setStart(startNode, startOff);
    r.setEnd(endNode, endOff);
    return r;
  };

  /** Hapus satu karakter \t tepat sebelum kursor (Shift+Tab), lintas text node. */
  const removeTabBeforeCaret = (el: HTMLElement): boolean => {
    const sel = document.getSelection();
    if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return false;
    const anchor = sel.anchorNode;
    if (!anchor || !el.contains(anchor)) return false;
    const caret = sel.getRangeAt(0);
    const before = document.createRange();
    before.setStart(el, 0);
    before.setEnd(caret.startContainer, caret.startOffset);
    const textBefore = before.toString();
    if (!textBefore.endsWith('\t')) return false;
    const at = textBefore.length - 1;
    const target = rangeAt(el, at, at + 1);
    if (!target) return false;
    target.deleteContents();
    const after = rangeAt(el, at, at);
    if (!after) return false;
    sel.removeAllRanges();
    sel.addRange(after);
    return true;
  };

  /** Tab = sisipkan jarak tab (sejajarkan tanda ":"); Shift+Tab = hapus tab sebelum kursor. */
  const handleKeyDown = (idx: number, el: HTMLDivElement, e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab' || e.ctrlKey || e.altKey || e.metaKey) return;
    e.preventDefault();
    const changed = e.shiftKey ? removeTabBeforeCaret(el) : insertAtCaret(el, '\t');
    if (changed) handleCEInput(idx, el);
  };

  /** Terapkan format via execCommand pada selection yang sedang aktif. */
  const execFmt = (
    cmd: 'bold' | 'italic' | 'underline' | 'insertUnorderedList' | 'insertOrderedList'
  ) => {
    const ed = activeEdRef.current;
    const idx = focusIdxRef.current;
    if (!ed || !ed.isConnected || idx === null || !segsRef.current[idx] || segsRef.current[idx].type !== 'paragraph') return;
    const sel = document.getSelection();
    if (!sel || !sel.anchorNode || !ed.contains(sel.anchorNode)) ed.focus();
    try {
      document.execCommand('styleWithCSS', false, 'false');
      document.execCommand(cmd, false);
    } catch {
      /* execCommand tidak didukung - abaikan */
    }
    const md = serializeCE(ed);
    if (!md && ed.innerHTML !== '') ed.innerHTML = '';
    setParagraph(idx, md);
    syncFmt();
  };

  const setTableCell = (idx: number, r: number, c: number, val: string) => {
    const seg = segsRef.current[idx];
    if (seg.type !== 'table') return;
    const next = segsRef.current.slice();
    next[idx] = {
      type: 'table',
      rows: seg.rows.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? val : cell)) : row)),
      ...(seg.widths ? { widths: seg.widths } : {}),
    };
    push(next);
  };

  const mutateTable = (idx: number, mutate: (rows: string[][]) => string[][]) => {
    const seg = segsRef.current[idx];
    if (seg.type !== 'table') return;
    const newRows = mutate(seg.rows);
    const oldCols = seg.rows[0].length;
    const newCols = newRows[0].length;

    let widths = seg.widths;
    if (widths && newCols !== oldCols) {
      if (newCols > oldCols) {
        const share = 100 / newCols;
        widths = [...widths.map((w) => (w * oldCols) / newCols), share];
      } else if (newCols > 0) {
        widths = widths.slice(0, newCols);
        const sum = widths.reduce((a, b) => a + b, 0) || 1;
        widths = widths.map((w) => (w / sum) * 100);
      }
    }

    const next = segsRef.current.slice();
    next[idx] = { type: 'table', rows: newRows, ...(widths ? { widths } : {}) };
    push(next);
  };

  const startResize = (segIdx: number, colIdx: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    const seg = segsRef.current[segIdx];
    if (seg.type !== 'table') return;
    const tableEl = (e.currentTarget as HTMLElement).closest('table');
    if (!tableEl) return;

    const totalW = tableEl.getBoundingClientRect().width || 1;
    const cols = seg.rows[0].length;
    if (colIdx + 1 >= cols) return;

    const base = seg.widths && seg.widths.length === cols ? seg.widths.slice() : equalWidths(cols);
    const startX = e.clientX;
    let current = base.slice();

    const onMove = (ev: MouseEvent) => {
      const dx = ((ev.clientX - startX) / totalW) * 100;
      const pair = base[colIdx] + base[colIdx + 1];
      const a = Math.min(pair - 4, Math.max(4, base[colIdx] + dx));
      current = base.slice();
      current[colIdx] = Math.round(a * 10) / 10;
      current[colIdx + 1] = Math.round((pair - a) * 10) / 10;
      const mapped = segsRef.current.map((s, i) => (i === segIdx && s.type === 'table' ? { ...s, widths: current } : s));
      segsRef.current = mapped;
      setSegs(mapped);
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      const next = segsRef.current.map((s, i) => (i === segIdx && s.type === 'table' ? { ...s, widths: current } : s));
      push(next);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const removeSegment = (idx: number) => {
    const next = segsRef.current.filter((_, i) => i !== idx);
    resyncDisplays(next);
    push(next);
  };

  const insertSegment = (seg: ContentSegment) => {
    let at: number;
    if (segsRef.current.length === 1 && segsRef.current[0].type === 'paragraph' && !segsRef.current[0].text.trim()) {
      at = 0;
    } else if (focusIdxRef.current === null) {
      at = segsRef.current.length;
    } else {
      at = Math.min(focusIdxRef.current + 1, segsRef.current.length);
    }

    const next = segsRef.current.slice();
    next.splice(at, 0, seg, { type: 'paragraph', text: '' });
    resyncDisplays(next);
    pendingFocusRef.current = at + 1;
    push(next);
  };

  const insertParagraph = () => {
    const at =
      focusIdxRef.current === null
        ? segsRef.current.length
        : Math.min(focusIdxRef.current + 1, segsRef.current.length);
    const next = segsRef.current.slice();
    next.splice(at, 0, { type: 'paragraph', text: '' });
    resyncDisplays(next);
    pendingFocusRef.current = at;
    push(next);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => insertSegment({ type: 'image', alt: file.name, src: String(reader.result) });
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleInsertTable = () => {
    const colsInput = window.prompt('Jumlah kolom tabel:', '3');
    if (colsInput === null) return;
    const rowsInput = window.prompt('Jumlah baris (termasuk baris judul):', '4');
    if (rowsInput === null) return;
    const cols = parseInt(colsInput, 10);
    const rowCount = parseInt(rowsInput, 10);
    if (!Number.isFinite(cols) || !Number.isFinite(rowCount)) return;
    insertSegment(buildTableSegment(cols, rowCount));
  };

  const trackFocus = (idx: number) => {
    focusIdxRef.current = idx;
  };

  const registerBlock = (idx: number) => (el: HTMLElement | null) => {
    blockRefs.current[idx] = el;
  };

  // Cegah blur saat klik tombol toolbar agar seleksi tetap di editor
  const keepSelection = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div className="space-y-2.5 relative">
      {/* Validasi required untuk form (contentEditable tidak bisa memakai required) */}
      {required && (
        <input
          type="text"
          required
          value={serializeContent(segs)}
          onChange={() => undefined}
          tabIndex={-1}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 w-full h-full opacity-0"
        />
      )}

      {/* Toolbar format & penyisipan */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onMouseDown={keepSelection}
          onClick={() => execFmt('bold')}
          className={fmtBtnCls(fmt.bold)}
          title="Tebal (Bold)"
          aria-pressed={fmt.bold}
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onMouseDown={keepSelection}
          onClick={() => execFmt('italic')}
          className={fmtBtnCls(fmt.italic)}
          title="Miring (Italic)"
          aria-pressed={fmt.italic}
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onMouseDown={keepSelection}
          onClick={() => execFmt('underline')}
          className={fmtBtnCls(fmt.underline)}
          title="Garis bawah (Underline)"
          aria-pressed={fmt.underline}
        >
          <Underline className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onMouseDown={keepSelection}
          onClick={() => execFmt('insertUnorderedList')}
          className={fmtBtnCls(fmt.bullet)}
          title="Daftar butir (List Bullet)"
          aria-pressed={fmt.bullet}
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onMouseDown={keepSelection}
          onClick={() => execFmt('insertOrderedList')}
          className={fmtBtnCls(fmt.number)}
          title="Daftar bernomor (List Number)"
          aria-pressed={fmt.number}
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>
        <span className="w-px h-5 bg-slate-300" aria-hidden="true" />
        <button
          type="button"
          onMouseDown={keepSelection}
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
          title="Sisipkan gambar"
        >
          <ImagePlus className="w-3.5 h-3.5" /> Gambar
        </button>
        <button
          type="button"
          onMouseDown={keepSelection}
          onClick={handleInsertTable}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
          title="Sisipkan tabel"
        >
          <Table2 className="w-3.5 h-3.5" /> Tabel
        </button>
        <button
          type="button"
          onMouseDown={keepSelection}
          onClick={insertParagraph}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
          title="Tambah paragraf baru"
        >
          <Pilcrow className="w-3.5 h-3.5" /> Paragraf
        </button>
        <span className="text-[10px] text-slate-400">Tersisip setelah blok yang sedang diedit</span>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      {/* Blok-blok konten */}
      {segs.map((seg, idx) => {
        if (seg.type === 'paragraph') {
          return (
            <div
              key={`seg-${idx}-${renderEpoch}`}
              className="group/para relative"
              onFocus={() => trackFocus(idx)}
              ref={registerBlock(idx)}
            >
              <div
                contentEditable
                suppressContentEditableWarning
                data-ph={idx === 0 ? placeholder || '' : 'Lanjutkan paragraf...'}
                onInput={(e) => handleCEInput(idx, e.currentTarget)}
                onKeyDown={(e) => handleKeyDown(idx, e.currentTarget, e)}
                onFocus={(e) => {
                  activeEdRef.current = e.currentTarget;
                  trackFocus(idx);
                  syncFmt();
                }}
                onKeyUp={syncFmt}
                onClick={syncFmt}
                onPaste={(e) => {
                  e.preventDefault();
                  document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
                }}
                className={`ce-editor ${textareaClassName} whitespace-pre-wrap break-words outline-none`}
                style={{ minHeight: `${Math.max(rows, 3) * 1.6}em` }}
              >
                {renderRich(displayTextsRef.current?.[idx] ?? '')}
              </div>
              {segs.length > 1 && (
                <button
                  type="button"
                  onMouseDown={keepSelection}
                  onClick={() => removeSegment(idx)}
                  className="absolute top-1.5 right-1.5 p-1 text-slate-400 hover:text-rose-600 rounded opacity-0 group-hover/para:opacity-100 transition-opacity"
                  title="Hapus paragraf"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        }

        if (seg.type === 'image') {
          return (
            <div
              key={`seg-${idx}-${renderEpoch}`}
              className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-2"
              onFocus={() => trackFocus(idx)}
              ref={registerBlock(idx)}
            >
              <img src={seg.src} alt={seg.alt} className="max-h-48 border border-slate-200 bg-white rounded" />
              <div className="flex items-center gap-2">
                <input
                  value={seg.alt}
                  onChange={(e) => {
                    const next = segs.slice();
                    next[idx] = { type: 'image', src: seg.src, alt: e.target.value };
                    push(next);
                  }}
                  placeholder="Keterangan gambar"
                  className="flex-1 px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-900 bg-white"
                />
                <button
                  type="button"
                  onClick={() => removeSegment(idx)}
                  className="inline-flex items-center gap-1 px-2 py-1.5 text-[11px] font-semibold text-rose-600 bg-white border border-rose-200 rounded hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus
                </button>
              </div>
            </div>
          );
        }

        const colCount = seg.rows[0].length;
        const displayWidths = seg.widths && seg.widths.length === colCount ? seg.widths : equalWidths(colCount);

        return (
          <div
            key={`seg-${idx}-${renderEpoch}`}
            className="border border-slate-300 rounded-lg overflow-hidden bg-white"
            onFocus={() => trackFocus(idx)}
            ref={registerBlock(idx)}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse table-fixed text-xs">
                <colgroup>
                  {displayWidths.map((w, ci) => (
                    <col key={ci} style={{ width: `${w}%` }} />
                  ))}
                </colgroup>
                <thead>
                  <tr>
                    {seg.rows[0].map((cell, ci) => (
                      <th key={ci} className="relative border border-slate-300 bg-slate-50 p-0">
                        <input
                          value={cell}
                          onChange={(e) => setTableCell(idx, 0, ci, e.target.value)}
                          className="w-full px-2 py-1.5 text-left font-semibold text-slate-800 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-900"
                        />
                        {ci < colCount - 1 && (
                          <span
                            onMouseDown={startResize(idx, ci)}
                            className="absolute -right-[3px] top-0 bottom-0 w-1.5 cursor-col-resize z-10 hover:bg-blue-500/70 active:bg-blue-600 rounded"
                            title="Geser untuk mengubah lebar kolom"
                          />
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {seg.rows.slice(1).map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td key={ci} className="border border-slate-300 p-0">
                          <input
                            value={cell}
                            onChange={(e) => setTableCell(idx, ri + 1, ci, e.target.value)}
                            className="w-full px-2 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-900"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 px-2 py-1.5 bg-slate-50 border-t border-slate-200">
              <button
                type="button"
                onClick={() =>
                  mutateTable(idx, (r) => [...r, Array.from({ length: r[0].length }, () => '')])
                }
                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-100"
              >
                <Plus className="w-3 h-3" /> Baris
              </button>
              <button
                type="button"
                disabled={seg.rows.length <= 2}
                onClick={() => mutateTable(idx, (r) => r.slice(0, -1))}
                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Minus className="w-3 h-3" /> Baris
              </button>
              <button
                type="button"
                onClick={() =>
                  mutateTable(idx, (r) =>
                    r.map((row, i) => [...row, i === 0 ? `Kolom ${row.length + 1}` : ''])
                  )
                }
                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-100"
              >
                <Plus className="w-3 h-3" /> Kolom
              </button>
              <button
                type="button"
                disabled={seg.rows[0].length <= 1}
                onClick={() => mutateTable(idx, (r) => r.map((row) => row.slice(0, -1)))}
                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Minus className="w-3 h-3" /> Kolom
              </button>
              <button
                type="button"
                onClick={() => removeSegment(idx)}
                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-rose-600 bg-white border border-rose-200 rounded hover:bg-rose-50 ml-auto"
              >
                <Trash2 className="w-3 h-3" /> Hapus Tabel
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
