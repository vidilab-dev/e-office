import React, { useState, useEffect } from 'react';
import { Search, X, FileText, Send, User, Plane, Calendar, CheckSquare, Archive, ArrowRight } from 'lucide-react';
import { useOffice } from '../../context/OfficeContext';
import { renderRich } from './RichText';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const {
    inboundLetters,
    outgoingLetters,
    dispositions,
    tasks,
    travelRequests,
    meetings,
    archives,
    setActiveModule,
    setSelectedDocumentForPreview,
  } = useOffice();

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = searchTerm.toLowerCase().trim();

  const matchingInbound = q
    ? inboundLetters.filter(
        (l) =>
          l.agendaNumber.toLowerCase().includes(q) ||
          l.referenceNumber.toLowerCase().includes(q) ||
          l.subject.toLowerCase().includes(q) ||
          l.sender.toLowerCase().includes(q)
      )
    : [];

  const matchingOutgoing = q
    ? outgoingLetters.filter(
        (l) =>
          (l.letterNumber && l.letterNumber.toLowerCase().includes(q)) ||
          l.draftNumber.toLowerCase().includes(q) ||
          l.subject.toLowerCase().includes(q) ||
          l.recipient.toLowerCase().includes(q)
      )
    : [];

  const matchingTravel = q
    ? travelRequests.filter(
        (t) =>
          t.requestNumber.toLowerCase().includes(q) ||
          (t.spdNumber && t.spdNumber.toLowerCase().includes(q)) ||
          t.employeeName.toLowerCase().includes(q) ||
          t.destinationCity.toLowerCase().includes(q)
      )
    : [];

  const matchingTasks = q
    ? tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.sourceReference.toLowerCase().includes(q) ||
          t.assigneeName.toLowerCase().includes(q)
      )
    : [];

  const matchingArchives = q
    ? archives.filter(
        (a) =>
          a.documentNumber.toLowerCase().includes(q) ||
          a.title.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q)
      )
    : [];

  const totalResults =
    matchingInbound.length +
    matchingOutgoing.length +
    matchingTravel.length +
    matchingTasks.length +
    matchingArchives.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 bg-white gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nomor surat, agenda, perihal, SPD, tugas, pegawai, atau arsip... (Tekan ESC untuk keluar)"
            autoFocus
            className="w-full text-sm placeholder:text-slate-400 text-slate-900 focus:outline-none bg-transparent"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 border border-slate-200 rounded">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div className="p-4 overflow-y-auto space-y-4 divide-y divide-slate-100">
          {!q ? (
            <div className="py-8 text-center text-slate-400 space-y-2">
              <p className="text-xs">Ketik kata kunci untuk mencari di seluruh modul e-Office PT BIN.</p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {['BUMN', '048/BIN-SEK', 'Surabaya', 'Audit', 'e-Office'].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => setSearchTerm(chip)}
                    className="text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition-colors"
                  >
                    "{chip}"
                  </button>
                ))}
              </div>
            </div>
          ) : totalResults === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Tidak ditemukan dokumen atau data yang cocok dengan "{searchTerm}".
            </div>
          ) : (
            <>
              {/* Surat Masuk */}
              {matchingInbound.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">
                    Surat Masuk ({matchingInbound.length})
                  </h4>
                  <div className="space-y-1.5">
                    {matchingInbound.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedDocumentForPreview(item);
                          onClose();
                        }}
                        className="group flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 text-blue-700 rounded-md group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-semibold text-slate-900">
                                {item.agendaNumber}
                              </span>
                              <span className="text-[11px] text-slate-500">· {item.sender}</span>
                            </div>
                            <p className="text-xs text-slate-700 line-clamp-1">{item.subject}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Surat Keluar */}
              {matchingOutgoing.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">
                    Surat Keluar & Draft ({matchingOutgoing.length})
                  </h4>
                  <div className="space-y-1.5">
                    {matchingOutgoing.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedDocumentForPreview(item);
                          onClose();
                        }}
                        className="group flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-md group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <Send className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-semibold text-slate-900">
                                {item.letterNumber || item.draftNumber}
                              </span>
                              <span className="text-[11px] text-slate-500">· Kepada: {item.recipient}</span>
                            </div>
                            <p className="text-xs text-slate-700 line-clamp-1">{item.subject}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Perjalanan Dinas */}
              {matchingTravel.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">
                    Perjalanan Dinas & SPD ({matchingTravel.length})
                  </h4>
                  <div className="space-y-1.5">
                    {matchingTravel.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setActiveModule('perjalanan-dinas');
                          onClose();
                        }}
                        className="group flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-md group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <Plane className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-semibold text-slate-900">
                                {item.spdNumber || item.requestNumber}
                              </span>
                              <span className="text-[11px] text-slate-500">· {item.employeeName}</span>
                            </div>
                            <p className="text-xs text-slate-700">
                              Tujuan: {item.destinationCity} ({renderRich(item.purpose)})
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks */}
              {matchingTasks.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">
                    Tugas & Action Items ({matchingTasks.length})
                  </h4>
                  <div className="space-y-1.5">
                    {matchingTasks.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setActiveModule('tasks');
                          onClose();
                        }}
                        className="group flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-50 text-amber-700 rounded-md group-hover:bg-amber-600 group-hover:text-white transition-colors">
                            <CheckSquare className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-900">{item.title}</p>
                            <span className="text-[11px] text-slate-500">
                              PIC: {item.assigneeName} · Deadline: {item.dueDate}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Arsip Digital */}
              {matchingArchives.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">
                    Arsip Digital ({matchingArchives.length})
                  </h4>
                  <div className="space-y-1.5">
                    {matchingArchives.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedDocumentForPreview(item);
                          onClose();
                        }}
                        className="group flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-50 text-purple-700 rounded-md group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            <Archive className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-mono text-xs font-semibold text-slate-900">
                              {item.documentNumber}
                            </span>
                            <p className="text-xs text-slate-700">{item.title}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
