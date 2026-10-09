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
import { Meeting, User } from '../../types';
import { ContentEditor } from '../common/ContentEditor';

export const AgendaRapatView: React.FC = () => {
  const { meetings, currentUser, users, createMeeting, updateMeetingMinutes, setActiveModule } = useOffice();

  const [search, setSearch] = useState('');
  const [isNewMeetingModalOpen, setIsNewMeetingModalOpen] = useState(false);
  const [selectedMeetingForMinutes, setSelectedMeetingForMinutes] = useState<Meeting | null>(null);
  const [selectedMeetingForAttendees, setSelectedMeetingForAttendees] = useState<Meeting | null>(null);

  // New Meeting Form State
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeStart, setTimeStart] = useState('09:00');
  const [timeEnd, setTimeEnd] = useState('11:00');
  const [roomOrLink, setRoomOrLink] = useState('Ruang Rapat Garuda Lt. 5');
  const [isOnline, setIsOnline] = useState(false);
  const [agendaText, setAgendaText] = useState('1. Pembahasan Roadmap\n2. Alokasi Anggaran');
  const [invitedIds, setInvitedIds] = useState<string[]>([]);
  const [inviteSearch, setInviteSearch] = useState('');

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

  const toggleInvite = (id: string) => {
    setInvitedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const inviteCandidates = users.filter((u) => {
    const q = inviteSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.title.toLowerCase().includes(q) ||
      u.unit.toLowerCase().includes(q)
    );
  });

  // ---- Detail peserta rapat ----
  const normName = (s: string) => s.split(',')[0].trim().toLowerCase();

  const findUserByName = (name: string) =>
    users.find((u) => u.name === name) || users.find((u) => normName(u.name) === normName(name));

  interface MeetingAttendeeDetail {
    key: string;
    id?: string;
    name: string;
    title: string;
    unit: string;
    email: string;
    role: 'Pimpinan Rapat' | 'Notulis' | 'Peserta';
  }

  const buildAttendeeDetails = (mtg: Meeting): MeetingAttendeeDetail[] => {
    const list: MeetingAttendeeDetail[] = [];
    const seen = new Set<string>();

    const add = (user: User | undefined, fallbackName: string) => {
      const name = user?.name || fallbackName;
      const key = user?.id || `n:${normName(name)}`;
      if (seen.has(key) || !normName(name)) return;
      seen.add(key);

      const role: MeetingAttendeeDetail['role'] =
        normName(name) === normName(mtg.chairPerson)
          ? 'Pimpinan Rapat'
          : normName(name) === normName(mtg.notary)
          ? 'Notulis'
          : 'Peserta';

      list.push({
        key,
        ...(user ? { id: user.id } : {}),
        name,
        title: user?.title || '—',
        unit: user?.unit || '—',
        email: user?.email || '—',
        role,
      });
    };

    add(findUserByName(mtg.chairPerson), mtg.chairPerson);
    add(findUserByName(mtg.notary), mtg.notary);

    mtg.attendeeIds?.forEach((id) => add(users.find((u) => u.id === id), ''));
    mtg.attendees.forEach((name) => add(findUserByName(name), name));

    return list;
  };

  const handleCreateMeetingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const invitedUsers = users.filter((u) => invitedIds.includes(u.id));

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
      attendees: invitedUsers.length > 0 ? invitedUsers.map((u) => u.name) : [currentUser.name],
      attendeeIds: invitedUsers.map((u) => u.id),
    });

    setIsNewMeetingModalOpen(false);
    setTitle('');
    setInvitedIds([]);
    setInviteSearch('');
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
              <button
                type="button"
                onClick={() => setSelectedMeetingForAttendees(mtg)}
                className="group inline-flex items-center gap-1.5 px-2 -ml-2 py-1 rounded-lg text-slate-600 hover:text-blue-900 hover:bg-blue-50 transition-colors"
                title="Lihat detail peserta rapat"
              >
                <Users className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-700" />
                <span>{mtg.attendees.length} Peserta Terdaftar</span>
                <span className="text-[10px] font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  Lihat Detail
                </span>
              </button>

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

              {/* Peserta yang diundang */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Peserta yang Diundang</label>
                  <span className="text-[10px] font-semibold text-blue-900 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                    {invitedIds.length} dipilih
                  </span>
                </div>

                <div className="relative mb-1.5">
                  <input
                    type="text"
                    value={inviteSearch}
                    onChange={(e) => setInviteSearch(e.target.value)}
                    placeholder="Cari nama, jabatan, atau unit pegawai..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                </div>

                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
                  {inviteCandidates.map((u) => (
                    <label
                      key={u.id}
                      className="flex items-center gap-2.5 px-3 py-1.5 text-xs cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={invitedIds.includes(u.id)}
                        onChange={() => toggleInvite(u.id)}
                        className="rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="font-semibold text-slate-800 block truncate">{u.name}</span>
                        <span className="text-[10px] text-slate-500 block truncate">
                          {u.title} · {u.unit}
                        </span>
                      </span>
                      {invitedIds.includes(u.id) && (
                        <span className="shrink-0 text-[9px] font-bold text-blue-900 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                          Diundang
                        </span>
                      )}
                    </label>
                  ))}
                  {inviteCandidates.length === 0 && (
                    <p className="p-3 text-[11px] text-center text-slate-400">
                      Tidak ada pegawai yang cocok.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between mt-1">
                  <p className="text-[10px] text-slate-500">
                    Peserta terpilih akan menerima notifikasi undangan rapat.
                  </p>
                  <div className="flex items-center gap-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setInvitedIds(inviteCandidates.map((u) => u.id))}
                      className="text-blue-700 hover:text-blue-900 font-semibold"
                    >
                      Pilih semua
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvitedIds([])}
                      className="text-slate-500 hover:text-slate-700 font-semibold"
                    >
                      Kosongkan
                    </button>
                  </div>
                </div>
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
                <button
                  type="button"
                  onClick={() => setSelectedMeetingForAttendees(selectedMeetingForMinutes)}
                  className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-800 hover:text-blue-950 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded transition-colors"
                >
                  <Users className="w-3.5 h-3.5" />
                  Lihat Detail Peserta ({buildAttendeeDetails(selectedMeetingForMinutes).length})
                </button>
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
                <ContentEditor
                  rows={4}
                  required
                  value={minutesNotes}
                  onChange={setMinutesNotes}
                  placeholder="Uraian jalannya pembahasan rapat..."
                />
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

      {/* MODAL 3: Detail Peserta Rapat */}
      {selectedMeetingForAttendees &&
        (() => {
          const mtg = selectedMeetingForAttendees;
          const participants = buildAttendeeDetails(mtg);
          const roleBadge = (role: MeetingAttendeeDetail['role']) =>
            role === 'Pimpinan Rapat'
              ? 'bg-blue-50 text-blue-800 border-blue-200'
              : role === 'Notulis'
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-slate-100 text-slate-600 border-slate-200';

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8">
                <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Detail Peserta Rapat</h3>
                    <p className="text-xs text-slate-500">{mtg.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {mtg.date} · {mtg.timeStart} - {mtg.timeEnd} WIB
                      <span className="mx-0.5">·</span>
                      {mtg.isOnline ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                      {mtg.roomOrLink}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedMeetingForAttendees(null)}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    <span className="font-bold text-slate-900">{participants.length}</span> hadir/terdaftar
                  </span>
                  <span className="text-[11px] text-slate-400">Pimpinan: {mtg.chairPerson}</span>
                </div>

                <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
                  {participants.length === 0 && (
                    <p className="py-6 text-center text-xs text-slate-400">
                      Belum ada data peserta untuk rapat ini.
                    </p>
                  )}

                  {participants.map((p) => (
                    <div
                      key={p.key}
                      className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/40 transition-colors"
                    >
                      <span className="shrink-0 w-9 h-9 rounded-full bg-blue-900 text-white flex items-center justify-center text-xs font-bold">
                        {p.name
                          .split(' ')
                          .filter((w) => w.length > 2)
                          .slice(0, 2)
                          .map((w) => w[0])
                          .join('')
                          .toUpperCase() || '?'}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 truncate">{p.name}</span>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${roleBadge(p.role)}`}
                          >
                            {p.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 truncate">{p.title}</p>
                        <p className="text-[10px] text-slate-400 truncate">{p.unit}</p>
                        {p.email !== '—' && (
                          <p className="text-[10px] text-slate-400 truncate">{p.email}</p>
                        )}
                      </div>

                      {p.id ? (
                        <span className="shrink-0 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                          Terdaftar
                        </span>
                      ) : (
                        <span className="shrink-0 text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                          Tanpa Akun
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setSelectedMeetingForAttendees(null)}
                    className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
};
