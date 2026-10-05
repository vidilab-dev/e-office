import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  Video,
  Users,
  FileText,
  ListPlus,
  X,
  ArrowRight,
} from 'lucide-react';
import { useOffice } from '../../context/OfficeContext';
import { Meeting } from '../../types';

export const AgendaRapatView: React.FC = () => {
  const { meetings, currentUser, users, createMeeting, updateMeetingMinutes, setActiveModule } = useOffice();

  const [search, setSearch] = useState('');
  const [isNewMeetingModalOpen, setIsNewMeetingModalOpen] = useState(false);
  const [selectedMeetingForMinutes, setSelectedMeetingForMinutes] = useState<Meeting | null>(null);

  // New Meeting Form State
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeStart, setTimeStart] = useState('09:00');
  const [timeEnd, setTimeEnd] = useState('11:00');
  const [roomOrLink, setRoomOrLink] = useState('Ruang Rapat Garuda Lt. 5');
  const [isOnline, setIsOnline] = useState(false);
  const [agendaText, setAgendaText] = useState('1. Pembahasan Roadmap\n2. Alokasi Anggaran');

  // Minutes Form State
  const [minutesNotes, setMinutesNotes] = useState('');
  const [decisionsText, setDecisionsText] = useState('1. Format laporan disetujui bersama\n2. Target go-live Oktober 2026');
  const [actionItemDesc, setActionItemDesc] = useState('');
  const [actionItemPicId, setActionItemPicId] = useState('usr-4');
  const [actionItemDeadline, setActionItemDeadline] = useState(
    new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]
  );
  const [actionItemsList, setActionItemsList] = useState<
    { description: string; picId: string; picName: string; deadline: string }[]
  >([]);

  const handleCreateMeetingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    createMeeting({
      title,
      date,
      timeStart,
      timeEnd,
      roomOrLink,
      isOnline,
      chairPerson: currentUser.name,
      notary: currentUser.name,
      agendaItems: agendaText.split('\n').filter((x) => x.trim()),
      attendees: users.slice(0, 5).map((u) => u.name),
    });

    setIsNewMeetingModalOpen(false);
    setTitle('');
  };

  const handleAddActionItem = () => {
    if (!actionItemDesc.trim()) return;
    const picUser = users.find((u) => u.id === actionItemPicId) || users[3];
    setActionItemsList([
      ...actionItemsList,
      {
        description: actionItemDesc.trim(),
        picId: picUser.id,
        picName: picUser.name,
        deadline: actionItemDeadline,
      },
    ]);
    setActionItemDesc('');
  };

  const handleSaveMinutesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeetingForMinutes) return;

    const decisions = decisionsText.split('\n').filter((x) => x.trim());

    updateMeetingMinutes(
      selectedMeetingForMinutes.id,
      minutesNotes || 'Notulen rapat telah dicatat dan disepakati.',
      decisions,
      actionItemsList
    );

    setSelectedMeetingForMinutes(null);
    setMinutesNotes('');
    setActionItemsList([]);
  };

  const filteredMeetings = meetings.filter(
    (m) =>
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.chairPerson.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Title & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Agenda Rapat & Notulen Korporat PT BIN
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan agenda direksi, notulen resmi, dan konversi otomatis action item menjadi Task.
          </p>
        </div>

        <button
          onClick={() => setIsNewMeetingModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" /> Jadwalkan Rapat Baru
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul rapat, pimpinan, atau agenda pembahasan..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
        </div>
      </div>

      {/* Meetings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMeetings.map((mtg) => (
          <div key={mtg.id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <span
                className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded ${
                  mtg.status === 'Selesai'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                }`}
              >
                {mtg.status}
              </span>

              <div className="text-xs font-mono text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{mtg.date}</span>
                <span>({mtg.timeStart} - {mtg.timeEnd} WIB)</span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">{mtg.title}</h3>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                {mtg.isOnline ? <Video className="w-3.5 h-3.5 text-blue-600" /> : <MapPin className="w-3.5 h-3.5 text-slate-400" />}
                <span>{mtg.roomOrLink}</span>
              </p>
            </div>

            {/* Agenda points */}
            <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
              <span className="font-semibold text-slate-700 block text-[11px]">Agenda Rapat:</span>
              <ul className="list-disc list-inside text-slate-600 space-y-0.5 text-[11px]">
                {mtg.agendaItems.map((item, idx) => (
                  <li key={idx} className="truncate">{item}</li>
                ))}
              </ul>
            </div>

            {/* Decisions and Action Items if completed */}
            {mtg.decisions && mtg.decisions.length > 0 && (
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs space-y-1">
                <span className="font-bold text-emerald-950 block text-[11px]">Keputusan Rapat:</span>
                <ul className="list-disc list-inside text-emerald-900 space-y-0.5 text-[11px]">
                  {mtg.decisions.map((dec, idx) => (
                    <li key={idx}>{dec}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Attendees Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>{mtg.attendees.length} Peserta Terdaftar</span>
              </span>

              {mtg.status !== 'Selesai' ? (
                <button
                  onClick={() => {
                    setSelectedMeetingForMinutes(mtg);
                    setMinutesNotes(mtg.minutesNotes || '');
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded-lg shadow-xs transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" /> Catat Notulen & Action Item
                </button>
              ) : (
                <button
                  onClick={() => setActiveModule('tasks')}
                  className="text-xs text-blue-700 hover:text-blue-900 font-medium inline-flex items-center gap-1"
                >
                  Lihat Task Terkait <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL 1: Buat Rapat Baru */}
      {isNewMeetingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Jadwalkan Rapat Korporat Baru</h3>
              <button onClick={() => setIsNewMeetingModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMeetingSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Judul / Topik Rapat</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Rapat Koordinasi Evaluasi RKAP Q3"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Waktu Mulai</label>
                  <input
                    type="time"
                    required
                    value={timeStart}
                    onChange={(e) => setTimeStart(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Waktu Selesai</label>
                  <input
                    type="time"
                    required
                    value={timeEnd}
                    onChange={(e) => setTimeEnd(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ruangan / Link Pertemuan Online</label>
                <input
                  type="text"
                  required
                  value={roomOrLink}
                  onChange={(e) => setRoomOrLink(e.target.value)}
                  placeholder="Contoh: Ruang Rapat Garuda Lt. 5 atau Google Meet Link"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Agenda Pembahasan (1 per baris)</label>
                <textarea
                  rows={3}
                  required
                  value={agendaText}
                  onChange={(e) => setAgendaText(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewMeetingModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Simpan Agenda Rapat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Form Notulen & Action Item to Task */}
      {selectedMeetingForMinutes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Catat Notulen & Action Items Rapat</h3>
                <p className="text-xs text-slate-500">{selectedMeetingForMinutes.title}</p>
              </div>
              <button
                onClick={() => setSelectedMeetingForMinutes(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMinutesSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ringkasan Notulen / Risalah Rapat</label>
                <textarea
                  rows={3}
                  required
                  value={minutesNotes}
                  onChange={(e) => setMinutesNotes(e.target.value)}
                  placeholder="Uraian jalannya pembahasan rapat..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Keputusan Rapat (1 per baris)</label>
                <textarea
                  rows={3}
                  required
                  value={decisionsText}
                  onChange={(e) => setDecisionsText(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                ></textarea>
              </div>

              {/* Action items generator */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <span className="font-bold text-slate-900 block">
                  Tambah Action Item (Otomatis Menjadi Task PIC):
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <input
                    type="text"
                    value={actionItemDesc}
                    onChange={(e) => setActionItemDesc(e.target.value)}
                    placeholder="Deskripsi tugas hasil rapat..."
                    className="sm:col-span-6 px-3 py-1.5 text-xs border border-slate-300 rounded bg-white"
                  />
                  <select
                    value={actionItemPicId}
                    onChange={(e) => setActionItemPicId(e.target.value)}
                    className="sm:col-span-3 px-2 py-1.5 text-xs border border-slate-300 rounded bg-white"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddActionItem}
                    className="sm:col-span-3 px-3 py-1.5 bg-blue-900 hover:bg-blue-950 text-white rounded font-semibold text-xs"
                  >
                    + Tambah Task
                  </button>
                </div>

                {/* Action Items List */}
                {actionItemsList.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    {actionItemsList.map((act, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-white border border-slate-200 rounded text-xs">
                        <div>
                          <p className="font-semibold text-slate-900">{act.description}</p>
                          <span className="text-[10px] text-slate-500">
                            PIC: {act.picName} · Deadline: {act.deadline}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                          Auto-Task
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedMeetingForMinutes(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Simpan Notulen & Terbitkan Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
