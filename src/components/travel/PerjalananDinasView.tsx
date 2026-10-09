import React, { useState } from 'react';
import {
  Plane,
  Plus,
  Search,
  FileText,
  Printer,
  CheckCircle2,
  Clock,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Receipt,
  X,
  Upload,
} from 'lucide-react';
import { useOffice } from '../../context/OfficeContext';
import { TravelRequest, TravelExpenseItem } from '../../types';
import { formatTanggalSurat } from '../../utils/formatDate';
import { ContentEditor } from '../common/ContentEditor';
import { renderRich } from '../common/RichText';

export const PerjalananDinasView: React.FC = () => {
  const {
    travelRequests,
    currentUser,
    submitTravelRequest,
    actOnTravelRequest,
    submitLPJ,
    verifyLPJ,
  } = useOffice();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedForSpdPreview, setSelectedForSpdPreview] = useState<TravelRequest | null>(null);
  const [selectedForLpjModal, setSelectedForLpjModal] = useState<TravelRequest | null>(null);

  // New Travel Request Form State
  const [destinationCity, setDestinationCity] = useState('');
  const [purpose, setPurpose] = useState('');
  const [departureDate, setDepartureDate] = useState(
    new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]
  );
  const [returnDate, setReturnDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [transportType, setTransportType] = useState<TravelRequest['transportType']>('Pesawat Udara');
  const [estimatedCost, setEstimatedCost] = useState(5500000);
  const [costCenter, setCostCenter] = useState('CC-DTI-104');
  const [wbsProjectCode, setWbsProjectCode] = useState('WBS-IT-DEV-2026');

  // LPJ Form State
  const [realizedCost, setRealizedCost] = useState(5200000);
  const [lpjNotes, setLpjNotes] = useState('');
  const [expenseItems, setExpenseItems] = useState<TravelExpenseItem[]>([
    { id: '1', category: 'Transport', description: 'Transportasi Utama', amount: 2500000, receiptName: 'E-Ticket_Garuda.pdf' },
    { id: '2', category: 'Penginapan', description: 'Hotel', amount: 1500000, receiptName: 'Hotel_Invoice.pdf' },
    { id: '3', category: 'Uang Harian', description: 'Makan', amount: 900000 },
    { id: '4', category: 'Transport', description: 'Transportasi Lokal', amount: 300000 },
    { id: '5', category: 'Transport', description: 'Bensin', amount: 0 },
  ]);

  // Komponen biaya estimasi (form pengajuan)
  const [costComponents, setCostComponents] = useState<{ id: string; name: string; amount: number }[]>([
    { id: 'cc-1', name: 'Transportasi Utama', amount: 2500000 },
    { id: 'cc-2', name: 'Hotel', amount: 1800000 },
    { id: 'cc-3', name: 'Makan', amount: 750000 },
    { id: 'cc-4', name: 'Transportasi Lokal', amount: 350000 },
    { id: 'cc-5', name: 'Bensin', amount: 100000 },
  ]);

  const costComponentTotal = costComponents.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const expenseTotal = expenseItems.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  const updateCostComponent = (id: string, patch: Partial<{ name: string; amount: number }>) =>
    setCostComponents((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const addCostComponent = () =>
    setCostComponents((prev) => [...prev, { id: `cc-${Date.now()}`, name: '', amount: 0 }]);

  const removeCostComponent = (id: string) =>
    setCostComponents((prev) => prev.filter((c) => c.id !== id));

  const updateExpenseItem = (id: string, patch: Partial<TravelExpenseItem>) =>
    setExpenseItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const addExpenseItem = () =>
    setExpenseItems((prev) => [
      ...prev,
      { id: `exp-${Date.now()}`, category: 'Lainnya', description: '', amount: 0 },
    ]);

  const removeExpenseItem = (id: string) =>
    setExpenseItems((prev) => prev.filter((i) => i.id !== id));

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinationCity || !purpose) return;

    submitTravelRequest({
      destinationCity,
      purpose,
      departureDate,
      returnDate,
      transportType,
      estimatedCost: Number(estimatedCost),
      costCenter,
      wbsProjectCode,
      costComponents: costComponents
        .filter((c) => c.name.trim())
        .map((c) => ({ name: c.name.trim(), amount: Number(c.amount) || 0 })),
    });

    setIsNewModalOpen(false);
    setDestinationCity('');
    setPurpose('');
    setCostComponents((prev) => prev.map((c) => ({ ...c, amount: 0 })));
  };

  const handleLpjSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForLpjModal) return;

    const realized = Number(realizedCost) || 0;
    const diff = (selectedForLpjModal.estimatedCost || 0) - realized;

    submitLPJ(selectedForLpjModal.id, {
      realizedCost: realized,
      differenceAmount: diff,
      notes: lpjNotes || 'LPJ diajukan lengkap beserta bukti pembayaran digital.',
      items: expenseItems
        .filter((i) => i.description.trim())
        .map((i) => ({ ...i, amount: Number(i.amount) || 0 })),
    });

    setSelectedForLpjModal(null);
    setLpjNotes('');
  };

  const filteredTravel = travelRequests.filter((item) => {
    const matchSearch =
      item.requestNumber.toLowerCase().includes(search.toLowerCase()) ||
      (item.spdNumber && item.spdNumber.toLowerCase().includes(search.toLowerCase())) ||
      item.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      item.destinationCity.toLowerCase().includes(search.toLowerCase());

    const matchStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Title & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Perjalanan Dinas Terpadu (SPD & LPJ)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Integrasi tanpa input ganda: Pengajuan → Surat Tugas & SPD Otomatis → LPJ Biaya → Posting SAP FICO.
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" /> Ajukan Perjalanan Dinas
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nomor SPD, pengajuan, kota tujuan, atau nama pegawai..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none w-full md:w-auto"
        >
          <option value="all">Semua Status Perjalanan</option>
          <option value="Diajukan">Diajukan</option>
          <option value="Disetujui Atasan">Disetujui Atasan</option>
          <option value="SPD Diterbitkan">SPD Diterbitkan</option>
          <option value="LPJ Diajukan">LPJ Diajukan</option>
          <option value="Selesai / Posted SAP">Selesai / Posted SAP</option>
        </select>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">No. Pengajuan / SPD</th>
                <th className="px-4 py-3">Pegawai Yang Ditugaskan</th>
                <th className="px-4 py-3">Kota Tujuan & Maksud</th>
                <th className="px-4 py-3">Jadwal & Moda Transport</th>
                <th className="px-4 py-3">Estimasi Biaya / SAP CC</th>
                <th className="px-4 py-3">Status Dokumen</th>
                <th className="px-4 py-3 text-right">Aksi & Dokumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredTravel.map((item) => {
                const canApproveAtasan =
                  (currentUser.role === 'Atasan' || currentUser.role === 'Direksi') &&
                  item.status === 'Diajukan';

                const canIssueSpd =
                  (currentUser.role === 'Direksi' || currentUser.role === 'Admin Sekretariat' || currentUser.role === 'Super Admin') &&
                  (item.status === 'Disetujui Atasan' || item.status === 'Disetujui Direksi');

                const canSubmitLpj =
                  item.employeeId === currentUser.id &&
                  (item.status === 'SPD Diterbitkan' || item.status === 'Sedang Berlangsung' || item.status === 'Menunggu LPJ');

                const canVerifyFinance =
                  (currentUser.role === 'Finance' || currentUser.role === 'Super Admin') &&
                  item.status === 'LPJ Diajukan';

                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Number */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.spdNumber ? (
                        <div>
                          <span className="font-mono font-bold text-slate-900 block">{item.spdNumber}</span>
                          <span className="text-[10px] text-slate-400 font-mono">Ref ST: {item.suratTugasNumber}</span>
                        </div>
                      ) : (
                        <div>
                          <span className="font-mono font-bold text-slate-700">{item.requestNumber}</span>
                          <span className="text-[10px] text-slate-400 block">Menunggu Penerbitan SPD</span>
                        </div>
                      )}
                    </td>

                    {/* Employee */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{item.employeeName}</div>
                      <div className="text-[11px] text-slate-500">{item.employeeTitle}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{item.employeeNip}</span>
                    </td>

                    {/* Destination & Purpose */}
                    <td className="px-4 py-3 max-w-[240px]">
                      <span className="font-bold text-slate-900 block">{item.destinationCity}</span>
                      <div className="text-[11px] text-slate-600 line-clamp-2">{renderRich(item.purpose)}</div>
                    </td>

                    {/* Schedule */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono text-slate-800 font-medium block">
                        {item.departureDate} s/d {item.returnDate}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {item.durationDays} hari · {item.transportType}
                      </span>
                    </td>

                    {/* Cost */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-bold text-slate-900 block font-mono">
                        Rp {item.estimatedCost.toLocaleString('id-ID')}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        CC: {item.costCenter} · {item.wbsProjectCode}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded ${
                          item.status === 'Selesai / Posted SAP'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : item.status === 'SPD Diterbitkan'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : item.status === 'LPJ Diajukan'
                            ? 'bg-purple-50 text-purple-800 border border-purple-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {item.status}
                      </span>
                      {item.sapPostingId && (
                        <span className="text-[9px] font-mono text-emerald-700 block mt-0.5 font-bold">
                          SAP: {item.sapPostingId}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.spdNumber && (
                          <button
                            onClick={() => setSelectedForSpdPreview(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg font-medium transition-colors"
                            title="Pratinjau Lembar SPD & Surat Tugas"
                          >
                            <FileText className="w-3.5 h-3.5" /> Cetak SPD
                          </button>
                        )}

                        {canApproveAtasan && (
                          <button
                            onClick={() => actOnTravelRequest(item.id, 'approve_atasan')}
                            className="px-2.5 py-1 text-[11px] font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded shadow-xs"
                          >
                            Setujui Atasan
                          </button>
                        )}

                        {canIssueSpd && (
                          <button
                            onClick={() => actOnTravelRequest(item.id, 'issue_spd')}
                            className="px-2.5 py-1 text-[11px] font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded shadow-xs"
                          >
                            Terbitkan SPD & Surat Tugas
                          </button>
                        )}

                        {canSubmitLpj && (
                          <button
                            onClick={() => {
                              setSelectedForLpjModal(item);
                              setRealizedCost(item.estimatedCost);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded shadow-xs"
                          >
                            <Receipt className="w-3 h-3" /> Input LPJ
                          </button>
                        )}

                        {canVerifyFinance && (
                          <button
                            onClick={() =>
                              verifyLPJ(item.id, 'Kuitansi verified sesuai standar biaya korporat. Posted to SAP FICO.')
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded shadow-xs"
                          >
                            <ShieldCheck className="w-3 h-3" /> Verifikasi & Post SAP
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Form Pengajuan Perjalanan Dinas */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Form Pengajuan Perjalanan Dinas</h3>
                <p className="text-xs text-slate-500">Surat Tugas & SPD akan terbit otomatis tanpa input ganda</p>
              </div>
              <button onClick={() => setIsNewModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="flex flex-col min-h-0 flex-1">
              <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kota / Tempat Tujuan</label>
                  <input
                    type="text"
                    required
                    value={destinationCity}
                    onChange={(e) => setDestinationCity(e.target.value)}
                    placeholder="Contoh: Surabaya, Jawa Timur"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Moda Transportasi</label>
                  <select
                    value={transportType}
                    onChange={(e) => setTransportType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Pesawat Udara">Pesawat Udara</option>
                    <option value="Kereta Api">Kereta Api</option>
                    <option value="Mobil Dinas">Mobil Dinas Operasional</option>
                    <option value="Travel / Darat">Travel / Kendaraan Darat</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Maksud / Keperluan Dinas</label>
                <ContentEditor
                  rows={4}
                  required
                  value={purpose}
                  onChange={setPurpose}
                  placeholder="Uraikan agenda dinas dan target pencapaian..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Berangkat</label>
                  <input
                    type="date"
                    required
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Kembali</label>
                  <input
                    type="date"
                    required
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Rincian Komponen Biaya Estimasi */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900 block text-xs">
                    Komponen Biaya Estimasi
                  </span>
                  <button
                    type="button"
                    onClick={() => setEstimatedCost(costComponentTotal)}
                    className="text-[11px] font-semibold text-blue-800 hover:text-blue-950 bg-blue-50 border border-blue-200 hover:border-blue-400 px-2 py-1 rounded transition-colors"
                  >
                    Samakan Total dengan Komponen (Rp{' '}
                    <span className="font-mono">{costComponentTotal.toLocaleString('id-ID')}</span>)
                  </button>
                </div>

                <div className="space-y-1.5">
                  {costComponents.map((cc) => (
                    <div key={cc.id} className="grid grid-cols-12 gap-2 items-center">
                      <input
                        type="text"
                        value={cc.name}
                        onChange={(e) => updateCostComponent(cc.id, { name: e.target.value })}
                        placeholder="Nama komponen biaya"
                        className="col-span-5 px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-900"
                      />
                      <div className="relative col-span-6">
                        <span className="absolute left-2.5 top-1.5 text-[11px] text-slate-400 font-mono">
                          Rp
                        </span>
                        <input
                          type="number"
                          min={0}
                          value={cc.amount}
                          onChange={(e) => updateCostComponent(cc.id, { amount: Number(e.target.value) })}
                          placeholder="0"
                          className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-900"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCostComponent(cc.id)}
                        className="col-span-1 justify-self-end p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Hapus komponen"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={addCostComponent}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-800 hover:text-blue-950 bg-white border border-blue-200 hover:border-blue-400 px-2 py-1 rounded transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Komponen Manual
                  </button>
                  <span className="text-[11px] text-slate-500">
                    Total komponen:{' '}
                    <b className="font-mono text-slate-800">
                      Rp {costComponentTotal.toLocaleString('id-ID')}
                    </b>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Estimasi Biaya Total (Rp)</label>
                  <input
                    type="number"
                    required
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Bisa diisi manual atau disamakan dengan total komponen di atas.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cost Center (SAP CC)</label>
                  <input
                    type="text"
                    required
                    value={costCenter}
                    onChange={(e) => setCostCenter(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">WBS / Project Code</label>
                  <input
                    type="text"
                    required
                    value={wbsProjectCode}
                    onChange={(e) => setWbsProjectCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>
              </div>

              <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-slate-200 bg-white shrink-0">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Kirim Pengajuan Dinas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Dokumen Resmi SPD & Surat Tugas Siap Cetak */}
      {selectedForSpdPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50 no-print">
              <span className="text-xs font-bold text-slate-800">
                Surat Perintah Perjalanan Dinas (SPD) & Surat Tugas
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
                >
                  <Printer className="w-3.5 h-3.5" /> Cetak Lembar SPD
                </button>
                <button
                  onClick={() => setSelectedForSpdPreview(null)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 sm:p-12 overflow-y-auto bg-slate-100 flex justify-center">
              <div className="w-full max-w-[680px] bg-white p-8 sm:p-10 border border-slate-300 shadow-xs text-xs space-y-6">
                {/* Kop SPD */}
                <div className="border-b-2 border-slate-900 pb-3 text-center">
                  <h1 className="font-bold text-sm tracking-tight text-slate-900 uppercase">
                    PT BADAN INDUSTRI NUSANTARA (PERSERO)
                  </h1>
                  <p className="text-[11px] text-slate-600">
                    SURAT PERINTAH PERJALANAN DINAS (SPD) RESMI
                  </p>
                  <p className="text-[10px] font-mono text-slate-800 mt-1 font-bold">
                    NOMOR: {selectedForSpdPreview.spdNumber}
                  </p>
                </div>

                {/* Table Breakdown */}
                <table className="w-full border-collapse border border-slate-300 text-xs">
                  <tbody>
                    <tr>
                      <td className="border border-slate-300 p-2 font-semibold w-1/3 bg-slate-50">1. Pejabat Yang Berwenang</td>
                      <td className="border border-slate-300 p-2">Direktur Utama PT BIN</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-2 font-semibold bg-slate-50">2. Nama Pegawai / NIP</td>
                      <td className="border border-slate-300 p-2 font-bold">
                        {selectedForSpdPreview.employeeName} ({selectedForSpdPreview.employeeNip})
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-2 font-semibold bg-slate-50">3. Jabatan & Unit Kerja</td>
                      <td className="border border-slate-300 p-2">
                        {selectedForSpdPreview.employeeTitle} - {selectedForSpdPreview.unit}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-2 font-semibold bg-slate-50">4. Maksud Perjalanan Dinas</td>
                      <td className="border border-slate-300 p-2">{renderRich(selectedForSpdPreview.purpose)}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-2 font-semibold bg-slate-50">5. Moda Transportasi</td>
                      <td className="border border-slate-300 p-2">{selectedForSpdPreview.transportType}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-2 font-semibold bg-slate-50">6. Tempat Berangkat / Tujuan</td>
                      <td className="border border-slate-300 p-2">Jakarta → {selectedForSpdPreview.destinationCity}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-2 font-semibold bg-slate-50">7. Lama Perjalanan</td>
                      <td className="border border-slate-300 p-2">
                        {selectedForSpdPreview.durationDays} Hari ({selectedForSpdPreview.departureDate} s/d {selectedForSpdPreview.returnDate})
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-2 font-semibold bg-slate-50">8. Beban Anggaran (Cost Center)</td>
                      <td className="border border-slate-300 p-2 font-mono">
                        {selectedForSpdPreview.costCenter} (WBS: {selectedForSpdPreview.wbsProjectCode})
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-8 pt-6">
                  <div>
                    <p className="text-[11px] text-slate-500">Pegawai Yang Ditugaskan:</p>
                    <div className="h-14"></div>
                    <p className="font-bold text-slate-900">{selectedForSpdPreview.employeeName}</p>
                    <p className="text-[10px] text-slate-500 font-mono">NIP: {selectedForSpdPreview.employeeNip}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-[11px] text-slate-500">
                      Jakarta, {formatTanggalSurat(selectedForSpdPreview.approvedDate || '4 Oktober 2026')}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-900">An. Direksi PT BIN</p>
                    <div className="h-10 flex items-center justify-end">
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ✓ Ditandatangani Elektronik
                      </span>
                    </div>
                    <p className="font-bold text-slate-900">Ir. H. Hendrawan Suprayogi, M.M.</p>
                    <p className="text-[10px] text-slate-500">Direktur Utama</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Form Input LPJ Biaya Perjalanan Dinas */}
      {selectedForLpjModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Laporan Pertanggungjawaban (LPJ) Dinas</h3>
                <p className="text-xs text-slate-500">SPD: {selectedForLpjModal.spdNumber}</p>
              </div>
              <button onClick={() => setSelectedForLpjModal(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLpjSubmit} className="flex flex-col min-h-0 flex-1 text-xs">
              <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
              <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tujuan:</span>
                  <span className="font-semibold text-slate-900">{selectedForLpjModal.destinationCity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Uang Muka / Estimasi Awal:</span>
                  <span className="font-mono font-bold text-slate-900">
                    Rp {selectedForLpjModal.estimatedCost.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Realisasi Biaya Aktual (Rp)
                </label>
                <input
                  type="number"
                  required
                  value={realizedCost}
                  onChange={(e) => setRealizedCost(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>

              {/* Difference Calculation */}
              <div
                className={`p-3 rounded-lg border flex justify-between items-center ${
                  selectedForLpjModal.estimatedCost >= realizedCost
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <span>
                  {selectedForLpjModal.estimatedCost >= realizedCost
                    ? 'Kelebihan Uang Muka (Disetor ke Perusahaan):'
                    : 'Kekurangan Biaya (Klaim Penggantian):'}
                </span>
                <span className="font-mono font-bold text-sm">
                  Rp {Math.abs(selectedForLpjModal.estimatedCost - realizedCost).toLocaleString('id-ID')}
                </span>
              </div>

              {/* Expense Items Breakdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 block">Rincian Komponen Biaya & Kuitansi:</span>
                  <button
                    type="button"
                    onClick={() => setRealizedCost(expenseTotal)}
                    className="text-[11px] font-semibold text-blue-800 hover:text-blue-950 bg-blue-50 border border-blue-200 hover:border-blue-400 px-2 py-1 rounded transition-colors"
                  >
                    Samakan Realisasi dengan Rincian (Rp{' '}
                    <span className="font-mono">{expenseTotal.toLocaleString('id-ID')}</span>)
                  </button>
                </div>

                <div className="space-y-1.5">
                  {expenseItems.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateExpenseItem(item.id, { description: e.target.value })}
                        placeholder="Nama komponen biaya"
                        className="col-span-5 px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-900"
                      />
                      <div className="relative col-span-6">
                        <span className="absolute left-2.5 top-1.5 text-[11px] text-slate-400 font-mono">
                          Rp
                        </span>
                        <input
                          type="number"
                          min={0}
                          value={item.amount}
                          onChange={(e) => updateExpenseItem(item.id, { amount: Number(e.target.value) })}
                          placeholder="0"
                          className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-900"
                        />
                      </div>
                      <div className="col-span-1 justify-self-end flex items-center gap-1">
                        {item.receiptName && (
                          <span
                            className="text-emerald-600"
                            title={`Kuitansi: ${item.receiptName}`}
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeExpenseItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Hapus komponen"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={addExpenseItem}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-800 hover:text-blue-950 bg-white border border-blue-200 hover:border-blue-400 px-2 py-1 rounded transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Komponen Manual
                  </button>
                  <span className="text-[11px] text-slate-500">
                    Total rincian:{' '}
                    <b className="font-mono text-slate-800">Rp {expenseTotal.toLocaleString('id-ID')}</b>
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Pertanggungjawaban</label>
                <ContentEditor
                  rows={3}
                  required
                  value={lpjNotes}
                  onChange={setLpjNotes}
                  placeholder="Keterangan realisasi anggaran dan hasil kegiatan..."
                />
              </div>
              </div>

              <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-slate-200 bg-white shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedForLpjModal(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Submit LPJ ke Verifikasi Keuangan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
