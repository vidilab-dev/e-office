import React, { useState } from 'react';
import {
  FileCode,
  Search,
  CheckCircle2,
  Copy,
  ArrowRight,
  Plus,
  FileText,
} from 'lucide-react';
import { useOffice } from '../../context/OfficeContext';
import { toPlainText } from '../../utils/contentBlocks';

export const TemplateDokumenView: React.FC = () => {
  const { templates, setActiveModule } = useOffice();
  const [search, setSearch] = useState('');

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Katalog Template Dokumen Resmi PT BIN
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Format baku surat keluar, nota dinas, surat tugas, dan keputusan direksi berpedoman tata naskah dinas.
          </p>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTemplates.map((tpl) => (
          <div key={tpl.id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {tpl.code}
                </span>
                <span className="text-[10px] font-mono text-slate-400">Versi {tpl.version}</span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900">{tpl.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{tpl.description}</p>
              </div>

              {/* Template Preview Snippet */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1 font-mono text-[11px] text-slate-700">
                <p className="font-semibold text-slate-900">Perihal: {tpl.defaultSubject}</p>
                <p className="text-slate-500 line-clamp-3 whitespace-pre-line">{toPlainText(tpl.defaultContent)}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Standar Korporat Aktif
              </span>

              <button
                onClick={() => setActiveModule('surat-keluar')}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-900 hover:bg-blue-950 text-white rounded-lg font-semibold text-xs transition-colors shadow-xs"
              >
                Gunakan Template <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
