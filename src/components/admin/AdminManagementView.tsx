import React, { useState } from 'react';
import {
  Users,
  Building2,
  GitBranch,
  Hash,
  FileCode,
  Shield,
  Settings,
  Database,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Save,
  Lock,
  ArrowRight,
  Clock,
  Server,
  Key,
  Sliders,
  Check,
  X,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useOffice } from '../../context/OfficeContext';
import {
  User,
  UserRole,
  UnitKerja,
  WorkflowConfig,
  OutgoingLetterType,
  NumberingRuleConfig,
  DocumentTemplate,
} from '../../types';

export const AdminManagementView: React.FC = () => {
  const {
    currentUser,
    users,
    units,
    workflowConfigs,
    systemSettings,
    rolePermissions,
    numberingRules,
    templates,
    addUser,
    updateUser,
    deleteUser,
    addUnit,
    updateUnit,
    deleteUnit,
    addWorkflowConfig,
    updateWorkflowConfig,
    deleteWorkflowConfig,
    addNumberingRule,
    updateNumberingRule,
    deleteNumberingRule,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    updateSystemSettings,
    updateRolePermission,
    exportAllDataAsJSON,
    importDataFromJSON,
    resetAllToInitial,
  } = useOffice();

  const [activeTab, setActiveTab] = useState<
    'users' | 'units' | 'workflows' | 'numbering' | 'templates' | 'rbac' | 'system' | 'backup'
  >('users');

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitKerja | null>(null);

  const [workflowModalOpen, setWorkflowModalOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<WorkflowConfig | null>(null);

  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<NumberingRuleConfig | null>(null);

  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);

  // User form
  const [userForm, setUserForm] = useState({
    name: '',
    nip: '',
    title: '',
    unit: 'DTI',
    department: 'Divisi Teknologi Informasi',
    email: '',
    phone: '',
    role: 'User' as UserRole,
  });

  // Unit form
  const [unitForm, setUnitForm] = useState({
    code: '',
    name: '',
    headName: '',
    headUserId: '',
    email: '',
    phone: '',
    memberCount: 10,
  });

  // System Settings local form
  const [sysForm, setSysForm] = useState(systemSettings);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Workflow form
  const [wfForm, setWfForm] = useState<{
    documentType: OutgoingLetterType | 'Surat Masuk' | 'Perjalanan Dinas' | 'Cuti';
    name: string;
    description: string;
    steps: { stepNumber: number; roleRequired: UserRole; title: string; slaDays: number }[];
    isActive: boolean;
  }>({
    documentType: 'Surat Dinas',
    name: '',
    description: '',
    isActive: true,
    steps: [
      { stepNumber: 1, roleRequired: 'Atasan', title: 'Review Atasan Pengusul', slaDays: 1 },
      { stepNumber: 2, roleRequired: 'Admin Sekretariat', title: 'Verifikasi Sekper', slaDays: 1 },
      { stepNumber: 3, roleRequired: 'Direksi', title: 'Persetujuan & TTE Direktur Utama', slaDays: 1 },
    ],
  });

  // Numbering form
  const [ruleForm, setRuleForm] = useState<NumberingRuleConfig>({
    unitCode: 'BIN-SEK',
    typeCode: 'SK',
    pattern: '{SEQ}/{UNIT}/{TYPE}/{ROMAN_MONTH}/{YEAR}',
    currentSequence: 50,
    year: 2026,
    resetYearly: true,
  });

  // Template form
  const [tplForm, setTplForm] = useState<Partial<DocumentTemplate>>({
    name: '',
    code: '',
    type: 'Surat Dinas',
    description: '',
    defaultSubject: '',
    defaultContent: '',
    defaultLampiran: '-',
    defaultTembusan: 'Arsip',
    version: 'v1.0',
    isActive: true,
  });

  // User modal open handler
  const handleOpenUserModal = (u?: User) => {
    if (u) {
      setEditingUser(u);
      setUserForm({
        name: u.name,
        nip: u.nip,
        title: u.title,
        unit: u.unit,
        department: u.department,
        email: u.email,
        phone: u.phone,
        role: u.role,
      });
    } else {
      setEditingUser(null);
      setUserForm({
        name: '',
        nip: `BIN-2026${Math.floor(1000 + Math.random() * 9000)}`,
        title: 'Staf Operasional',
        unit: 'DTI',
        department: 'Divisi Teknologi Informasi',
        email: '',
        phone: '0812-0000-0000',
        role: 'User',
      });
    }
    setUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name || !userForm.nip) return;

    if (editingUser) {
      updateUser(editingUser.id, userForm);
    } else {
      addUser(userForm);
    }
    setUserModalOpen(false);
  };

  // Unit modal open handler
  const handleOpenUnitModal = (u?: UnitKerja) => {
    if (u) {
      setEditingUnit(u);
      setUnitForm({ ...u });
    } else {
      setEditingUnit(null);
      setUnitForm({
        code: 'BIN-NEW',
        name: '',
        headName: '',
        headUserId: 'usr-3',
        email: 'unit@bin.co.id',
        phone: '021-5299-8800',
        memberCount: 10,
      });
    }
    setUnitModalOpen(true);
  };

  const handleSaveUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitForm.code || !unitForm.name) return;

    if (editingUnit) {
      updateUnit(editingUnit.id, unitForm);
    } else {
      addUnit(unitForm);
    }
    setUnitModalOpen(false);
  };

  // Workflow save
  const handleSaveWorkflow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wfForm.name) return;

    if (editingWorkflow) {
      updateWorkflowConfig(editingWorkflow.id, wfForm);
    } else {
      addWorkflowConfig(wfForm);
    }
    setWorkflowModalOpen(false);
  };

  // Rule save
  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleForm.unitCode || !ruleForm.pattern) return;

    if (editingRule) {
      updateNumberingRule(editingRule.unitCode, editingRule.typeCode, ruleForm);
    } else {
      addNumberingRule(ruleForm);
    }
    setRuleModalOpen(false);
  };

  // Template save
  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tplForm.name || !tplForm.code) return;

    if (editingTemplate) {
      updateTemplate(editingTemplate.id, tplForm);
    } else {
      addTemplate(tplForm);
    }
    setTemplateModalOpen(false);
  };

  // Save system settings
  const handleSaveSystemSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSystemSettings(sysForm);
    setSaveSuccessMsg('Konfigurasi sistem & integrasi berhasil disimpan!');
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  // JSON Export & Download
  const handleDownloadBackup = () => {
    const jsonStr = exportAllDataAsJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Backup_eOffice_PT_BIN_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // JSON Restore
  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importDataFromJSON(content);
        if (ok) {
          alert('Data berhasil dipulihkan dari file JSON!');
        } else {
          alert('Gagal memulihkan data. Format berkas tidak valid.');
        }
      }
    };
    reader.readAsText(file);
  };

  // Search filtered users
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.nip.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Title & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Pusat Administrasi & Pengaturan Sistem e-Office
            </h2>
            <span className="text-[10px] font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
              SUPER ADMIN CONSOLE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengelolaan pengguna, hak akses RBAC, struktur organisasi, alur approval, format nomor surat, dan integrasi SAP/HRIS.
          </p>
        </div>
      </div>

      {/* Admin Nav Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
            activeTab === 'users'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Pengguna & Pegawai ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('units')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
            activeTab === 'units'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Struktur Unit Kerja ({units.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('workflows')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
            activeTab === 'workflows'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5" />
          <span>Alur Workflow ({workflowConfigs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('numbering')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
            activeTab === 'numbering'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Hash className="w-3.5 h-3.5" />
          <span>Penomoran Surat ({numberingRules.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
            activeTab === 'templates'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Template Dokumen ({templates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rbac')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
            activeTab === 'rbac'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Matriks Hak Akses (RBAC)</span>
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
            activeTab === 'system'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Pengaturan & Integrasi</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
            activeTab === 'backup'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Cadangan & Pemulihan Data</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: PENGGUNA & PEGAWAI                                      */}
      {/* ============================================================== */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama pegawai, NIP, jabatan, unit, atau peran..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
            </div>

            <button
              onClick={() => handleOpenUserModal()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Pegawai Baru
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Nama Pegawai & NIP</th>
                    <th className="px-4 py-3">Jabatan & Unit</th>
                    <th className="px-4 py-3">Peran Akses (RBAC)</th>
                    <th className="px-4 py-3">Kontak & Email</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <span className="font-mono text-[10px] text-slate-400">{u.nip}</span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{u.title}</div>
                        <span className="text-[11px] text-slate-500 font-mono">{u.unit} - {u.department}</span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold text-blue-900 bg-blue-50 border border-blue-200 rounded">
                          {u.role}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px] text-slate-600">
                        {u.email}
                        <span className="block text-[10px] text-slate-400">{u.phone}</span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Aktif
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenUserModal(u)}
                            className="p-1.5 text-slate-600 hover:text-blue-900 hover:bg-slate-100 rounded transition-colors"
                            title="Edit Data Pegawai"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Yakin ingin menonaktifkan/menghapus pegawai ${u.name}?`)) {
                                deleteUser(u.id);
                              }
                            }}
                            disabled={u.id === currentUser.id}
                            className={`p-1.5 rounded transition-colors ${
                              u.id === currentUser.id
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-400 hover:text-rose-700 hover:bg-rose-50'
                            }`}
                            title="Hapus Pegawai"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: STRUKTUR UNIT KERJA                                     */}
      {/* ============================================================== */}
      {activeTab === 'units' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <p className="text-xs text-slate-500">
              Daftar seluruh direktorat, divisi, dan bagian kerja resmi PT BIN.
            </p>
            <button
              onClick={() => handleOpenUnitModal()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Unit Kerja Baru
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {units.map((unit) => (
              <div
                key={unit.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {unit.code}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {unit.memberCount} Pegawai
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{unit.name}</h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Pimpinan Unit: <strong className="text-slate-800">{unit.headName}</strong>
                    </p>
                  </div>

                  <div className="text-[11px] text-slate-500 font-mono space-y-0.5 pt-1">
                    <p>Email: {unit.email}</p>
                    <p>Telepon: {unit.phone}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => handleOpenUnitModal(unit)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded font-medium transition-colors"
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Hapus unit kerja ${unit.name}?`)) {
                        deleteUnit(unit.id);
                      }
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 rounded font-medium transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: ALUR WORKFLOW APPROVAL                                  */}
      {/* ============================================================== */}
      {activeTab === 'workflows' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <p className="text-xs text-slate-500">
              Konfigurasi alur bertingkat persetujuan dokumen dinas tanpa perlu mengubah kode sumber.
            </p>
            <button
              onClick={() => {
                setEditingWorkflow(null);
                setWfForm({
                  documentType: 'Surat Dinas',
                  name: 'Alur Persetujuan Baru',
                  description: 'Deskripsi alur tahapan dokumen',
                  isActive: true,
                  steps: [
                    { stepNumber: 1, roleRequired: 'Atasan', title: 'Review Pertama', slaDays: 1 },
                    { stepNumber: 2, roleRequired: 'Direksi', title: 'Persetujuan Final', slaDays: 1 },
                  ],
                });
                setWorkflowModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Alur Approval
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workflowConfigs.map((wf) => (
              <div
                key={wf.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {wf.documentType}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        wf.isActive ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {wf.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{wf.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{wf.description}</p>
                  </div>

                  {/* Stepper overview */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Rantai Tahapan Persetujuan:
                    </span>
                    <div className="space-y-1.5">
                      {wf.steps.map((st) => (
                        <div
                          key={st.stepNumber}
                          className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-blue-900 text-white text-[10px] font-bold flex items-center justify-center">
                              {st.stepNumber}
                            </span>
                            <div>
                              <p className="font-semibold text-slate-900">{st.title}</p>
                              <span className="text-[10px] text-slate-500">Peran: {st.roleRequired}</span>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-slate-500">
                            SLA: {st.slaDays} hari
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => {
                      updateWorkflowConfig(wf.id, { isActive: !wf.isActive });
                    }}
                    className="text-xs text-slate-600 hover:text-slate-900 underline"
                  >
                    {wf.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingWorkflow(wf);
                        setWfForm({ ...wf });
                        setWorkflowModalOpen(true);
                      }}
                      className="px-2.5 py-1 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded font-medium"
                    >
                      Ubah Rantai
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Hapus konfigurasi alur ${wf.name}?`)) {
                          deleteWorkflowConfig(wf.id);
                        }
                      }}
                      className="px-2.5 py-1 text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 rounded font-medium"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: FORMAT PENOMORAN SURAT                                  */}
      {/* ============================================================== */}
      {activeTab === 'numbering' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <p className="text-xs text-slate-500">
              Format pola nomor otomatis per unit kerja dan jenis surat resmi PT BIN.
            </p>
            <button
              onClick={() => {
                setEditingRule(null);
                setRuleForm({
                  unitCode: 'BIN-DTI',
                  typeCode: 'ND',
                  pattern: '{SEQ}/{UNIT}/{TYPE}/{ROMAN_MONTH}/{YEAR}',
                  currentSequence: 1,
                  year: 2026,
                  resetYearly: true,
                });
                setRuleModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Aturan Penomoran
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Kode Unit</th>
                  <th className="px-4 py-3">Jenis Dokumen</th>
                  <th className="px-4 py-3">Pola Template Nomor</th>
                  <th className="px-4 py-3">Sequence Terkini</th>
                  <th className="px-4 py-3">Tahun Anggaran</th>
                  <th className="px-4 py-3">Reset Otomatis</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {numberingRules.map((rule, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono font-bold text-blue-900">{rule.unitCode}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{rule.typeCode}</td>
                    <td className="px-4 py-3 font-mono text-slate-800 font-bold">{rule.pattern}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">#{rule.currentSequence}</td>
                    <td className="px-4 py-3 font-mono">{rule.year}</td>
                    <td className="px-4 py-3">
                      <span className="text-emerald-700 font-medium">✓ Tiap 1 Januari</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setEditingRule(rule);
                          setRuleForm({ ...rule });
                          setRuleModalOpen(true);
                        }}
                        className="p-1 text-slate-600 hover:text-blue-900 rounded"
                        title="Edit Format"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: TEMPLATE DOKUMEN                                        */}
      {/* ============================================================== */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <p className="text-xs text-slate-500">
              Katalog naskah dinas, kop surat, klausul standar, dan teks placeholder baku.
            </p>
            <button
              onClick={() => {
                setEditingTemplate(null);
                setTplForm({
                  name: '',
                  code: `TPL-DOC-${templates.length + 1}`,
                  type: 'Surat Dinas',
                  description: '',
                  defaultSubject: '',
                  defaultContent: '',
                  defaultLampiran: '-',
                  defaultTembusan: 'Arsip',
                  version: 'v1.0',
                  isActive: true,
                });
                setTemplateModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Template Baru
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {tpl.code}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{tpl.version}</span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{tpl.name}</h3>
                    <p className="text-xs text-slate-500">{tpl.description}</p>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded text-[11px] text-slate-600 line-clamp-2">
                    {tpl.defaultContent}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                  <button
                    onClick={() => {
                      setEditingTemplate(tpl);
                      setTplForm({ ...tpl });
                      setTemplateModalOpen(true);
                    }}
                    className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded font-medium"
                  >
                    Edit Template
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Hapus template ${tpl.name}?`)) {
                        deleteTemplate(tpl.id);
                      }
                    }}
                    className="px-2.5 py-1 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded font-medium"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 6: MATRIKS HAK AKSES (RBAC MATRIX)                         */}
      {/* ============================================================== */}
      {activeTab === 'rbac' && (
        <div className="space-y-4">
          <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-xl text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-blue-950 font-bold">
              <Shield className="w-4 h-4 text-blue-800" />
              <span>Role-Based Access Control (RBAC) PT BIN</span>
            </div>
            <p className="text-blue-900 leading-relaxed">
              Anda dapat mencentang atau menghapus centang hak izin untuk setiap peran secara langsung. Perubahan akan segera berlaku di seluruh modul aplikasi.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Peran (Role)</th>
                    <th className="px-3 py-3 text-center">Buat Draft</th>
                    <th className="px-3 py-3 text-center">Approve</th>
                    <th className="px-3 py-3 text-center">Disposisi</th>
                    <th className="px-3 py-3 text-center">Terbit No</th>
                    <th className="px-3 py-3 text-center">TTE BSrE</th>
                    <th className="px-3 py-3 text-center">Buka Rahasia</th>
                    <th className="px-3 py-3 text-center">Kelola User</th>
                    <th className="px-3 py-3 text-center">Ekspor SPI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {rolePermissions.map((rp) => (
                    <tr key={rp.role} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-bold text-slate-900 block">{rp.role}</span>
                        <span className="text-[10px] text-slate-500">{rp.description}</span>
                      </td>

                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={rp.canCreateDoc}
                          onChange={(e) => updateRolePermission(rp.role, { canCreateDoc: e.target.checked })}
                          className="w-4 h-4 rounded text-blue-900 cursor-pointer"
                        />
                      </td>

                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={rp.canApprove}
                          onChange={(e) => updateRolePermission(rp.role, { canApprove: e.target.checked })}
                          className="w-4 h-4 rounded text-blue-900 cursor-pointer"
                        />
                      </td>

                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={rp.canDispose}
                          onChange={(e) => updateRolePermission(rp.role, { canDispose: e.target.checked })}
                          className="w-4 h-4 rounded text-blue-900 cursor-pointer"
                        />
                      </td>

                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={rp.canIssueNumber}
                          onChange={(e) => updateRolePermission(rp.role, { canIssueNumber: e.target.checked })}
                          className="w-4 h-4 rounded text-blue-900 cursor-pointer"
                        />
                      </td>

                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={rp.canSignTTE}
                          onChange={(e) => updateRolePermission(rp.role, { canSignTTE: e.target.checked })}
                          className="w-4 h-4 rounded text-blue-900 cursor-pointer"
                        />
                      </td>

                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={rp.canViewConfidential}
                          onChange={(e) => updateRolePermission(rp.role, { canViewConfidential: e.target.checked })}
                          className="w-4 h-4 rounded text-blue-900 cursor-pointer"
                        />
                      </td>

                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={rp.canManageUsers}
                          onChange={(e) => updateRolePermission(rp.role, { canManageUsers: e.target.checked })}
                          className="w-4 h-4 rounded text-blue-900 cursor-pointer"
                        />
                      </td>

                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={rp.canExportAudit}
                          onChange={(e) => updateRolePermission(rp.role, { canExportAudit: e.target.checked })}
                          className="w-4 h-4 rounded text-blue-900 cursor-pointer"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 7: PENGATURAN SISTEM & INTEGRASI                           */}
      {/* ============================================================== */}
      {activeTab === 'system' && (
        <form onSubmit={handleSaveSystemSettings} className="space-y-5">
          {saveSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* Section 1: Parameter Korporat */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              1. Parameter Umum & Keamanan Aplikasi
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Perusahaan Resmi</label>
                <input
                  type="text"
                  value={sysForm.companyName}
                  onChange={(e) => setSysForm({ ...sysForm, companyName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">URL Portal e-Office</label>
                <input
                  type="text"
                  value={sysForm.portalUrl}
                  onChange={(e) => setSysForm({ ...sysForm, portalUrl: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Batas Maksimal Lampiran Berkas (MB)</label>
                <input
                  type="number"
                  value={sysForm.maxAttachmentMb}
                  onChange={(e) => setSysForm({ ...sysForm, maxAttachmentMb: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Session Timeout (Menit)</label>
                <input
                  type="number"
                  value={sysForm.sessionTimeoutMinutes}
                  onChange={(e) => setSysForm({ ...sysForm, sessionTimeoutMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Teks Watermark Dokumen Rahasia</label>
                <input
                  type="text"
                  value={sysForm.confidentialWatermarkText}
                  onChange={(e) => setSysForm({ ...sysForm, confidentialWatermarkText: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="requireMfa"
                  checked={sysForm.requireMfa}
                  onChange={(e) => setSysForm({ ...sysForm, requireMfa: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-900 cursor-pointer"
                />
                <label htmlFor="requireMfa" className="text-xs font-semibold text-slate-800 cursor-pointer">
                  Wajibkan Autentikasi Ganda (MFA) untuk Akun Pejabat & Direksi
                </label>
              </div>
            </div>
          </div>

          {/* Section 2: Integrasi Eksternal (SAP, HRIS, BSrE) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              2. Status Integrasi Sistem Enterprise (SAP ERP, HRIS & BSrE)
            </h3>

            <div className="space-y-4 text-xs">
              {/* SAP Integration */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-blue-900" />
                    <span className="font-bold text-slate-900 text-xs">SAP ERP FICO (Modul SPD & Keuangan)</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> KONEKSI AKTIF
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Endpoint Posting API:</span>
                    <input
                      type="text"
                      value={sysForm.sapIntegration.endpoint}
                      onChange={(e) =>
                        setSysForm({
                          ...sysForm,
                          sapIntegration: { ...sysForm.sapIntegration, endpoint: e.target.value },
                        })
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-xs bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Environment:</span>
                    <select
                      value={sysForm.sapIntegration.environment}
                      onChange={(e) =>
                        setSysForm({
                          ...sysForm,
                          sapIntegration: { ...sysForm.sapIntegration, environment: e.target.value as any },
                        })
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                    >
                      <option value="Sandbox">Sandbox Testing</option>
                      <option value="Production">Production Live</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* HRIS Integration */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-900" />
                    <span className="font-bold text-slate-900 text-xs">HRIS Kepegawaian & Saldo Cuti</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> TERHUBUNG
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Endpoint Sinkronisasi Pegawai:</span>
                  <input
                    type="text"
                    value={sysForm.hrisIntegration.endpoint}
                    onChange={(e) =>
                      setSysForm({
                        ...sysForm,
                        hrisIntegration: { ...sysForm.hrisIntegration, endpoint: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-xs bg-white"
                  />
                </div>
              </div>

              {/* BSrE TTE */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-emerald-700" />
                    <span className="font-bold text-slate-900 text-xs">Penyelenggara TTE Tersertifikasi</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    BSrE BSSN VALID
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  {sysForm.bsreTteProvider.caName} · Status Sertifikat: <strong>{sysForm.bsreTteProvider.status}</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
            >
              <Save className="w-4 h-4" /> Simpan Perubahan Pengaturan
            </button>
          </div>
        </form>
      )}

      {/* ============================================================== */}
      {/* TAB 8: PEMELIHARAAN & CADANGAN DATA (BACKUP/RESTORE)           */}
      {/* ============================================================== */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 text-blue-900 rounded-lg">
                <Database className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">Cadangan Penuh Basis Data e-Office (JSON Export)</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Unduh salinan lengkap seluruh data persuratan, berkas registrasi, log audit, penomoran resmi, dan struktur organisasi ke dalam berkas standar JSON untuk arsip atau pemindahan sistem.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={handleDownloadBackup}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
              >
                <Download className="w-4 h-4" /> Unduh File Cadangan (.JSON)
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-900 rounded-lg">
                <Upload className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">Pemulihan Data Dari Berkas Cadangan</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Unggah berkas JSON cadangan yang telah diekspor sebelumnya untuk mengembalikan seluruh kondisi data persuratan dan alur kerja.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer">
                <Upload className="w-4 h-4 text-slate-500" />
                <span>Pilih Berkas Cadangan (.JSON)</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileRestore}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="bg-rose-50/60 rounded-xl border border-rose-200 shadow-xs p-6 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-100 text-rose-800 rounded-lg">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs">
                <h3 className="font-bold text-rose-950">Setel Ulang Data ke Kondisi Awal (Factory Reset)</h3>
                <p className="text-rose-800 leading-relaxed">
                  Tindakan ini akan mengosongkan seluruh perubahan dan mengembalikan database simulasi persuratan, disposisi, pegawai, dan nomor surat ke kondisi bawaan awal PT BIN.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  if (confirm('PERINGATAN: Seluruh data simulasi akan dikembalikan ke kondisi bawaan awal. Lanjutkan?')) {
                    resetAllToInitial();
                    alert('Data telah berhasil direset ke kondisi bawaan!');
                  }
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
              >
                <RefreshCw className="w-4 h-4" /> Reset Database Simulasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: Form Pegawai (Tambah / Edit)                            */}
      {/* ============================================================== */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                {editingUser ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'}
              </h3>
              <button onClick={() => setUserModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Induk Pegawai (NIP)</label>
                  <input
                    type="text"
                    required
                    value={userForm.nip}
                    onChange={(e) => setUserForm({ ...userForm, nip: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                  <input
                    type="text"
                    required
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    placeholder="Contoh: Dimas Pratama, S.Kom."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jabatan Struktural</label>
                  <input
                    type="text"
                    required
                    value={userForm.title}
                    onChange={(e) => setUserForm({ ...userForm, title: e.target.value })}
                    placeholder="Contoh: Staf Pengembangan Sistem"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Peran Akses (RBAC)</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="User">User (Pegawai / Staf)</option>
                    <option value="Atasan">Atasan (Kepala Divisi / Bagian)</option>
                    <option value="Admin Sekretariat">Admin Sekretariat</option>
                    <option value="Direksi">Direksi</option>
                    <option value="HR">HR (SDM)</option>
                    <option value="Finance">Finance (Keuangan)</option>
                    <option value="Auditor / SPI">Auditor / SPI</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Unit</label>
                  <select
                    value={userForm.unit}
                    onChange={(e) => setUserForm({ ...userForm, unit: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    {units.map((un) => (
                      <option key={un.code} value={un.code}>
                        {un.code} - {un.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Divisi</label>
                  <input
                    type="text"
                    required
                    value={userForm.department}
                    onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Dinas</label>
                  <input
                    type="email"
                    required
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    placeholder="nama@bin.co.id"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Telepon / WA</label>
                  <input
                    type="text"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Simpan Data Pegawai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: Form Unit Kerja (Tambah / Edit)                         */}
      {/* ============================================================== */}
      {unitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                {editingUnit ? 'Edit Unit Kerja' : 'Tambah Unit Kerja Baru'}
              </h3>
              <button onClick={() => setUnitModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUnit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Unit</label>
                  <input
                    type="text"
                    required
                    value={unitForm.code}
                    onChange={(e) => setUnitForm({ ...unitForm, code: e.target.value.toUpperCase() })}
                    placeholder="Contoh: DTI"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jumlah Anggota</label>
                  <input
                    type="number"
                    value={unitForm.memberCount}
                    onChange={(e) => setUnitForm({ ...unitForm, memberCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Unit / Divisi</label>
                <input
                  type="text"
                  required
                  value={unitForm.name}
                  onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
                  placeholder="Contoh: Divisi Logistik & Pengadaan"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Pimpinan / Kepala Unit</label>
                <input
                  type="text"
                  required
                  value={unitForm.headName}
                  onChange={(e) => setUnitForm({ ...unitForm, headName: e.target.value })}
                  placeholder="Nama pejabat pimpinan"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Unit</label>
                  <input
                    type="email"
                    value={unitForm.email}
                    onChange={(e) => setUnitForm({ ...unitForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Telepon Unit</label>
                  <input
                    type="text"
                    value={unitForm.phone}
                    onChange={(e) => setUnitForm({ ...unitForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setUnitModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Simpan Unit Kerja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: Form Alur Workflow (Tambah / Edit)                      */}
      {/* ============================================================== */}
      {workflowModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                {editingWorkflow ? 'Ubah Rantai Workflow Approval' : 'Buat Alur Workflow Baru'}
              </h3>
              <button onClick={() => setWorkflowModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWorkflow} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Dokumen</label>
                  <select
                    value={wfForm.documentType}
                    onChange={(e) => setWfForm({ ...wfForm, documentType: e.target.value as OutgoingLetterType })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Surat Dinas">Surat Dinas</option>
                    <option value="Nota Dinas">Nota Dinas</option>
                    <option value="Surat Tugas">Surat Tugas</option>
                    <option value="Surat Keputusan">Surat Keputusan</option>
                    <option value="Surat Edaran">Surat Edaran</option>
                    <option value="Memo Internal">Memo Internal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Alur Persetujuan</label>
                  <input
                    type="text"
                    required
                    value={wfForm.name}
                    onChange={(e) => setWfForm({ ...wfForm, name: e.target.value })}
                    placeholder="Contoh: Alur Surat Keluar Divisi"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={wfForm.description}
                  onChange={(e) => setWfForm({ ...wfForm, description: e.target.value })}
                  placeholder="Keterangan alur..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                ></textarea>
              </div>

              {/* Steps builder */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 block">Langkah Persetujuan Berjenjang:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextStepNum = wfForm.steps.length + 1;
                      setWfForm({
                        ...wfForm,
                        steps: [
                          ...wfForm.steps,
                          {
                            stepNumber: nextStepNum,
                            roleRequired: 'Atasan',
                            title: `Langkah ${nextStepNum}`,
                            slaDays: 1,
                          },
                        ],
                      });
                    }}
                    className="text-[11px] font-semibold text-blue-900 hover:underline"
                  >
                    + Tambah Langkah
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {wfForm.steps.map((st, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-12 gap-2 items-center">
                      <span className="col-span-1 font-bold font-mono text-center text-slate-700">
                        #{st.stepNumber}
                      </span>
                      <input
                        type="text"
                        value={st.title}
                        onChange={(e) => {
                          const updated = [...wfForm.steps];
                          updated[idx].title = e.target.value;
                          setWfForm({ ...wfForm, steps: updated });
                        }}
                        className="col-span-5 px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                        placeholder="Nama Tahap"
                      />
                      <select
                        value={st.roleRequired}
                        onChange={(e) => {
                          const updated = [...wfForm.steps];
                          updated[idx].roleRequired = e.target.value as UserRole;
                          setWfForm({ ...wfForm, steps: updated });
                        }}
                        className="col-span-4 px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                      >
                        <option value="Atasan">Atasan (Kadiv)</option>
                        <option value="Admin Sekretariat">Admin Sekper</option>
                        <option value="Direksi">Direksi (Dirut)</option>
                        <option value="HR">HR (SDM)</option>
                        <option value="Finance">Finance</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          if (wfForm.steps.length > 1) {
                            setWfForm({
                              ...wfForm,
                              steps: wfForm.steps
                                .filter((_, i) => i !== idx)
                                .map((s, newIdx) => ({ ...s, stepNumber: newIdx + 1 })),
                            });
                          }
                        }}
                        className="col-span-2 text-rose-600 hover:text-rose-800 text-[11px] text-center"
                      >
                        Hapus
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setWorkflowModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Simpan Alur Workflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: Form Penomoran Surat (Tambah / Edit)                    */}
      {/* ============================================================== */}
      {ruleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                {editingRule ? 'Edit Aturan Penomoran' : 'Tambah Aturan Penomoran'}
              </h3>
              <button onClick={() => setRuleModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Unit</label>
                  <input
                    type="text"
                    required
                    value={ruleForm.unitCode}
                    onChange={(e) => setRuleForm({ ...ruleForm, unitCode: e.target.value.toUpperCase() })}
                    placeholder="Contoh: BIN-SEK"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Jenis Surat</label>
                  <input
                    type="text"
                    required
                    value={ruleForm.typeCode}
                    onChange={(e) => setRuleForm({ ...ruleForm, typeCode: e.target.value.toUpperCase() })}
                    placeholder="Contoh: SK"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pola Format Nomor</label>
                <input
                  type="text"
                  required
                  value={ruleForm.pattern}
                  onChange={(e) => setRuleForm({ ...ruleForm, pattern: e.target.value })}
                  placeholder="{SEQ}/{UNIT}/{TYPE}/{ROMAN_MONTH}/{YEAR}"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Urut Terkini (Counter)</label>
                  <input
                    type="number"
                    value={ruleForm.currentSequence}
                    onChange={(e) => setRuleForm({ ...ruleForm, currentSequence: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tahun Anggaran</label>
                  <input
                    type="number"
                    value={ruleForm.year}
                    onChange={(e) => setRuleForm({ ...ruleForm, year: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setRuleModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Simpan Aturan Nomor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: Form Template Dokumen (Tambah / Edit)                   */}
      {/* ============================================================== */}
      {templateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                {editingTemplate ? 'Edit Template Dokumen' : 'Tambah Template Dokumen'}
              </h3>
              <button onClick={() => setTemplateModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Template</label>
                  <input
                    type="text"
                    required
                    value={tplForm.name}
                    onChange={(e) => setTplForm({ ...tplForm, name: e.target.value })}
                    placeholder="Contoh: Surat Edaran Hari Libur"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Template</label>
                  <input
                    type="text"
                    required
                    value={tplForm.code}
                    onChange={(e) => setTplForm({ ...tplForm, code: e.target.value.toUpperCase() })}
                    placeholder="Contoh: TPL-SE-02"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Default Perihal</label>
                <input
                  type="text"
                  required
                  value={tplForm.defaultSubject}
                  onChange={(e) => setTplForm({ ...tplForm, defaultSubject: e.target.value })}
                  placeholder="Perihal standar..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Isi Konten Baku Naskah</label>
                <textarea
                  rows={4}
                  required
                  value={tplForm.defaultContent}
                  onChange={(e) => setTplForm({ ...tplForm, defaultContent: e.target.value })}
                  placeholder="Narasi template resmi..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setTemplateModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Simpan Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
