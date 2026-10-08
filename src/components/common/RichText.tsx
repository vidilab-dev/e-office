import React from 'react';
import { parseInline, classifyLine, InlineRun } from '../../utils/contentBlocks';

const runStyle = (r: InlineRun): React.CSSProperties | undefined => {
  if (!r.bold && !r.italic && !r.underline) return undefined;
  return {
    fontWeight: r.bold ? 700 : undefined,
    fontStyle: r.italic ? 'italic' : undefined,
    textDecoration: r.underline ? 'underline' : undefined,
  };
};

const renderRuns = (runs: InlineRun[], keyBase: string): React.ReactNode =>
  runs.map((r, i) => {
    const style = runStyle(r);
    return style ? (
      <span key={`${keyBase}-${i}`} style={style}>
        {r.text}
      </span>
    ) : (
      <React.Fragment key={`${keyBase}-${i}`}>{r.text}</React.Fragment>
    );
  });

/** Render isi paragraf: baris daftar menjadi <ul>/<ol> native, sisanya teks biasa + format inline. */
export const renderRich = (text: string): React.ReactNode => {
  const lines = text.split('\n');
  const out: React.ReactNode[] = [];
  let i = 0;
  let g = 0;
  while (i < lines.length) {
    const kind = classifyLine(lines[i]);
    if (kind.type === 'bullet' || kind.type === 'number') {
      const isBullet = kind.type === 'bullet';
      const key = `list-${g++}`;
      const items: React.ReactNode[] = [];
      while (i < lines.length) {
        const c = classifyLine(lines[i]);
        if (isBullet) {
          if (c.type !== 'bullet') break;
        } else {
          if (c.type !== 'number') break;
        }
        items.push(
          <li key={items.length}>{renderRuns(parseInline(c.rest), `${key}-${items.length}`)}</li>
        );
        i++;
      }
      const ListTag = isBullet ? 'ul' : 'ol';
      out.push(
        <ListTag
          key={key}
          className={`my-1.5 space-y-0.5 ${isBullet ? 'list-disc' : 'list-decimal'} pl-5`}
        >
          {items}
        </ListTag>
      );
      continue;
    }
    const buf: string[] = [];
    const key = `text-${g++}`;
    while (i < lines.length && classifyLine(lines[i]).type === 'text') {
      buf.push(lines[i]);
      i++;
    }
    out.push(
      <React.Fragment key={key}>{renderRuns(parseInline(buf.join('\n')), key)}</React.Fragment>
    );
  }
  return out;
};
