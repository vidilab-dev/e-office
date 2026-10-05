import React, { useState } from 'react';
import {
  CheckSquare,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  User,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { useOffice } from '../../context/OfficeContext';
import { OfficeTask } from '../../types';

export const TaskManagementView: React.FC = () => {
  const { tasks, currentUser, updateTaskStatus } = useOffice();

  const [tab, setTab] = useState<'my' | 'all'>('my');
  const [search, setSearch] = useState('');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (tab === 'my' && t.assigneeId !== currentUser.id) return false;

    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.sourceReference.toLowerCase().includes(search.toLowerCase()) ||
      t.assigneeName.toLowerCase().includes(search.toLowerCase());

    const matchSource = filterSource === 'all' || t.sourceType === filterSource;
    const matchPriority = filterPriority === 'all' || t.priority === filterPriority;

    return matchSearch && matchSource && matchPriority;
  });

  const handleProgressChange = (task: OfficeTask, newProgress: number) => {
    let newStatus: OfficeTask['status'] = task.status;
    if (newProgress === 100) {
      newStatus = 'Selesai';
    } else if (newProgress > 0) {
      newStatus = 'Sedang Dikerjakan';
    } else {
      newStatus = 'Belum Dimulai';
    }
    updateTaskStatus(task.id, newStatus, newProgress);
  };

  return (
    <div className="space-y-6">
      {/* Title & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Manajemen Tugas & Tindak Lanjut (Task Center)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Konsolidasi tugas otomatis yang bersumber dari Disposisi Surat, Action Item Rapat, dan LPJ Perjalanan Dinas.
          </p>
        </div>

        {/* Segmented Tab: Tugas Saya vs Monitoring Semua Tugas */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
          <button
            onClick={() => setTab('my')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              tab === 'my' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tugas Saya ({tasks.filter((t) => t.assigneeId === currentUser.id && t.status !== 'Selesai').length})
          </button>
          <button
            onClick={() => setTab('all')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              tab === 'all' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monitoring Semua Unit ({tasks.length})
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul task, nomor referensi surat, atau nama PIC..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
        </div>

        <select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none w-full md:w-auto"
        >
          <option value="all">Semua Sumber Tugas</option>
          <option value="Disposisi">Disposisi Surat</option>
          <option value="Action Item Rapat">Action Item Rapat</option>
          <option value="LPJ Perjalanan Dinas">LPJ Perjalanan Dinas</option>
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none w-full md:w-auto"
        >
          <option value="all">Semua Prioritas</option>
          <option value="Urgent">Urgent</option>
          <option value="Tinggi">Tinggi</option>
          <option value="Sedang">Sedang</option>
          <option value="Rendah">Rendah</option>
        </select>
      </div>

      {/* Task Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTasks.length === 0 ? (
          <div className="md:col-span-2 p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs">
            Tidak ada tugas yang sesuai dengan filter pencarian.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isCompleted = task.status === 'Selesai';

            return (
              <div
                key={task.id}
                className={`bg-white rounded-xl border transition-all p-5 space-y-4 shadow-xs ${
                  isCompleted ? 'border-slate-200 bg-slate-50/50 opacity-90' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {task.sourceType}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Ref: {task.sourceReference}
                      </span>
                    </div>
                    <h3 className={`text-sm font-bold text-slate-900 ${isCompleted ? 'line-through text-slate-500' : ''}`}>
                      {task.title}
                    </h3>
                  </div>

                  {/* Priority Tag */}
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      task.priority === 'Urgent'
                        ? 'bg-rose-50 text-rose-800 border border-rose-200'
                        : task.priority === 'Tinggi'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{task.description}</p>

                {/* Progress Bar & Slider */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Progress Pengerjaan:</span>
                    <span className="font-mono font-bold text-slate-900">{task.progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isCompleted ? 'bg-emerald-600' : 'bg-blue-900'
                      }`}
                      style={{ width: `${task.progressPercentage}%` }}
                    ></div>
                  </div>

                  {/* Quick progress slider for assignee */}
                  {task.assigneeId === currentUser.id && !isCompleted && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] text-slate-400">Update Cepat:</span>
                      {[25, 50, 75, 100].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleProgressChange(task, val)}
                          className="px-2 py-0.5 text-[10px] font-medium rounded bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-900 transition-colors"
                        >
                          {val === 100 ? 'Selesai (100%)' : `${val}%`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Metadata */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>PIC: <strong className="text-slate-800">{task.assigneeName}</strong></span>
                  </div>

                  <div className="flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Batas: {task.dueDate}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
