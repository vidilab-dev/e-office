import React, { useEffect, useRef, useState } from 'react';
import { ImagePlus, Table2, Plus, Minus, Trash2, Pilcrow } from 'lucide-react';
import { buildTableSegment, equalWidths, parseContent, serializeContent, ContentSegment } from '../../utils/contentBlocks';

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

const paragraphRows = (text: string, minRows: number) =>
  Math.max(minRows, Math.min(15, text.split('\n').length + Math.ceil(text.length / 110)));

export const ContentEditor: React.FC<ContentEditorProps> = ({
  value,
  onChange,
  rows = 6,
  required,
  placeholder,
  textareaClassName = 'w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 font-sans leading-relaxed',
}) => {
  const [segs, setSegs] = useState<ContentSegment[]>(() => initialSegs(value));
  const lastSentRef = useRef(value);
  const focusIdxRef = useRef<number | null>(null);
  const blockRefs = useRef<Array<HTMLElement | null>>([]);
  const pendingFocusRef = useRef<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Re-init hanya saat value berubah dari luar (mis. memilih template)
  useEffect(() => {
    if (value !== lastSentRef.current) {
      setSegs(initialSegs(value));
      lastSentRef.current = value;
    }
  }, [value]);

  useEffect(() => {
    const idx = pendingFocusRef.current;
    if (idx === null) return;
    pendingFocusRef.current = null;
    window.requestAnimationFrame(() => {
      const el = blockRefs.current[idx]?.querySelector('textarea, input') as HTMLElement | null;
      el?.focus();
    });
  }, [segs]);

  const push = (next: ContentSegment[]) => {
    const safe = next.length > 0 ? next : [{ type: 'paragraph' as const, text: '' }];
    setSegs(safe);
    const serialized = serializeContent(safe);
    lastSentRef.current = serialized;
    onChange(serialized);
  };

  const setParagraph = (idx: number, text: string) => {
    const next = segs.slice();
    next[idx] = { type: 'paragraph', text };
    push(next);
  };

  const setTableCell = (idx: number, r: number, c: number, val: string) => {
    const seg = segs[idx];
    if (seg.type !== 'table') return;
    const next = segs.slice();
    next[idx] = {
      type: 'table',
      rows: seg.rows.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? val : cell)) : row)),
      ...(seg.widths ? { widths: seg.widths } : {}),
    };
    push(next);
  };

  const mutateTable = (idx: number, mutate: (rows: string[][]) => string[][]) => {
    const seg = segs[idx];
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

    const next = segs.slice();
    next[idx] = { type: 'table', rows: newRows, ...(widths ? { widths } : {}) };
    push(next);
  };

  const startResize = (segIdx: number, colIdx: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    const seg = segs[segIdx];
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
      setSegs((prev) => prev.map((s, i) => (i === segIdx && s.type === 'table' ? { ...s, widths: current } : s)));
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      const next = segs.map((s, i) => (i === segIdx && s.type === 'table' ? { ...s, widths: current } : s));
      push(next);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const removeSegment = (idx: number) => {
    const next = segs.filter((_, i) => i !== idx);
    push(next);
  };

  const insertSegment = (seg: ContentSegment) => {
    let at: number;
    if (segs.length === 1 && segs[0].type === 'paragraph' && !segs[0].text.trim()) {
      at = 0;
    } else if (focusIdxRef.current === null) {
      at = segs.length;
    } else {
      at = Math.min(focusIdxRef.current + 1, segs.length);
    }

    const next = segs.slice();
    next.splice(at, 0, seg, { type: 'paragraph', text: '' });
    pendingFocusRef.current = at + 1;
    push(next);
  };

  const insertParagraph = () => {
    const at = focusIdxRef.current === null ? segs.length : Math.min(focusIdxRef.current + 1, segs.length);
    const next = segs.slice();
    next.splice(at, 0, { type: 'paragraph', text: '' });
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

  return (
    <div className="space-y-2.5">
      {/* Toolbar penyisipan */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
          title="Sisipkan gambar"
        >
          <ImagePlus className="w-3.5 h-3.5" /> Gambar
        </button>
        <button
          type="button"
          onClick={handleInsertTable}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
          title="Sisipkan tabel"
        >
          <Table2 className="w-3.5 h-3.5" /> Tabel
        </button>
        <button
          type="button"
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
              key={`seg-${idx}`}
              className="group/para relative"
              onFocus={() => trackFocus(idx)}
              ref={registerBlock(idx)}
            >
              <textarea
                rows={paragraphRows(seg.text, Math.min(rows, 6))}
                required={required && idx === 0}
                value={seg.text}
                onChange={(e) => setParagraph(idx, e.target.value)}
                placeholder={idx === 0 ? placeholder : 'Lanjutkan paragraf...'}
                className={textareaClassName}
              ></textarea>
              {segs.length > 1 && (
                <button
                  type="button"
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
              key={`seg-${idx}`}
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
            key={`seg-${idx}`}
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
